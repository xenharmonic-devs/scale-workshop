import { DEFAULT_NUMBER_OF_COMPONENTS, MIDI_NOTE_NUMBER_OF_A4, KORG } from "@/constants";
import ExtendedMonzo from "@/monzo";
import { LINE_TYPE } from "@/parser";
import Scale from "@/scale";
import type { JSZipObject } from "jszip";
import { ZipImporter, type ImportResultFragment } from "./base";
import { mtof } from "../utils"

export class KorgImporter extends ZipImporter {
  mnlgBinaryToCents(data: Uint8Array) {
    const centsOut = [];
    const tuningSize = data.length / 3;
    for (let i = 0; i < tuningSize; i++) {
      const datum = data.slice(i * 3, i * 3 + 3);
      const hundreds = datum[0] * 100;
      const tensData = new Uint8Array([datum[2], datum[1]]);
      const tens = Math.round(
        (new Uint16Array(tensData.buffer)[0] / 0x8000) * 100
      );
      centsOut.push(hundreds + tens);
    }
    return centsOut;
  }

  async parseFile(file: JSZipObject): Promise<ImportResultFragment> {
    if (file.name.endsWith("info")) {
      const text = await file.async("string");
      const name = text.slice(
        text.indexOf("<Comment>") + 9,
        text.indexOf("</Comment>")
      );
      return { name };
    }

    if (!file.name.endsWith("_bin")) {
      return {};
    }

    const data = await file.async("uint8array");

    if (data.length % 3 !== 0) {
      throw new Error("Non-aligned cents data");
    }

    let cents = this.mnlgBinaryToCents(data);

    if (!cents.length) {
      throw new Error("Empty cents data");
    }

    const fileInOctaveFormat = cents.length === KORG.octaveSize;

    if (fileInOctaveFormat) {
      cents = cents.map((c) =>
        c > KORG.octaveSize * 200 ? c - KORG.maxCents : c
      );
    }

    // to always play at the right frequencies, we have to use the first midi note
    const octaveExp = fileInOctaveFormat
      ? cents[0] - 900
      : cents[0] - mtof(MIDI_NOTE_NUMBER_OF_A4) * 100;

    // derive frequency from A440
    const baseFrequency = mtof(MIDI_NOTE_NUMBER_OF_A4) * 2 ** (octaveExp / 1200);

    // normalize so scale starts on unison
    if (fileInOctaveFormat) {
      const negCents = Math.min(...cents);
      if (negCents < 0) cents = cents.map((c) => c - negCents);
    } else {
      cents = cents.map((c) => c - cents[0]);
    }

    // remove unison (but may have other unison lines to preserve mapping)
    cents.shift();

    // add period
    if (fileInOctaveFormat) cents.push(1200);

    const lineTypes = Array(cents.length).fill(LINE_TYPE.CENTS);

    const scale = Scale.fromIntervalArray(
      cents.map((c) =>
        ExtendedMonzo.fromCents(c, DEFAULT_NUMBER_OF_COMPONENTS)
      ),
      baseFrequency
    );

    const baseMidiNote = fileInOctaveFormat ? 60 : 0;

    return { scale, lineTypes, baseMidiNote };
  }
}
