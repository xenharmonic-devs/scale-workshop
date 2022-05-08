import { describe, it, expect } from "vitest";

import KontaktExporter from "../kontakt";

import EXPECTED_CONTENT from "./kontakt.txt?raw";
import { getTestData } from "./test-data";

describe("Max/MSP exporter", () => {
  it("can handle all line types", () => {
    const params = getTestData(
      "Kontakt tuning script exporter unit test v0.0.0"
    );
    const exporter = new KontaktExporter(params);
    expect(exporter.getFileContents()).toBe(EXPECTED_CONTENT);
  });
});
