import { arraysEqual } from "@/utils";
import Fraction from "fraction.js";
import { describe, it, expect, test } from "vitest";

import { ColorInterval, parseColorComma } from "../color";

describe("Color Notation intervals", () => {
  it("can be parsed from string", () => {
    const interval = ColorInterval.fromString("w5");
    expect(interval.stepspan).toBe(4);
    expect(interval.magnitude).toBe(0);
    expect(
      interval.offWhite.reduce((a, b) => Math.abs(a) + Math.abs(b), 0)
    ).toBe(0);
    expect(interval.poQu).toBe(0);
  });
  it("can supports magnitude, repeats and exponents", () => {
    const interval = ColorInterval.fromString("L1ooy^35");
    expect(interval.stepspan).toBe(4);
    expect(interval.magnitude).toBe(1);
    expect(
      arraysEqual(interval.offWhite, [0, 0, 3, 0, 2, 0, 0, 0, 0, 0, 0])
    ).toBeTruthy();
    expect(interval.poQu).toBe(0);
  });
  it("supports po and qu", () => {
    const interval = ColorInterval.fromString("wp5");
    expect(interval.stepspan).toBe(4);
    expect(interval.magnitude).toBe(0);
    expect(
      interval.offWhite.reduce((a, b) => Math.abs(a) + Math.abs(b), 0)
    ).toBe(0);
    expect(interval.poQu).toBe(1);
  });
  it("can be converted to a monzo", () => {
    const interval = new ColorInterval(
      2,
      0,
      [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      0
    );
    const monzo = interval.toExtendedMonzo(20);
    expect(monzo.toFraction().equals(new Fraction(5, 4))).toBeTruthy();
  });
});

const COMMAS = {
  Sawa: [8, -5],
  Lalawa: [-19, 12],

  Gubi: [4, -1, -1], // "16/15",
  Yoyo: [-3, -1, 2], // "25/24",
  Gugu: [0, 3, -2], // "27/25",
  Gu: [-4, 4, -1], // "81/80",
  Trigu: [7, 0, -3],
  Layobi: [-7, 3, 1],
  Triyo: [1, -5, 3],
  Quadgu: [3, 4, -4],
  Sagugu: [11, -4, -2],
  Laquinyo: [-10, -1, 5],
  Quingu: [-1, 8, -5],
  Tribiyo: [-6, -5, 6],
  Laquadyo: [-14, 3, 4],
  Saquadyo: [5, -9, 4],
  Sayo: [12, -9, 1],
  Layo: [-15, 8, 1],
  Sepgu: [2, 9, -7],
  Saquingu: [18, -4, -5],
  Saquadbigu: [17, 1, -8],
  Saquinyo: [9, -13, 5],
  Lasepyo: [-21, 3, 7],
  Sasepbigu: [23, 6, -14],
  "Sasa-quintrigu": [38, -2, -15],

  Zo: [2, -3, 0, 1], // 28/27
  Zozo: [-4, -1, 0, 2], // 49/48
  Ru: [6, -2, 0, -1], // 64/63
  Trizo: [-2, -4, 0, 3],
  Triru: [-1, 6, 0, -3],
  Latrizo: [-10, 1, 0, 3],
  Laruru: [-7, 8, 0, -2],
  Laquinzo: [-14, 0, 0, 5],
  Quinru: [3, 7, 0, -5],
  Laquadru: [-3, 9, 0, -4],
  Laru: [-13, 10, 0, -1],
  Lalu: [-6, 6, 0, 0, -1],
  Trilo: [-4, -4, 0, 0, 3],
  Thuthu: [9, -1, 0, 0, 0, -2],
  Latho: [-10, 4, 0, 0, 0, 1],
  Satritho: [0, -7, 0, 0, 0, 3],
};

describe("Color comma parser", () => {
  test.each(Object.entries(COMMAS))("parses %s correctly", (token, monzo) => {
    expect(
      arraysEqual(
        parseColorComma(token, 11)
          .vector.slice(0, monzo.length)
          .map((f) => f.valueOf()),
        monzo
      )
    ).toBeTruthy();
  });
});
