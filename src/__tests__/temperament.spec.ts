import { describe, it, expect } from "vitest";
import Fraction from "fraction.js";

import ExtendedMonzo from "../monzo";
import Mapping from "../temperament";
import Scale from "../scale";

function error(mapping: Mapping, target: ExtendedMonzo) {
  return Math.abs(mapping.apply(target).toCents() - target.toCents());
}

describe("Temperament Mapping", () => {
  it("can calculate quarter comma meantone", () => {
    const syntonicComma = ExtendedMonzo.fromFraction(new Fraction(81, 80), 3);
    const subgroup = [0, 1, 2]; // 2.3.5
    const octave = ExtendedMonzo.fromNumber(2, 3);
    const majorThird = ExtendedMonzo.fromFraction(new Fraction(5, 4), 3);
    const mapping = Mapping.fromCommaList(
      [syntonicComma],
      subgroup,
      undefined,
      [octave, majorThird]
    );

    const wholeTone = ExtendedMonzo.fromFraction(new Fraction(9, 8), 3);
    const smallWholeTone = ExtendedMonzo.fromFraction(new Fraction(10, 9), 3);
    expect(mapping.apply(wholeTone).toCents()).toBeCloseTo(
      mapping.apply(smallWholeTone).toCents()
    );
    expect(mapping.apply(octave).toCents()).toBeCloseTo(1200);
    expect(mapping.apply(majorThird).toCents()).toBeCloseTo(
      majorThird.toCents()
    );
  });

  it("calculates 4/17-comma meantone if only constrained to octaves", () => {
    const syntonicComma = ExtendedMonzo.fromFraction(new Fraction(81, 80), 3);
    const octave = ExtendedMonzo.fromNumber(2, 3);
    const mapping = Mapping.fromCommaList(
      [syntonicComma],
      [0, 1, 2],
      undefined,
      [octave]
    );

    const fifth = ExtendedMonzo.fromFraction(new Fraction(3, 2), 3);
    expect(mapping.apply(syntonicComma).toCents()).toBeCloseTo(0);
    expect(mapping.apply(fifth).toCents()).toBeCloseTo(
      fifth.sub(syntonicComma.mul(new Fraction(4, 17))).toCents()
    );
    expect(mapping.apply(octave).toCents()).toBeCloseTo(1200);
  });

  it("supports purifying octaves after tempering", () => {
    const syntonicComma = ExtendedMonzo.fromFraction(new Fraction(81, 80), 3);
    const mapping = Mapping.fromCommaList(
      [syntonicComma],
      [0, 1, 2]
    ).pureOctaves();

    const octave = ExtendedMonzo.fromNumber(2, 3);
    const fifth = ExtendedMonzo.fromFraction(new Fraction(3, 2), 3);
    expect(mapping.apply(syntonicComma).toCents()).toBeCloseTo(0);
    expect(mapping.apply(fifth).toCents()).toBeGreaterThan(695);
    expect(mapping.apply(fifth).toCents()).toBeLessThan(700);
    expect(mapping.apply(octave).toCents()).toBeCloseTo(1200);
  });

  it("minimizes the error from just intonation if unconstrained", () => {
    const syntonicComma = ExtendedMonzo.fromFraction(new Fraction(81, 80), 3);
    const mapping = Mapping.fromCommaList([syntonicComma], [0, 1, 2]);

    const octave = ExtendedMonzo.fromNumber(2, 3);
    const tritave = ExtendedMonzo.fromNumber(3, 3);
    const pentave = ExtendedMonzo.fromNumber(5, 3);
    expect(error(mapping, octave)).toBeLessThan(2.61);
    expect(error(mapping, tritave)).toBeLessThan(2.61);
    expect(error(mapping, pentave)).toBeLessThan(2.61);
  });

  it("can bias the minimization error with a metric", () => {
    const syntonicComma = ExtendedMonzo.fromFraction(new Fraction(81, 80), 3);
    const metric = [4, 2, 1]; // Compare errors between 2**4 = 16, 3**2 = 9 and 5
    const mapping = Mapping.fromCommaList([syntonicComma], [0, 1, 2], metric);

    const octave = ExtendedMonzo.fromNumber(2, 3);
    const tritave = ExtendedMonzo.fromNumber(3, 3);
    const pentave = ExtendedMonzo.fromNumber(5, 3);
    expect(error(mapping, octave)).toBeLessThan(1.4);
    expect(error(mapping, tritave)).toBeLessThan(2.8);
    expect(error(mapping, pentave)).toBeLessThan(4.75);
  });

  it("can temper out multiple commas", () => {
    const marvelComma = ExtendedMonzo.fromFraction(new Fraction(225, 224), 4);
    const gamelisma = ExtendedMonzo.fromFraction(new Fraction(1029, 1024), 4);
    const subgroup = [0, 1, 2, 3]; // 2.3.5.7
    const octave = ExtendedMonzo.fromNumber(2, 4);
    const miracle = Mapping.fromCommaList(
      [marvelComma, gamelisma],
      subgroup,
      undefined,
      [octave]
    );

    expect(miracle.apply(octave).toCents()).toBeCloseTo(1200);
    expect(miracle.apply(marvelComma).toCents()).toBeCloseTo(0);
    expect(miracle.apply(gamelisma).toCents()).toBeCloseTo(0);

    const largeSecor = ExtendedMonzo.fromFraction(new Fraction(16, 15), 4);
    const smallSecor = ExtendedMonzo.fromFraction(new Fraction(15, 14), 4);
    const secorCents = miracle.apply(smallSecor).toCents();
    expect(miracle.apply(largeSecor).toCents()).toBeCloseTo(secorCents);
    expect(secorCents).toBeGreaterThan(116);
    expect(secorCents).toBeLessThan(117);
  });

  it("can temper to rank 1", () => {
    const syntonicComma = ExtendedMonzo.fromFraction(new Fraction(81, 80), 3);
    const diesis = ExtendedMonzo.fromFraction(new Fraction(128, 125), 3);
    const subgroup = [0, 1, 2];
    const tet12 = Mapping.fromCommaList([syntonicComma, diesis], subgroup);
    const octave = ExtendedMonzo.fromNumber(2, 3);
    const semitone = ExtendedMonzo.fromFraction(new Fraction(16, 15), 3);
    expect(tet12.apply(syntonicComma).toCents()).toBeCloseTo(0);
    expect(tet12.apply(diesis).toCents()).toBeCloseTo(0);
    expect(tet12.apply(semitone).toCents() * 12).toBeCloseTo(
      tet12.apply(octave).toCents()
    );
    expect(tet12.apply(octave).toCents()).toBeGreaterThan(1197);
    expect(tet12.apply(octave).toCents()).toBeLessThan(1200);
  });

  it("can temper to rank 3", () => {
    const breedsma = ExtendedMonzo.fromFraction(new Fraction(2401, 2400), 4);
    const subgroup = [0, 1, 2, 3];
    const breed = Mapping.fromCommaList([breedsma], subgroup);
    const octave = ExtendedMonzo.fromNumber(2, 4);
    expect(breed.apply(breedsma).toCents()).toBeCloseTo(0);
    expect(breed.apply(octave).toCents()).toBeGreaterThan(1200);
    expect(breed.apply(octave).toCents()).toBeLessThan(1200.1);
  });

  it("leaves primes outside of the subgroup alone", () => {
    const largeLimma = ExtendedMonzo.fromFraction(new Fraction(27, 25), 5);
    const subgroup = [0, 1, 2];
    const bug = Mapping.fromCommaList([largeLimma], subgroup);
    const minorSixth = ExtendedMonzo.fromFraction(new Fraction(11, 7), 5);
    expect(bug.apply(largeLimma).toCents()).toBeCloseTo(0);
    expect(
      bug.apply(minorSixth).toFraction().equals(new Fraction(11, 7))
    ).toBeTruthy();
  });

  it("can represent pantent vals", () => {
    const edo12 = Mapping.fromPatentVal(12, new Fraction(2), [0, 0, 0]);
    expect(
      edo12.columns[0].toEqualTemperament()[0].equals(new Fraction(12, 12))
    ).toBeTruthy();
    expect(
      edo12.columns[1].toEqualTemperament()[0].equals(new Fraction(19, 12))
    ).toBeTruthy();
    expect(
      edo12.columns[2].toEqualTemperament()[0].equals(new Fraction(28, 12))
    ).toBeTruthy();

    const fifth = ExtendedMonzo.fromFraction(new Fraction(3, 2), 3);
    expect(
      edo12.apply(fifth).toEqualTemperament()[0].equals(new Fraction(7, 12))
    ).toBeTruthy();
  });

  it("can represent vals with warts", () => {
    const edo18b = Mapping.fromPatentVal(18, new Fraction(2), [0, -1]);
    expect(
      edo18b.columns[0].toEqualTemperament()[0].equals(new Fraction(18, 18))
    ).toBeTruthy();
    expect(
      edo18b.columns[1].toEqualTemperament()[0].equals(new Fraction(28, 18))
    ).toBeTruthy();
  });

  it("can be applied to scales", () => {
    const telepathma = ExtendedMonzo.fromFraction(new Fraction(55, 54), 5);
    const ptolemisma = ExtendedMonzo.fromFraction(new Fraction(100, 99), 5);
    const subgroup = [0, 1, 2, 4]; // 2.3.5.11
    const octave = ExtendedMonzo.fromNumber(2, 5);
    const neutralSecond = ExtendedMonzo.fromFraction(new Fraction(12, 11), 5);
    const submajorSecond = ExtendedMonzo.fromFraction(new Fraction(11, 10), 5);

    const porkypine = Mapping.fromCommaList(
      [telepathma, ptolemisma],
      subgroup,
      undefined,
      [octave]
    );
    const porkypine8 = porkypine.apply(
      Scale.fromRank2(neutralSecond, octave, 8, 0)
    );

    expect(porkypine8.getMonzo(0).toCents()).toBeCloseTo(0);
    expect(porkypine8.getMonzo(1).toCents()).toBeCloseTo(
      porkypine.apply(submajorSecond).toCents()
    );
    expect(porkypine8.getMonzo(7).toCents()).toBeGreaterThan(
      porkypine8.getMonzo(6).toCents()
    );
    expect(porkypine8.getMonzo(8).toCents()).toBeCloseTo(1200);
  });
});
