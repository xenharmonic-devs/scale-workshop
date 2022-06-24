import { DEFAULT_NUMBER_OF_COMPONENTS, KORG } from "@/constants";
import ExtendedMonzo from "@/monzo";
import { LINE_TYPE } from "@/parser";
import Scale from "@/scale";
import type { JSZipObject } from "jszip";
import { ZipImporter, type ImportResultFragment } from "./base";

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

    const octaveFormat = cents.length === KORG.mnlg.octaveSize;

    if (octaveFormat) {
      cents = cents.map((c) =>
        c > KORG.mnlg.octaveSize * 200 ? c - KORG.mnlg.maxCents : c
      );
    }

    // to always play at the right frequencies, we have to use the first midi note
    const octaveExp = octaveFormat
      ? cents[0] - 900
      : cents[0] - KORG.mnlg.refA.val;

    // derive frequency from A440
    const baseFrequency = KORG.mnlg.refA.freq * 2 ** (octaveExp / 1200);

    // normalize so scale starts on unison
    if (octaveFormat) {
      const negCents = Math.min(...cents);
      if (negCents < 0) cents = cents.map((c) => c - negCents);
    } else {
      cents = cents.map((c) => c - cents[0]);
    }

    // remove unison (but may have other unison lines to preserve mapping)
    cents.shift();

    // add period
    if (octaveFormat) cents.push(1200);

    const lineTypes = Array(cents.length).fill(LINE_TYPE.CENTS);

    const scale = Scale.fromIntervalArray(
      cents.map((c) =>
        ExtendedMonzo.fromCents(c, DEFAULT_NUMBER_OF_COMPONENTS)
      ),
      baseFrequency
    );

    const baseMidiNote = octaveFormat ? 60 : 0;

    return { scale, lineTypes, baseMidiNote };
  }
}
