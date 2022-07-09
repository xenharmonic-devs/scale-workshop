import { describe, it, expect } from "vitest";
import { Fraction, valueToCents } from "xen-dev-utils";

import ExtendedMonzo from "../monzo";

describe("Extended Monzo", () => {
  it("can be constructed from an integer", () => {
    const result = ExtendedMonzo.fromNumber(75, 3);
    expect(result.vector.length).toBe(3);
    expect(result.vector[0].equals(0)).toBeTruthy();
    expect(result.vector[1].equals(1)).toBeTruthy();
    expect(result.vector[2].equals(2)).toBeTruthy();
    expect(result.residual.equals(1)).toBeTruthy();
    expect(result.cents).toBe(0);
  });
  it("can be constructed from an integer with residual", () => {
    const result = ExtendedMonzo.fromNumber(75, 2);
    expect(result.vector.length).toBe(2);
    expect(result.vector[0].equals(0)).toBeTruthy();
    expect(result.vector[1].equals(1)).toBeTruthy();
    expect(result.residual.equals(25)).toBeTruthy();
    expect(result.cents).toBe(0);
  });
  it("can be constructed from a fraction", () => {
    const result = ExtendedMonzo.fromFraction(new Fraction(3, 2), 2);
    expect(result.vector.length).toBe(2);
    expect(result.vector[0].equals(-1)).toBeTruthy();
    expect(result.vector[1].equals(1)).toBeTruthy();
    expect(result.residual.equals(1)).toBeTruthy();
    expect(result.cents).toBe(0);
  });
  it("can be constructed from a fraction with residual", () => {
    const result = ExtendedMonzo.fromFraction(new Fraction(33, 28), 2);
    expect(result.vector.length).toBe(2);
    expect(result.vector[0].equals(-2)).toBeTruthy();
    expect(result.vector[1].equals(1)).toBeTruthy();
    expect(result.residual.equals(new Fraction(11, 7))).toBeTruthy();
    expect(result.cents).toBe(0);
  });
  it("can be constructed from cents", () => {
    const result = ExtendedMonzo.fromCents(1200, 0);
    expect(result.vector.length).toBe(0);
    expect(result.residual.equals(1)).toBeTruthy();
    expect(result.cents).toBe(1200);
  });
  it("can be constructed from n of edo", () => {
    const fifthOfTwelveEdo = new Fraction(7, 12);
    const octave = new Fraction(2);
    const result = ExtendedMonzo.fromEqualTemperament(
      fifthOfTwelveEdo,
      octave,
      1
    );
    expect(result.vector.length).toBe(1);
    expect(result.vector[0].equals(new Fraction(7, 12))).toBeTruthy();
    expect(result.residual.equals(1)).toBeTruthy();
    expect(result.cents).toBe(0);
  });

  it("can be converted to a fraction", () => {
    const monzo = new ExtendedMonzo([new Fraction(-3), new Fraction(2)]);
    expect(monzo.toFraction().equals(new Fraction(9, 8))).toBeTruthy();
  });
  it("can be converted to cents", () => {
    const monzo = new ExtendedMonzo([new Fraction(1, 2)]);
    expect(monzo.toCents()).toBeCloseTo(600);
  });
  it("can be converted to n of edo", () => {
    const monzo = new ExtendedMonzo([new Fraction(5, 12)]);
    const [fractionOfEquave, equave] = monzo.toEqualTemperament();
    expect(fractionOfEquave.equals(new Fraction(5, 12))).toBeTruthy();
    expect(equave.equals(2)).toBeTruthy();
  });
  it("can be converted to equal temperament", () => {
    const monzo = new ExtendedMonzo([new Fraction(3), new Fraction(-3, 2)]);
    const [fractionOfEquave, equave] = monzo.toEqualTemperament();
    expect(fractionOfEquave.equals(new Fraction(3, 2))).toBeTruthy();
    expect(equave.equals(new Fraction(4, 3))).toBeTruthy();
  });
  it("converts the zero monzo to unison in the degenerate equal temperament 1ed1", () => {
    const monzo = new ExtendedMonzo([]);
    const [fractionOfEquave, equave] = monzo.toEqualTemperament();
    expect(fractionOfEquave.equals(0)).toBeTruthy();
    expect(equave.equals(1)).toBeTruthy();
  });

  it("converts number multiplication to addition in pitch space", () => {
    const a = 15;
    const b = 123457;

    const aMonzo = ExtendedMonzo.fromNumber(a, 3);
    const bMonzo = ExtendedMonzo.fromNumber(b, 3);
    const aTimesBMonzo = ExtendedMonzo.fromNumber(a * b, 3);

    expect(aMonzo.add(bMonzo).strictEquals(aTimesBMonzo)).toBeTruthy();
  });
  it("converts fraction multiplication to addition in pitch space", () => {
    const a = new Fraction(5, 4);
    const b = new Fraction(16, 11);

    const aMonzo = ExtendedMonzo.fromFraction(a, 3);
    const bMonzo = ExtendedMonzo.fromFraction(b, 3);
    const aTimesBMonzo = ExtendedMonzo.fromFraction(a.mul(b), 3);

    expect(aMonzo.add(bMonzo).strictEquals(aTimesBMonzo)).toBeTruthy();
  });
  it("converts fraction division to subtraction in pitch space", () => {
    const a = new Fraction(5, 4);
    const b = new Fraction(16, 11);

    const aMonzo = ExtendedMonzo.fromFraction(a, 3);
    const bMonzo = ExtendedMonzo.fromFraction(b, 3);
    const aDividedByBMonzo = ExtendedMonzo.fromFraction(a.div(b), 3);

    expect(aMonzo.sub(bMonzo).strictEquals(aDividedByBMonzo)).toBeTruthy();
  });
  it("converts fraction inversion to negation in pitch space", () => {
    const a = new Fraction(5, 4);

    const aMonzo = ExtendedMonzo.fromFraction(a, 3);
    const aInverseMonzo = ExtendedMonzo.fromFraction(a.inverse(), 3);

    expect(aMonzo.neg().strictEquals(aInverseMonzo)).toBeTruthy();
  });
  it("converts exponentiation to scalar multiplication in pitch space", () => {
    const a = 15;
    const b = 5;

    const aMonzo = ExtendedMonzo.fromNumber(a, 2);
    const aToThePowerOfBMonzo = ExtendedMonzo.fromNumber(a ** b, 2);

    expect(aMonzo.mul(b).strictEquals(aToThePowerOfBMonzo)).toBeTruthy();
  });
  it("it implicitly converts unrepresentable exponentiation to natural units", () => {
    const a = 6;
    const b = new Fraction(1, 2);

    const result = ExtendedMonzo.fromNumber(a, 1).mul(b);

    expect(result.vector.length).toBe(1);
    expect(result.vector[0].equals(new Fraction(1, 2))).toBeTruthy();
    expect(result.residual.equals(1)).toBeTruthy();
    expect(result.cents).toBeCloseTo(valueToCents(3 ** 0.5));
  });
  it("converts root taking to scalar division in pitch space", () => {
    const a = 9;
    const b = 2;

    const aMonzo = ExtendedMonzo.fromNumber(a, 2);
    const squareRootofAMonzo = ExtendedMonzo.fromNumber(a ** (1 / b), 2);

    expect(aMonzo.div(b).strictEquals(squareRootofAMonzo)).toBeTruthy();
  });
  it("respects the ordering of rational numbers", () => {
    const majorThird = new Fraction(5, 4);
    const perfectFifth = new Fraction(3, 2);
    const octave = new Fraction(2);

    const intervals = [octave, perfectFifth, majorThird];
    const monzoIntervals = intervals.map((f) =>
      ExtendedMonzo.fromFraction(f, 3)
    );
    intervals.sort((a, b) => a.compare(b));
    monzoIntervals.sort((a, b) => a.compare(b));
    intervals.forEach((f, i) => {
      expect(
        monzoIntervals[i].strictEquals(ExtendedMonzo.fromFraction(f, 3))
      ).toBeTruthy();
    });
  });
  it("supports taking the absolute value", () => {
    const fourthUp = new ExtendedMonzo([new Fraction(2), new Fraction(-1)]);
    const fourthDown = new ExtendedMonzo([new Fraction(-2), new Fraction(1)]);
    expect(fourthDown.abs().strictEquals(fourthUp)).toBeTruthy();
  });
  it("supports octave reduction", () => {
    const fourthDown = new ExtendedMonzo([new Fraction(-2), new Fraction(1)]);
    const fifth = new ExtendedMonzo([new Fraction(-1), new Fraction(1)]);
    const tritave = new ExtendedMonzo([new Fraction(0), new Fraction(1)]);
    const octave = new ExtendedMonzo([new Fraction(1), new Fraction(0)]);
    expect(fourthDown.mmod(octave).strictEquals(fifth));
    expect(tritave.mmod(octave).strictEquals(fifth));
  });
  it("throws an error when trying to reduce by unison", () => {
    const unison = new ExtendedMonzo([new Fraction(0)]);
    const octave = new ExtendedMonzo([new Fraction(1)]);
    expect(() => octave.mmod(unison)).toThrowError("Modulo by unison");
  });
  it("handles negative congruences in the same way as JavaScript and Fraction.js", () => {
    const fifthUp = new ExtendedMonzo([new Fraction(-1), new Fraction(1)]);
    const fourthDown = new ExtendedMonzo([new Fraction(-2), new Fraction(1)]);
    const octave = new ExtendedMonzo([new Fraction(1), new Fraction(0)]);
    expect(fourthDown.mod(octave).strictEquals(fourthDown)).toBeTruthy();
    expect(
      fourthDown.mod(octave).add(octave).mod(octave).strictEquals(fifthUp)
    ).toBeTruthy();
  });
  it("can be stretched", () => {
    const octave = new ExtendedMonzo([new Fraction(1)]);
    expect(octave.stretch(1.01).toCents()).toBeCloseTo(1212);
  });
  it("can be approximated by a harmonic", () => {
    const majorSecond = ExtendedMonzo.fromEqualTemperament(
      new Fraction(2, 12),
      new Fraction(2),
      2
    );
    const justMajorSecond = majorSecond.approximateHarmonic(8);
    expect(
      justMajorSecond.toFraction().equals(new Fraction(9, 8))
    ).toBeTruthy();
  });
  it("can be approximated by a subharmonic", () => {
    const subfifth = ExtendedMonzo.fromEqualTemperament(
      new Fraction(6, 11),
      new Fraction(2),
      5
    );
    const undecimalSubfifth = subfifth.approximateSubharmonic(16);
    expect(
      undecimalSubfifth.toFraction().equals(new Fraction(16, 11))
    ).toBeTruthy();
  });
  it("can be approximated in an odd limit", () => {
    const majorSixth = ExtendedMonzo.fromEqualTemperament(
      new Fraction(9, 12),
      new Fraction(2),
      3
    );
    const justMajorSixth = majorSixth.approximateOddLimit(5);
    expect(justMajorSixth.toFraction().equals(new Fraction(5, 3))).toBeTruthy();
  });
  it("can be approximated by its convergents", () => {
    const tritone = ExtendedMonzo.fromEqualTemperament(
      new Fraction(1, 2),
      new Fraction(2),
      1
    );
    expect(
      tritone.getConvergent(0).toFraction().equals(new Fraction(1))
    ).toBeTruthy();
    expect(
      tritone.getConvergent(1).toFraction().equals(new Fraction(3, 2))
    ).toBeTruthy();
    expect(
      tritone.getConvergent(2).toFraction().equals(new Fraction(7, 5))
    ).toBeTruthy();
    expect(
      tritone.getConvergent(3).toFraction().equals(new Fraction(17, 12))
    ).toBeTruthy();
  });
  it("can be approximated by its semi-convergents", () => {
    const pi = ExtendedMonzo.fromValue(Math.PI, 0);
    expect(pi.getSemiconvergent(0).equals(new Fraction(3))).toBeTruthy();
    expect(pi.getSemiconvergent(1).equals(new Fraction(13, 4))).toBeTruthy();
    expect(pi.getSemiconvergent(2).equals(new Fraction(16, 5))).toBeTruthy();
    expect(pi.getSemiconvergent(3).equals(new Fraction(19, 6))).toBeTruthy();
    expect(pi.getSemiconvergent(4).equals(new Fraction(22, 7))).toBeTruthy();
    expect(pi.getSemiconvergent(5).equals(new Fraction(179, 57))).toBeTruthy();
  });

  it("can represent huge numbers", () => {
    const result = ExtendedMonzo.fromNumber(4522822787109375, 4);
    // Check that each prime exponent is less than 10.
    result.vector.forEach((component) => {
      expect(component.compare(10)).toBeLessThan(0);
    });
    expect(result.residual.equals(1)).toBeTruthy();
    expect(result.cents).toBe(0);
  });

  it("can combine equal temperament steps exactly", () => {
    const majorThirdOfTwelveEdo = new ExtendedMonzo([new Fraction(4, 12)]);
    const octave = majorThirdOfTwelveEdo
      .add(majorThirdOfTwelveEdo)
      .add(majorThirdOfTwelveEdo)
      .toFraction();
    expect(octave.equals(2)).toBeTruthy();
  });

  it("can be ambiquous in terms of total size", () => {
    const tritaveJI = new ExtendedMonzo([new Fraction(0), new Fraction(1)]);
    const tritaveCents = new ExtendedMonzo([], undefined, valueToCents(3));
    expect(tritaveJI.strictEquals(tritaveCents)).toBeFalsy();
    expect(tritaveJI.equals(tritaveCents)).toBeTruthy();
  });
});
