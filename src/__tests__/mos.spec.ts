import { describe, it, expect, test } from "vitest";
import Fraction from "fraction.js";

import { arraysEqual } from "../utils";
import { mos, mosSizes, euclid } from "../mos";

describe("Moment of Symmetry step generator", () => {
  it("produces the major pentatonic scale for 2L 3s", () => {
    expect(arraysEqual(mos(2, 3), [1, 2, 4, 5, 7])).toBeTruthy();
  });
  it("supports UDP modes with 2L 4s", () => {
    // Observe how the numbers in the array keep getting bigger and "brighter"
    expect(arraysEqual(mos(2, 4, 2, 1, 0), [1, 2, 4, 5, 6, 8])).toBeTruthy();
    expect(arraysEqual(mos(2, 4, 2, 1, 2), [1, 3, 4, 5, 7, 8])).toBeTruthy();
    expect(arraysEqual(mos(2, 4, 2, 1, 4), [2, 3, 4, 6, 7, 8])).toBeTruthy();
    expect(arraysEqual(mos(2, 4, 2, 1, 6), [2, 3, 5, 6, 7, 8])).toBeTruthy();
  });
  it("produces the locrian scale for 5L 2s", () => {
    expect(arraysEqual(mos(5, 2), [1, 3, 5, 6, 8, 10, 12])).toBeTruthy();
  });
  it("produces the sothic mode for semihard smitonic scale in 26edo", () => {
    expect(arraysEqual(mos(4, 3, 5, 2), [5, 7, 12, 14, 19, 21, 26]));
  });
});

describe("Moment of Symmetry scale size calculator", () => {
  it("produces the correct pattern for pythagorean temperament", () => {
    expect(
      arraysEqual(
        mosSizes(Math.log(3) / Math.LN2, undefined, 6),
        [2, 3, 5, 7, 12, 29]
      )
    ).toBeTruthy();
  });
  it("produces the correct pattern for meantone temperament", () => {
    expect(
      arraysEqual(
        mosSizes(Math.log(5) / 4 / Math.LN2, undefined, 6),
        [2, 5, 7, 12, 19, 31]
      )
    ).toBeTruthy();
  });
  it("can handle exact ratios representable using floating point numbers", () => {
    expect(arraysEqual(mosSizes(3 / 16), [4, 5, 11, 16])).toBeTruthy();
  });
  it("can handle exact ratios", () => {
    expect(
      arraysEqual(mosSizes(new Fraction(5 / 11)), [7, 9, 11])
    ).toBeTruthy();
  });
});

const MOS_PATTERNS = {
  "1L 4s": "ssLss",
  "2L 3s": "sLsLs",
  "3L 2s": "LsLsL",
  "4L 1s": "LLsLL",
  "1L 5s": "Lsssss",
  "2L 4s": "sLssLs",
  "3L 3s": "LsLsLs",
  "4L 2s": "LsLLsL",
  "5L 1s": "LLLLLs",
  "1L 6s": "sssLsss",
  "2L 5s": "sLsssLs",
  "3L 4s": "sLsLsLs",
  "4L 3s": "LsLsLsL",
  "5L 2s": "LLsLLLs",
  "6L 1s": "LLLsLLL",
  "1L 7s": "Lsssssss",
  "2L 6s": "LsssLsss",
  "3L 5s": "sLssLsLs",
  "4L 4s": "LsLsLsLs",
  "5L 3s": "LsLLsLsL",
  "6L 2s": "LLLsLLLs",
  "7L 1s": "LLLLLLLs",
  "1L 8s": "ssssLssss",
  "2L 7s": "ssLsssLss",
  "3L 6s": "sLssLssLs",
  "4L 5s": "LsLsLsLss",
  "5L 4s": "LsLsLsLsL",
  "6L 3s": "LsLLsLLsL",
  "7L 2s": "LLsLLLsLL",
  "8L 1s": "LLLLsLLLL",
  "1L 9s": "Lsssssssss",
  "2L 8s": "ssLssssLss",
  "3L 7s": "LssLssLsss",
  "4L 6s": "sLsLssLsLs",
  "5L 5s": "LsLsLsLsLs",
  "6L 4s": "LsLsLLsLsL",
  "7L 3s": "LLLsLLsLLs",
  "8L 2s": "LLsLLLLsLL",
  "9L 1s": "LLLLLLLLLs",
  "1L 10s": "sssssLsssss",
  "2L 9s": "ssLsssssLss",
  "3L 8s": "sLsssLsssLs",
  "4L 7s": "LssLsLssLss",
  "5L 6s": "sLsLsLsLsLs",
  "6L 5s": "LsLsLsLsLsL",
  "7L 4s": "LsLLsLsLLsL",
  "8L 3s": "LsLLLsLLLsL",
  "9L 2s": "LLsLLLLLsLL",
  "10L 1s": "LLLLLsLLLLL",
  "1L 11s": "Lsssssssssss",
  "2L 10s": "LsssssLsssss",
  "3L 9s": "LsssLsssLsss",
  "4L 8s": "sLssLssLssLs",
  "5L 7s": "LsLsLssLsLss",
  "6L 6s": "LsLsLsLsLsLs",
  "7L 5s": "LLsLsLLsLsLs",
  "8L 4s": "LsLLsLLsLLsL",
  "9L 3s": "LLLsLLLsLLLs",
  "10L 2s": "LLLLLsLLLLLs",
  "11L 1s": "LLLLLLLLLLLs",
};

describe("Euclidean pattern generator", () => {
  test.each(Object.entries(MOS_PATTERNS))(
    "Matches with MOS %s",
    (key, acceptedPattern) => {
      const l = parseInt(key.split("L")[0]);
      const s = parseInt(key.split(" ")[1].slice(0, -1));
      let pattern = euclid(l, s)
        .map((i) => (i ? "L" : "s"))
        .join("");
      let passed = false;
      for (let i = 0; i < pattern.length; ++i) {
        if (pattern == acceptedPattern) {
          passed = true;
          break;
        }
        pattern = pattern.slice(-1) + pattern.slice(0, -1);
      }
      expect(passed).toBeTruthy();
    }
  );
});
