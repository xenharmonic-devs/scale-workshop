import { describe, it, expect } from "vitest";
import Fraction from "fraction.js";

import ExtendedMonzo from "../monzo";
import { ScaleLine } from "../scale-line";

describe("Scale line reverse parsing", () => {
  it("includes a denominator with integers", () => {
    const monzo = ExtendedMonzo.fromNumber(3, 2);
    const line = new ScaleLine(monzo, "ratio");
    expect(line.toString()).toBe("3/1");
  });

  it("can represent fractions", () => {
    const monzo = ExtendedMonzo.fromFraction(new Fraction(2347868, 1238973), 3);
    const line = new ScaleLine(monzo, "ratio");
    expect(line.toString()).toBe("2347868/1238973");
  });

  it("can represent unsafe fractions", () => {
    const monzo = new ExtendedMonzo([
      new Fraction(9999999999),
      new Fraction(-77777777777777),
    ]);
    const line = new ScaleLine(monzo, "ratio");
    expect(line.toString()).toBe("[9999999999, -77777777777777>");
  });

  it("can represent equal temperament", () => {
    const monzo = ExtendedMonzo.fromEqualTemperament(
      new Fraction(1, 5),
      new Fraction(4),
      1
    );
    const line = new ScaleLine(monzo, "equal temperament");
    expect(line.toString()).toBe("2\\5");
  });

  it("can represent equal temperament (preferred equave)", () => {
    const monzo = ExtendedMonzo.fromEqualTemperament(
      new Fraction(1, 5),
      new Fraction(4),
      1
    );
    const line = new ScaleLine(monzo, "equal temperament", undefined, {
      preferredEtEquave: new Fraction(4),
    });
    expect(line.name).toBe("1\\5<4>");
    expect(line.toString()).toBe("1\\5<4>");
  });

  it("can represent equal temperament (smaller preferred equave)", () => {
    const monzo = ExtendedMonzo.fromEqualTemperament(
      new Fraction(1, 5),
      new Fraction(9),
      2
    );
    const line = new ScaleLine(monzo, "equal temperament", undefined, {
      preferredEtEquave: new Fraction(3),
    });
    expect(line.name).toBe("2\\5<3>");
    expect(line.toString()).toBe("2\\5<3>");
  });

  it("can represent equal temperament (negative)", () => {
    const monzo = ExtendedMonzo.fromEqualTemperament(
      new Fraction(-3, 5),
      new Fraction(2),
      1
    );
    const line = new ScaleLine(monzo, "equal temperament");
    expect(line.toString()).toBe("-3\\5");
  });

  it("can represent generalized N-of-EDO (EDT)", () => {
    const monzo = ExtendedMonzo.fromEqualTemperament(
      new Fraction(7, 11),
      new Fraction(3),
      2
    );
    const line = new ScaleLine(monzo, "equal temperament");
    expect(line.toString()).toBe("7\\11<3>");
  });

  it("can represent generalized N-of-EDO (EDF)", () => {
    const monzo = ExtendedMonzo.fromEqualTemperament(
      new Fraction(7, 11),
      new Fraction(3, 2),
      2
    );
    const line = new ScaleLine(monzo, "equal temperament");
    expect(line.toString()).toBe("7\\11<3/2>");
  });

  it("can represent integer cents", () => {
    const monzo = ExtendedMonzo.fromCents(1234, 1);
    const line = new ScaleLine(monzo, "cents");
    expect(line.toString()).toBe("1234.");
  });

  it("can represent fractional cents", () => {
    const monzo = ExtendedMonzo.fromCents(1234.5671, 1);
    const line = new ScaleLine(monzo, "cents", undefined, {
      centsFractionDigits: 4,
    });
    expect(line.toString()).toBe("1234.5671");
  });

  it("can represent composite intervals (equal temperament)", () => {
    const monzo = new ExtendedMonzo([new Fraction(3, 5)], undefined, 7.7);
    const line = new ScaleLine(monzo, "equal temperament", "3\\5");
    expect(line.toString()).toBe("3\\5 + 7.7");
  });

  it("can represent composite intervals (fractions)", () => {
    const monzo = new ExtendedMonzo(
      [new Fraction(0)],
      new Fraction(5, 3),
      3.14
    );
    const line = new ScaleLine(monzo, "ratio", "5/3");
    expect(line.toString()).toBe("5/3 + 3.14");
  });

  it("can represent composite intervals (negative offset)", () => {
    const monzo = new ExtendedMonzo(
      [new Fraction(0)],
      new Fraction(5, 3),
      -3.14
    );
    const line = new ScaleLine(monzo, "ratio", "5/3");
    expect(line.toString()).toBe("5/3 - 3.14");
  });

  it("supports numerator preferences", () => {
    const monzo = ExtendedMonzo.fromFraction(new Fraction(5, 3), 3);
    const line = new ScaleLine(monzo, "ratio", undefined, {
      preferredNumerator: 10,
    });
    expect(line.name).toBe("10/6");
    expect(line.toString()).toBe("10/6");
  });

  it("supports denominator preferences", () => {
    const monzo = ExtendedMonzo.fromFraction(new Fraction(5, 3), 3);
    const line = new ScaleLine(monzo, "ratio", undefined, {
      preferredDenominator: 9,
    });
    expect(line.name).toBe("15/9");
    expect(line.toString()).toBe("15/9");
  });

  it("supports edo preferences (octaves)", () => {
    const monzo = ExtendedMonzo.fromFraction(new Fraction(1, 4), 3);
    const line = new ScaleLine(monzo, "equal temperament", undefined, {
      preferredEtDenominator: 11,
    });
    expect(line.name).toBe("-22\\11");
    expect(line.toString()).toBe("-22\\11");
  });

  it("supports edo preferences (generic)", () => {
    const monzo = ExtendedMonzo.fromEqualTemperament(
      new Fraction(1, 4),
      new Fraction(2),
      1
    );
    const line = new ScaleLine(monzo, "equal temperament", undefined, {
      preferredEtDenominator: 12,
    });
    expect(line.toString()).toBe("3\\12");
  });

  it("supports edo preferences (negative)", () => {
    const monzo = ExtendedMonzo.fromEqualTemperament(
      new Fraction(1, 3),
      new Fraction(1, 2),
      1
    );
    const line = new ScaleLine(monzo, "equal temperament", undefined, {
      preferredEtDenominator: -3,
    });
    expect(line.toString()).toBe("1\\-3");
  });

  it("supports equal temperament denominator preferences (EDT)", () => {
    const monzo = ExtendedMonzo.fromEqualTemperament(
      new Fraction(1, 5),
      new Fraction(3),
      2
    );
    const line = new ScaleLine(monzo, "equal temperament", undefined, {
      preferredEtDenominator: 10,
    });
    expect(line.toString()).toBe("2\\10<3>");
  });
});
