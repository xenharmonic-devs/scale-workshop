import { arraysEqual } from "@/utils";
import { describe, it, expect } from "vitest";

import { KorgImporter } from "../korg";
import { MnlgtunsExporter, MnlgtunoExporter } from "../../exporters/korg";
import { getTestData } from "../../exporters/__tests__/test-data";
import { JSZipObject } from "jszip";

const CENTS_BINARY = new Uint8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 6, 76, 205, 5, 107, 251, 2, 39, 251, 0, 0, 0, 9, 0, 0, 10, 0, 0, 18, 76,
  205, 17, 107, 251, 14, 39, 251, 10, 9, 164, 21, 0, 0, 22, 0, 0, 30, 76, 205,
  29, 107, 251, 26, 39, 251, 22, 9, 164, 33, 0, 0, 34, 0, 0, 42, 76, 205, 41,
  107, 251, 38, 39, 251, 34, 9, 164, 45, 0, 0, 46, 0, 0, 54, 76, 205, 53, 107,
  251, 50, 39, 251, 46, 9, 164, 57, 0, 0, 58, 0, 0, 66, 76, 205, 65, 107, 251,
  62, 39, 251, 58, 9, 164, 69, 0, 0, 70, 0, 0, 78, 76, 205, 77, 107, 251, 74,
  39, 251, 70, 9, 164, 81, 0, 0, 82, 0, 0, 90, 76, 205, 89, 107, 251, 86, 39,
  251, 82, 9, 164, 93, 0, 0, 94, 0, 0, 102, 76, 205, 101, 107, 251, 98, 39, 251,
  94, 9, 164, 105, 0, 0, 106, 0, 0, 114, 76, 205, 113, 107, 251, 110, 39, 251,
  106, 9, 164, 117, 0, 0, 118, 0, 0, 126, 76, 205, 125, 107, 251, 122, 39, 251,
  118, 9, 164, 129, 0, 0, 130, 0, 0, 138, 76, 205, 137, 107, 251, 134, 39, 251,
  130, 9, 164, 141, 0, 0, 142, 0, 0, 150, 76, 205, 149, 107, 251, 146, 39, 251,
  142, 9, 164, 153, 0, 0, 154, 0, 0, 162, 76, 205, 161, 107, 251, 158, 39, 251,
  154, 9, 164, 165, 0, 0, 166, 0, 0, 174, 76, 205, 173, 107, 251, 170, 39, 251,
  166, 9, 164, 177, 0, 0, 178, 0, 0, 186, 76, 205, 185, 107, 251, 182, 39, 251,
]);

const CENTS_ARRAY = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 660, 584, 231, 0, 900, 1000, 1860, 1784, 1431,
  1008, 2100, 2200, 3060, 2984, 2631, 2208, 3300, 3400, 4260, 4184, 3831, 3408,
  4500, 4600, 5460, 5384, 5031, 4608, 5700, 5800, 6660, 6584, 6231, 5808, 6900,
  7000, 7860, 7784, 7431, 7008, 8100, 8200, 9060, 8984, 8631, 8208, 9300, 9400,
  10260, 10184, 9831, 9408, 10500, 10600, 11460, 11384, 11031, 10608, 11700,
  11800, 12660, 12584, 12231, 11808, 12900, 13000, 13860, 13784, 13431, 13008,
  14100, 14200, 15060, 14984, 14631, 14208, 15300, 15400, 16260, 16184, 15831,
  15408, 16500, 16600, 17460, 17384, 17031, 16608, 17700, 17800, 18660, 18584,
  18231,
];

describe("Korg importer", () => {
  it("can convert 'logue binary to cents", () => {
    const importer = new KorgImporter({} as Event);
    const cents = importer.mnlgBinaryToCents(CENTS_BINARY);
    expect(arraysEqual(cents, CENTS_ARRAY)).toBeTruthy();
  });

  it("is compatible with the exporter (.mnlgtuno)", async () => {
    const params = getTestData("Korg 'logue importer unit test v0.0.0");
    const exporter = new MnlgtunoExporter(params);
    const [zip, fileType] = exporter.getFileContents();

    const files: JSZipObject[] = [];
    zip.forEach((_, file) => {
      files.push(file);
    });

    const importer = new KorgImporter({} as Event);
    for (let i = 0; i < files.length; ++i) {
      const fragment = await importer.parseFile(files[i]);

      if ("name" in fragment) {
        // XXX: This is wrong. See #95 for a fix.
        expect(fragment.name).toBe("test");
      }
      if ("baseMidiNote" in fragment) {
        expect(fragment.baseMidiNote).toBe(60);
      }
      if ("lineTypes" in fragment) {
        // TODO: Missing unison linetype for some reason
        expect(
          arraysEqual(fragment.lineTypes, Array(12).fill("cents"))
        ).toBeTruthy();
      }
      if ("scale" in fragment) {
        // TODO: These make no sense. Investigate.
        for (let i = 0; i < fragment.scale.size; ++i) {
          // console.log(fragment.scale.getMonzo(i).toCents());
        }
        for (let i = 0; i < params.scale.size; ++i) {
          // console.log(params.scale.getMonzo(i).toCents());
        }

        // TODO: This seems broken. Investigate.
        // console.log(fragment.scale.baseFrequency);
      }
    }
  });

  it("is compatible with the exporter (.mnlgtuns)", async () => {
    const params = getTestData("Korg 'logue importer unit test v0.0.0");
    const exporter = new MnlgtunsExporter(params);
    const [zip, fileType] = exporter.getFileContents();

    const files: JSZipObject[] = [];
    zip.forEach((_, file) => {
      files.push(file);
    });

    const importer = new KorgImporter({} as Event);
    for (let i = 0; i < files.length; ++i) {
      const fragment = await importer.parseFile(files[i]);

      if ("name" in fragment) {
        // XXX: This is wrong. See #95 for a fix.
        expect(fragment.name).toBe("test");
      }
      if ("baseMidiNote" in fragment) {
        expect(fragment.baseMidiNote).toBe(0);
      }
      if ("lineTypes" in fragment) {
        // TODO: Missing unison linetype for some reason
        // TODO: Should be 128 long.
        expect(
          arraysEqual(fragment.lineTypes, Array(127).fill("cents"))
        ).toBeTruthy();
      }
      if ("scale" in fragment) {
        // TODO: These make no sense. Investigate.
        for (let i = 0; i < fragment.scale.size; ++i) {
          // console.log(fragment.scale.getMonzo(i).toCents());
        }
        for (let i = 0; i < params.scale.size; ++i) {
          // console.log(params.scale.getMonzo(i).toCents());
        }
        expect(fragment.scale.baseFrequency).toBeCloseTo(8.175798915643707);
      }
    }
  });
});
