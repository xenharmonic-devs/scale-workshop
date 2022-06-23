import { describe, it, expect } from "vitest";

import MaxMSPExporter from "../max-msp";

import EXPECTED_CONTENT from "./max-msp.txt?raw";
import { getTestData } from "./test-data";

describe("Max/MSP exporter", () => {
  it("can handle all line types", () => {
    const params = getTestData("Max/MSP exporter unit test v0.0.0");
    const exporter = new MaxMSPExporter(params);
    expect(exporter.getFileContents()).toBe(EXPECTED_CONTENT);
  });
});
