import { createHash } from "crypto";
import type { JSZipObject } from "jszip";
import { describe, it, expect } from "vitest";

import { MnlgtunsExporter, MnlgtunoExporter } from "../korg";

import { getTestData } from "./test-data";

describe("Korg exporters", () => {
  it("can handle all line types (mnlgtuns)", async () => {
    const params = getTestData("Korg 'logue exporter unit test v0.0.0");
    const exporter = new MnlgtunsExporter(params);
    const [zip, fileType] = exporter.getFileContents();

    expect(fileType).toBe(".mnlgtuns");

    // Await inside forEach doesn't reach vitest so we unpack
    const files: [string, JSZipObject][] = [];
    zip.forEach((path, file) => {
      files.push([path, file]);
    });

    // Generated zipfiles have timestamps that interfere with testing so we extract the contents
    for (let i = 0; i < files.length; ++i) {
      const [path, file] = files[i];
      if (path.endsWith("bin")) {
        const content = await file.async("uint8array");
        expect(createHash("sha256").update(content).digest("base64")).toBe(
          "uuwCgV4PYizHsTL1D8ST8Msxb6rPhcCKONeGCtw2sGQ="
        );
      } else {
        const content = await file.async("string");
        if (path === "TunS_000.TunS_info") {
          expect(content).toBe(
            "<minilogue_TuneScaleInformation><Programmer>ScaleWorkshop</Programmer><Comment>test</Comment></minilogue_TuneScaleInformation>"
          );
        } else {
          expect(content).toBe(
            '<KorgMSLibrarian_Data><Product>minilogue</Product><Contents NumProgramData="0" NumPresetInformation="0" NumTuneScaleData="1" NumTuneOctData="0"><TuneScaleData><Information>TunS_000.TunS_info</Information><TuneScaleBinary>TunS_000.TunS_bin</TuneScaleBinary></TuneScaleData></Contents></KorgMSLibrarian_Data>'
          );
        }
      }
    }

    return;
  });

  it("can handle all line types (mnlgtuno)", async () => {
    const params = getTestData("Korg 'logue exporter unit test v0.0.0");
    const exporter = new MnlgtunoExporter(params);
    const [zip, fileType] = exporter.getFileContents();

    expect(fileType).toBe(".mnlgtuno");

    // Await inside forEach doesn't reach vitest so we unpack
    const files: [string, JSZipObject][] = [];
    zip.forEach((path, file) => {
      files.push([path, file]);
    });

    // Generated zipfiles have timestamps that interfere with testing so we extract the contents
    for (let i = 0; i < files.length; ++i) {
      const [path, file] = files[i];
      if (path.endsWith("bin")) {
        const content = await file.async("uint8array");
        expect(createHash("sha256").update(content).digest("base64")).toBe(
          "02IsbILhm1WdhAR2l5rdvbDLD9/uL5/o7OYQECwMlhY="
        );
      } else {
        const content = await file.async("string");
        if (path === "TunO_000.TunO_info") {
          expect(content).toBe(
            "<minilogue_TuneOctInformation><Programmer>ScaleWorkshop</Programmer><Comment>test</Comment></minilogue_TuneOctInformation>"
          );
        } else {
          expect(content).toBe(
            '<KorgMSLibrarian_Data><Product>minilogue</Product><Contents NumProgramData="0" NumPresetInformation="0" NumTuneScaleData="0" NumTuneOctData="1"><TuneOctData><Information>TunO_000.TunO_info</Information><TuneOctBinary>TunO_000.TunO_bin</TuneOctBinary></TuneOctData></Contents></KorgMSLibrarian_Data>'
          );
        }
      }
    }

    return;
  });
});
