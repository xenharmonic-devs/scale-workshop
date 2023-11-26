import { createHash } from "crypto";
import type { JSZipObject } from "jszip";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "../../constants";
import { ExtendedMonzo, Interval, Scale } from "scale-workshop-core";
import { describe, it, expect } from "vitest";

import { KorgExporter, KorgModels, KorgExporterError } from "../korg";

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

    const exporter = new KorgExporter(params, KorgModels.MINILOGUE, false);
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
          "LvpKRSKkPVHun2VShSXSBx5zWy52voZcZGduTSVmeEY="
        );
      }
      // Other contents didn't seem to have issues so we ignore them here.
    }
  });

  it("can handle all line types (mnlgtuns)", async () => {
    const params = getTestData("Korg 'logue exporter unit test v0.0.0");

    const exporter = new KorgExporter(params, KorgModels.MINILOGUE, false);
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
          "z7mQ6pS8tVYimN2B5V3WIgN7NR4lFMwrlIjxKJkWEss="
        );
      } else {
        const content = await file.async("string");
        if (path === "TunS_000.TunS_info") {
          expect(content).toBe(
            '<?xml version="1.0" encoding="UTF-8"?>\n\n<minilogue_TuneScaleInformation>\n  <Programmer>ScaleWorkshop</Programmer>\n  <Comment>Test Scale</Comment>\n</minilogue_TuneScaleInformation>\n'
          );
        } else {
          expect(content).toBe(
            '<?xml version="1.0" encoding="UTF-8"?>\n\n<KorgMSLibrarian_Data>\n  <Product>minilogue</Product>\n  <Contents NumProgramData="0" NumPresetInformation="0" NumTuneScaleData="1"\n            NumTuneOctData="0">\n    <TuneScaleData>\n      <Information>TunS_000.TunS_info</Information>\n      <TuneScaleBinary>TunS_000.TunS_bin</TuneScaleBinary>\n    </TuneScaleData>\n  </Contents>\n</KorgMSLibrarian_Data>\n'
          );
        }
      }
    }

    return;
  });

  it("throws error if 12-note octave tuning is selected, but equave is not 2/1", () => {
    const params = getTestData("Korg 'logue exporter unit test v0.0.0");
    params.scale.equave = new Interval(
      ExtendedMonzo.fromCents(100.0, 3),
      "cents"
    );
    expect(
      () => new KorgExporter(params, KorgModels.MINILOGUE, true)
    ).toThrowError(KorgExporterError.OCTAVE_INVALID_EQUAVE);
  });

  it("throws error if 12-note octave tuning is selected, but scale does not have 12 notes", () => {
    const params = getTestData("Korg 'logue exporter unit test v0.0.0");
    expect(
      () => new KorgExporter(params, KorgModels.MINILOGUE, true)
    ).toThrowError(KorgExporterError.OCTAVE_INVALID_SIZE);
  });

  it("throws error if 12-note octave tuning is selected, but scale contains an interval that is below unison", () => {
    const params = getTestData("Korg 'logue exporter unit test v0.0.0");
    params.scale.intervals.splice(
      1,
      0,
      new Interval(ExtendedMonzo.fromCents(-500.0, 3), "cents")
    );

    // Make sure there's 12 notes in the test scale
    while (params.scale.intervals.length < 12)
      params.scale.intervals.splice(
        1,
        0,
        new Interval(ExtendedMonzo.fromCents(100.0, 3), "cents")
      );

    expect(
      () => new KorgExporter(params, KorgModels.MINILOGUE, true)
    ).toThrowError(KorgExporterError.OCTAVE_INVALID_INTERVAL);
  });

  it("throws error if 12-note octave tuning is selected, but scale contains an interval that is greater than an octave", () => {
    const params = getTestData("Korg 'logue exporter unit test v0.0.0");
    params.scale.intervals.splice(
      1,
      0,
      new Interval(ExtendedMonzo.fromCents(1300.0, 3), "cents")
    );

    // Make sure there's 12 notes in the test scale
    while (params.scale.intervals.length < 12)
      params.scale.intervals.splice(
        1,
        0,
        new Interval(ExtendedMonzo.fromCents(100.0, 3), "cents")
      );

    expect(
      () => new KorgExporter(params, KorgModels.MINILOGUE, true)
    ).toThrowError(KorgExporterError.OCTAVE_INVALID_INTERVAL);
  });

  it("can handle all line types (mnlgtuno)", async () => {
    const params = getTestData("Korg 'logue exporter unit test v0.0.0");

    // Make sure there's 12 notes in the test scale
    while (params.scale.intervals.length < 12)
      params.scale.intervals.splice(
        1,
        0,
        new Interval(ExtendedMonzo.fromCents(100.0, 3), "cents")
      );

    const exporter = new KorgExporter(params, KorgModels.MINILOGUE, true);
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
          "XwQptSiZLUa8LL/41LEeN1fUNvFr8GUptkga2k+tYJE="
        );
      } else {
        const content = await file.async("string");
        if (path === "TunO_000.TunO_info") {
          expect(content).toBe(
            '<?xml version="1.0" encoding="UTF-8"?>\n\n<minilogue_TuneOctInformation>\n  <Programmer>ScaleWorkshop</Programmer>\n  <Comment>Test Scale</Comment>\n</minilogue_TuneOctInformation>\n'
          );
        } else {
          expect(content).toBe(
            '<?xml version="1.0" encoding="UTF-8"?>\n\n<KorgMSLibrarian_Data>\n  <Product>minilogue</Product>\n  <Contents NumProgramData="0" NumPresetInformation="0" NumTuneScaleData="0"\n            NumTuneOctData="1">\n    <TuneOctData>\n      <Information>TunO_000.TunO_info</Information>\n      <TuneOctBinary>TunO_000.TunO_bin</TuneOctBinary>\n    </TuneOctData>\n  </Contents>\n</KorgMSLibrarian_Data>\n'
          );
        }
      }
    }

    return;
  });
});
