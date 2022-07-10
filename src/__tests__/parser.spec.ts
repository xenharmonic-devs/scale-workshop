import { describe, it, expect } from "vitest";

import { parseChord, parseLine } from "../parser";
import ExtendedMonzo from "../monzo";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "../constants";
import { Interval } from "../interval";
import { Fraction } from "xen-dev-utils";
import Scale from "../scale";

describe("Line parser", () => {
  it("doesn't parse bare numbers", () => {
    expect(() => parseLine("42")).toThrow();
  });

  it("doesn't parse negative fractions", () => {
    expect(() => parseLine("-1/2")).toThrow();
  });

  it("parses N-of-EDO (negative)", () => {
    const result = parseLine("-2\\5");
    expect(
      result.equals(
        new Interval(
          ExtendedMonzo.fromEqualTemperament(
            new Fraction(-2, 5),
            new Fraction(2),
            DEFAULT_NUMBER_OF_COMPONENTS
          ),
          "equal temperament"
        )
      )
    ).toBeTruthy();
    expect(result.name).toBe("-2\\5");
    expect(result.type).toBe("equal temperament");
  });

  it("parses N-of-EDO (negative EDO)", () => {
    const result = parseLine("2\\-5");
    expect(
      result.equals(
        new Interval(
          ExtendedMonzo.fromEqualTemperament(
            new Fraction(2, 5),
            new Fraction(1, 2),
            DEFAULT_NUMBER_OF_COMPONENTS
          ),
          "equal temperament"
        )
      )
    ).toBeTruthy();
    expect(result.name).toBe("2\\-5");
    expect(result.type).toBe("equal temperament");
  });

  it("parses generalized N-of-EDO (fraction equave)", () => {
    const result = parseLine("5\\11<7/3>");
    expect(
      result.equals(
        new Interval(
          ExtendedMonzo.fromEqualTemperament(
            new Fraction(5, 11),
            new Fraction(7, 3),
            DEFAULT_NUMBER_OF_COMPONENTS
          ),
          "equal temperament"
        )
      )
    ).toBeTruthy();
    expect(result.type).toBe("equal temperament");
  });

  it("parses generalized N-of-EDO (integer equave)", () => {
    const result = parseLine("-7\\13<5>");
    expect(
      result.equals(
        new Interval(
          ExtendedMonzo.fromEqualTemperament(
            new Fraction(-7, 13),
            new Fraction(5),
            DEFAULT_NUMBER_OF_COMPONENTS
          ),
          "equal temperament"
        )
      )
    ).toBeTruthy();
    expect(result.type).toBe("equal temperament");
  });

  it("parses monzos", () => {
    const result = parseLine("[-1, 2, 3/2, 0>");
    const components = [new Fraction(-1), new Fraction(2), new Fraction(3, 2)];
    while (components.length < DEFAULT_NUMBER_OF_COMPONENTS) {
      components.push(new Fraction(0));
    }
    expect(
      result.equals(new Interval(new ExtendedMonzo(components), "monzo"))
    ).toBeTruthy();
    expect(result.name).toBe("[-1, 2, 3/2, 0>");
    expect(result.type).toBe("monzo");
  });

  it("parses composites (positive offset)", () => {
    const result = parseLine("3\\5 + 5.");
    expect(result.monzo.cents).toBeCloseTo(5);
    expect(result.name).toBe("3\\5");
    expect(result.type).toBe("equal temperament");
    result.monzo.cents = 0;
    const expected = new Interval(
      ExtendedMonzo.fromEqualTemperament(
        new Fraction(3, 5),
        new Fraction(2),
        DEFAULT_NUMBER_OF_COMPONENTS
      ),
      "equal temperament"
    );
    expect(result.equals(expected)).toBeTruthy();
  });

  it("parses composites (negative offset)", () => {
    const result = parseLine("3/2 - 1.955");
    expect(result.monzo.cents).toBeCloseTo(-1.955);
    expect(result.name).toBe("3/2");
    expect(result.type).toBe("ratio");
    result.monzo.cents = 0;
    const expected = new Interval(
      ExtendedMonzo.fromFraction(
        new Fraction(3, 2),
        DEFAULT_NUMBER_OF_COMPONENTS
      ),
      "ratio"
    );
    expect(result.equals(expected)).toBeTruthy();
  });

  it("parses ambiguous composites (unary minus vs. negative offset)", () => {
    const result = parseLine("3/1 + [-1>");
    expect(result.name).toBe("3/1 + [-1>");
    expect(result.type).toBe("monzo");
    expect(
      result.equals(
        new Interval(
          ExtendedMonzo.fromFraction(
            new Fraction(3, 2),
            DEFAULT_NUMBER_OF_COMPONENTS
          ),
          "ratio"
        )
      )
    ).toBeTruthy();
  });

  it("parses composites (any)", () => {
    const result = parseLine("3\\15 + 103/101 + 6.9");
    expect(result.name).toBe("3\\15 + 103/101 + 6.9");
    expect(result.type).toBe("any");
    const vector = Array(DEFAULT_NUMBER_OF_COMPONENTS).fill(new Fraction(0));
    vector[0] = new Fraction(3, 15);
    expect(
      result.equals(
        new Interval(
          new ExtendedMonzo(vector, new Fraction(103, 101), 6.9),
          "any"
        )
      )
    ).toBeTruthy();
  });
});

describe("Chord parser", () => {
  it("parses all line types and bare numbers", () => {
    const scale = Scale.fromChord(
      parseChord(
        "2 : 1300.1 : 2,7 : 7/3 : 11\\9 : 7\\8<3> : [0 1> : 3/1 - 1. : 4"
      )
    );
    expect(
      scale
        .getMonzo(0)
        .equals(ExtendedMonzo.fromNumber(1, DEFAULT_NUMBER_OF_COMPONENTS))
    ).toBeTruthy();
    scale.baseFrequency = 1000;
    const expected = [
      1059.52, 1350, 1166.67, 1166.53, 1307.53, 1500, 1499.13, 2000,
    ];
    for (let i = 0; i < scale.size; ++i) {
      expect(scale.getFrequency(i + 1)).toBeCloseTo(expected[i]);
    }
  });

  it("supports whitespace as a separator", () => {
    const cpsFactors = parseChord("1 3\t5\n7", /\s/);
    expect(cpsFactors[0].monzo.valueOf()).toBeCloseTo(1);
    expect(cpsFactors[1].monzo.valueOf()).toBeCloseTo(3);
    expect(cpsFactors[2].monzo.valueOf()).toBeCloseTo(5);
    expect(cpsFactors[3].monzo.valueOf()).toBeCloseTo(7);
  });
});
