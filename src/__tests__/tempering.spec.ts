import { describe, it, expect } from "vitest";
import Fraction from "fraction.js";

import ExtendedMonzo from "../monzo";
import Mapping from "../tempering";
import Scale from "../scale";

describe("Temperament Mapping", () => {
  it("calculates POTE meantone", () => {
    const syntonicComma = ExtendedMonzo.fromFraction(new Fraction(81, 80), 3);
    const octave = ExtendedMonzo.fromNumber(2, 3);
    const mapping = Mapping.fromCommaList([syntonicComma]);

    const fifth = ExtendedMonzo.fromFraction(new Fraction(3, 2), 3);
    expect(mapping.apply(syntonicComma).toCents()).toBeCloseTo(0);
    expect(mapping.apply(fifth).toCents()).toBeCloseTo(696.239);
    expect(mapping.apply(octave).toCents()).toBeCloseTo(1200);
  });

  it("supports purifying octaves after tempering", () => {
    const syntonicComma = ExtendedMonzo.fromFraction(new Fraction(81, 80), 3);
    const impureMapping = Mapping.fromCommaList([syntonicComma], "2.3.5", 3, {
      temperEquaves: true,
    });
    const octave = ExtendedMonzo.fromNumber(2, 3);
    expect(impureMapping.apply(octave).toCents()).greaterThan(1200);

    const mapping = impureMapping.pureOctaves();

    const fifth = ExtendedMonzo.fromFraction(new Fraction(3, 2), 3);
    expect(mapping.apply(syntonicComma).toCents()).toBeCloseTo(0);
    expect(mapping.apply(fifth).toCents()).toBeGreaterThan(695);
    expect(mapping.apply(fifth).toCents()).toBeLessThan(700);
    expect(mapping.apply(octave).toCents()).toBeCloseTo(1200);
  });

  it("can temper out multiple commas", () => {
    const marvelComma = ExtendedMonzo.fromFraction(new Fraction(225, 224), 4);
    const gamelisma = ExtendedMonzo.fromFraction(new Fraction(1029, 1024), 4);
    const miracle = Mapping.fromCommaList([marvelComma, gamelisma]);

    const octave = ExtendedMonzo.fromNumber(2, 4);
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
    const tet12 = Mapping.fromCommaList(
      [syntonicComma, diesis],
      undefined,
      undefined,
      { temperEquaves: true }
    );
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
    const breed = Mapping.fromCommaList([breedsma], 7, 4, {
      temperEquaves: true,
    });
    const octave = ExtendedMonzo.fromNumber(2, 4);
    expect(breed.apply(breedsma).toCents()).toBeCloseTo(0);
    expect(breed.apply(octave).toCents()).toBeGreaterThan(1200);
    expect(breed.apply(octave).toCents()).toBeLessThan(1200.1);
  });

  it("leaves primes outside of the subgroup alone", () => {
    const largeLimma = ExtendedMonzo.fromFraction(new Fraction(27, 25), 5);
    const bug = Mapping.fromCommaList([largeLimma]);
    const minorSixth = ExtendedMonzo.fromFraction(new Fraction(11, 7), 5);
    expect(bug.apply(largeLimma).toCents()).toBeCloseTo(0);
    expect(
      bug.apply(minorSixth).toFraction().equals(new Fraction(11, 7))
    ).toBeTruthy();
  });

  it("can construct POTE mavila from a list of vals", () => {
    const mavila = Mapping.fromValList([9, 16], "2.3.5", 4);
    const octave = ExtendedMonzo.fromNumber(2, 4);
    const pelogicComma = ExtendedMonzo.fromFraction(new Fraction(135, 128), 4);
    const fifth = ExtendedMonzo.fromFraction(new Fraction(3, 2), 4);
    const seventh = ExtendedMonzo.fromFraction(new Fraction(7, 4), 4);
    expect(mavila.apply(octave).toCents()).toBeCloseTo(1200);
    expect(mavila.apply(pelogicComma).toCents()).toBeCloseTo(0);
    expect(mavila.apply(fifth).toCents()).toBeCloseTo(679.806);
    expect(
      mavila.apply(seventh).toFraction().equals(new Fraction(7, 4))
    ).toBeTruthy();
  });

  it("can construct CTE septimal meantone from a list of vals", () => {
    const meantone = Mapping.fromValList([12, 19], 7, 4, {
      constraints: ["2/1"],
    });
    const syntonicComma = ExtendedMonzo.fromFraction(new Fraction(81, 80), 4);
    const starlingComma = ExtendedMonzo.fromFraction(new Fraction(126, 125), 4);
    const octave = ExtendedMonzo.fromNumber(2, 4);
    const tritave = ExtendedMonzo.fromFraction(new Fraction(3, 1), 4);
    const pentave = ExtendedMonzo.fromFraction(new Fraction(5, 1), 4);
    const seven = ExtendedMonzo.fromFraction(new Fraction(7, 1), 4);
    expect(meantone.apply(syntonicComma).toCents()).toBeCloseTo(0);
    expect(meantone.apply(starlingComma).toCents()).toBeCloseTo(0);
    expect(meantone.apply(octave).toCents()).toBeCloseTo(1200);
    expect(meantone.apply(tritave).toCents()).toBeCloseTo(1896.9521);
    expect(meantone.apply(pentave).toCents()).toBeCloseTo(2787.8085);
    expect(meantone.apply(seven).toCents()).toBeCloseTo(3369.5214);
  });

  it("can represent pantent vals", () => {
    const edo12 = Mapping.fromWarts(12, 3);
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
    const edo18b = Mapping.fromWarts("18b", 2);
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

    const porkypine = Mapping.fromCommaList(
      [telepathma, ptolemisma],
      "2.3.5.11"
    );

    const octave = ExtendedMonzo.fromNumber(2, 5);
    const neutralSecond = ExtendedMonzo.fromFraction(new Fraction(12, 11), 5);
    const submajorSecond = ExtendedMonzo.fromFraction(new Fraction(11, 10), 5);

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
