import Fraction from "fraction.js";
import { describe, it, expect } from "vitest";

import { parseLine } from "../parser";
import ExtendedMonzo from "../monzo";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "../constants";
import { centsToNats } from "../utils";

describe("Line parser", () => {
  it("doesn't parse negative fractions", () => {
    expect(() => parseLine("-1/2")).toThrow();
  });

  it("parses N-of-EDO (negative)", () => {
    const result = parseLine("-2\\5");
    expect(
      result.equals(
        ExtendedMonzo.fromEqualTemperament(
          new Fraction(-2, 5),
          new Fraction(2),
          DEFAULT_NUMBER_OF_COMPONENTS
        )
      )
    ).toBeTruthy();
  });

  it("parses N-of-EDO (negative EDO)", () => {
    const result = parseLine("2\\-5");
    expect(
      result.equals(
        ExtendedMonzo.fromEqualTemperament(
          new Fraction(2, 5),
          new Fraction(1, 2),
          DEFAULT_NUMBER_OF_COMPONENTS
        )
      )
    ).toBeTruthy();
  });

  it("parses generalized N-of-EDO (fraction equave)", () => {
    const result = parseLine("5\\11<7/3>");
    expect(
      result.equals(
        ExtendedMonzo.fromEqualTemperament(
          new Fraction(5, 11),
          new Fraction(7, 3),
          DEFAULT_NUMBER_OF_COMPONENTS
        )
      )
    ).toBeTruthy();
  });

  it("parses generalized N-of-EDO (integer equave)", () => {
    const result = parseLine("-7\\13<5>");
    expect(
      result.equals(
        ExtendedMonzo.fromEqualTemperament(
          new Fraction(-7, 13),
          new Fraction(5),
          DEFAULT_NUMBER_OF_COMPONENTS
        )
      )
    ).toBeTruthy();
  });

  it("parses monzos", () => {
    const result = parseLine("[-1, 2, 3/2, 0>");
    const components = [new Fraction(-1), new Fraction(2), new Fraction(3, 2)];
    while (components.length < DEFAULT_NUMBER_OF_COMPONENTS) {
      components.push(new Fraction(0));
    }
    expect(result.equals(new ExtendedMonzo(components))).toBeTruthy();
  });

  it("parses composites (positive offset)", () => {
    const result = parseLine("3\\5 + 5.");
    expect(result.nats).toBeCloseTo(centsToNats(5));
    result.nats = 0;
    const expected = ExtendedMonzo.fromEqualTemperament(
      new Fraction(3, 5),
      new Fraction(2),
      DEFAULT_NUMBER_OF_COMPONENTS
    );
    expect(result.equals(expected)).toBeTruthy();
  });

  it("parses composites (negative offset)", () => {
    const result = parseLine("3/2 - 1.955");
    expect(result.nats).toBeCloseTo(centsToNats(-1.955));
    result.nats = 0;
    const expected = ExtendedMonzo.fromFraction(
      new Fraction(3, 2),
      DEFAULT_NUMBER_OF_COMPONENTS
    );
    expect(result.equals(expected)).toBeTruthy();
  });

  it("parses ambiguous composites (unary minus vs. negative offset)", () => {
    const result = parseLine("3/1 + [-1>");
    expect(
      result.equals(
        ExtendedMonzo.fromFraction(
          new Fraction(3, 2),
          DEFAULT_NUMBER_OF_COMPONENTS
        )
      )
    ).toBeTruthy();
  });
});
