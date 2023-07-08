import { createHash } from "crypto";
import type { JSZipObject } from "jszip";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "../../constants";
import { Scale } from "scale-workshop-core";
import { describe, it, expect } from "vitest";

import { KorgExporter, KorgModels } from "../korg";

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

    const exporter = new KorgExporter(params, KorgModels.MINILOGUE, true);
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
          "O6YaWtzo33MdIBcMRYlVq7PnzuoMd5Yyp6sBT/3oDnc="
        );
      }
      // Other contents didn't seem to have issues so we ignore them here.
    }
  });

  it("can handle all line types (mnlgtuns)", async () => {
    const params = getTestData("Korg 'logue exporter unit test v0.0.0");

    const exporter = new KorgExporter(params, KorgModels.MINILOGUE, true);
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
          "Ps5Ddp9lBYZgCn7Y8aSBnhXOcfIm+sh9AcnybiLX4Zg="
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

  it("can handle all line types (mnlgtuno)", async () => {
    const params = getTestData("Korg 'logue exporter unit test v0.0.0");
    const exporter = new KorgExporter(params, KorgModels.MINILOGUE, false);
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
          "hnBNRPHvVHYkBfgM/ss+wTqd2Sy4UQ6bBk8aJqQWPzI="
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
