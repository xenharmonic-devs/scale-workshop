import { describe, it, expect } from "vitest";

import ReaperExporter from "../reaper";

// @ts-ignore
import EXPECTED_CONTENT from "./reaper.txt?raw";
import { getTestData } from "./test-data";

describe("Reaper exporter", () => {
  it("can handle all line types", () => {
    const params = getTestData("Max/MSP exporter unit test v0.0.0");
    params.format = "name";
    params.integratePeriod = true;
    params.displayPeriod = true;
    const exporter = new ReaperExporter(params);
    const [contents, suffix] = exporter.getFileContentsAndSuffix();
    expect(contents).toBe(EXPECTED_CONTENT);
    expect(suffix).toBe(" NoteNames_name_p_exact");
  });
});
