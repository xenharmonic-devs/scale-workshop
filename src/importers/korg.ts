import { DEFAULT_NUMBER_OF_COMPONENTS, KORG } from "@/constants";
import { Interval } from "@/interval";
import ExtendedMonzo from "@/monzo";
import Scale from "@/scale";
import type { JSZipObject } from "jszip";
import { ZipImporter, type ImportResultFragment } from "./base";
import { mtof } from "xen-dev-utils"


export class KorgImporter extends ZipImporter {
  mnlgBinaryToCents(data: Uint8Array) : number[] {
    const centsOut = [];
    const tuningSize = data.length / 3;
    for (let i = 0; i < tuningSize; i++) {
      const datum = data.slice(i * 3, i * 3 + 3);
      const semitones = datum[0];
      const microtoneData = new Uint8Array([datum[2], datum[1]]);
      const microtones = new Uint16Array(microtoneData.buffer)[0] / 0x8000;
      centsOut.push((semitones + microtones) * 100);
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

    // use the first midi note as the root frequency
    let baseMts = cents[0] / 100;
    if (octaveFormat)
      baseMts += 60 // (in octave format, 9 semitones = A440 = 69)

    // derive frequency from A440
    const baseFrequency = mtof(baseMts);

    // normalize so scale starts on unison
    if (octaveFormat) {
      const negCents = cents.find((n:number) => n < 0);
      if (negCents !== undefined) {
        cents = cents.map((c) => Math.round((c - negCents) * 100) / 100);
      }
    } else {
      cents = cents.map((c) => Math.round((c - cents[0]) * 100) / 100);
    }

    // remove unison (but may have other unison lines to preserve mapping)
    cents.shift();

    // add period
    if (octaveFormat) 
      cents.push(1200);

    const scale = Scale.fromIntervalArray(
      cents.map(
        (c) =>
          new Interval(
            ExtendedMonzo.fromCents(c, DEFAULT_NUMBER_OF_COMPONENTS),
            "cents"
          )
      ),
      baseFrequency
    );

    const baseMidiNote = octaveFormat ? 60 : 0;

    return { scale, baseMidiNote };
  }
}
