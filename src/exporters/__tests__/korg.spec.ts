import { createHash } from "crypto";
import type { JSZipObject } from "jszip";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "../../constants";
import { Scale } from "scale-workshop-core";
import { describe, it, expect } from "vitest";

import { MnlgtunsExporter, MnlgtunoExporter } from "../korg";

import { getTestData } from "./test-data";

describe("Korg exporters", () => {
  it("can export a scale encountered while debugging issue #393", async () => {
    const params = getTestData("Korg 'logue exporter unit test");
    params.baseMidiNote = 60;
    params.scale = Scale.fromSubharmonicSeries(
      24,
      12,
      DEFAULT_NUMBER_OF_COMPONENTS,
      256
    );

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
          "/st0f/90q1FNXxNnw2S+SCFeu9TkbXIydn85+qrqnrg="
        );
      }
      // Other contents didn't seem to have issues so we ignore them here.
    }
  });

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
          "nuHoVQKeaJlIHrNsaAcxFfoepmtzy+NN48LcfoU4fqE="
        );
      } else {
        const content = await file.async("string");
        if (path === "TunS_000.TunS_info") {
          expect(content).toBe(
            "<minilogue_TuneScaleInformation><Programmer>ScaleWorkshop</Programmer><Comment>Test Scale</Comment></minilogue_TuneScaleInformation>"
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
          "dQWlBBzfHE/LLvEhmAQqM1AppQg5YsoQ2GQbK6KTUeM="
        );
      } else {
        const content = await file.async("string");
        if (path === "TunO_000.TunO_info") {
          expect(content).toBe(
            "<minilogue_TuneOctInformation><Programmer>ScaleWorkshop</Programmer><Comment>Test Scale</Comment></minilogue_TuneOctInformation>"
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
