import { arraysEqual } from "@/utils";
import { describe, it, expect } from "vitest";

import {
  decodeKeyColors,
  decodeLines,
  encodeKeyColors,
  encodeLines,
} from "../urlEncode";

describe("URL encoder", () => {
  it("can encode all line types", () => {
    const lines = ["81/80", "-42.00", "2\\5", "700.01", "1,0723", "2/1"];
    expect(encodeLines(lines)).toBe("29F28_-16._2B5_jg.01_1C0k3_2F1");
  });

  it("can decode all line types", () => {
    const lines = decodeLines("29F28_-16._2B5_jg.01_1C0k3_2F1");
    const expected = ["81/80", "-42.", "2\\5", "700.01", "1,0723", "2/1"];
    expect(arraysEqual(lines, expected)).toBeTruthy();
  });

  it("can encode key colors", () => {
    const keyColors = ["blue", "black", "white", "black", "red", "red"];
    expect(encodeKeyColors(keyColors)).toBe("blue-~-red_red");
  });

  it("can decode key colors", () => {
    const keyColors = decodeKeyColors("blue-~-red_red");
    const expected = ["blue", "black", "white", "black", "red", "red"];
    expect(arraysEqual(keyColors, expected)).toBeTruthy();
  });
});
