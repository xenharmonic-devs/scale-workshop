import Fraction from "fraction.js";
import { describe, it, expect } from "vitest";

import { Interval, Quality } from "../pythagoras";

describe("Pythagorean intervals", () => {
  it("can be parsed from string", () => {
    const interval = Interval.fromString("P5");
    expect(interval.quality).toBe(Quality.Perfect);
    expect(interval.intervalClass).toBe(5);
    expect(interval.augmentations).toBe(0);
  });
  it("can be multi-augmented", () => {
    const interval = Interval.fromString("aaa4");
    expect(interval.quality).toBe(Quality.Augmented);
    expect(interval.intervalClass).toBe(4);
    expect(interval.augmentations).toBe(2);
  });
  it("can be half-diminished diminished", () => {
    const interval = Interval.fromString("hdd8");
    expect(interval.quality).toBe(Quality.HalfDiminished);
    expect(interval.intervalClass).toBe(8);
    expect(interval.augmentations).toBe(-1);
  });
  it("can be converted to a monzo", () => {
    const interval = new Interval(Quality.Neutral, 3);
    const monzo = interval.toExtendedMonzo(3);
    expect(monzo.vector[0].equals(new Fraction(-1, 2))).toBeTruthy();
    expect(monzo.vector[1].equals(new Fraction(1, 2))).toBeTruthy();
    expect(monzo.vector[2].equals(0)).toBeTruthy();
    expect(monzo.isEqualTemperament()).toBeTruthy();
  });
});
