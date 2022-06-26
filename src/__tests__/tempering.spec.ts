import { describe, it, expect } from "vitest";
import Fraction from "fraction.js";
import { arraysEqual } from "temperaments";

import ExtendedMonzo from "../monzo";
import {
  Mapping,
  makeRank1,
  makeRank2FromCommas,
  makeRank2FromVals,
  mosSizesRank2FromCommas,
  mosSizesRank2FromVals,
} from "../tempering";
import Scale from "../scale";
import { ratioToCents } from "../utils";

describe("Temperament Mapping", () => {
  it("calculates POTE meantone", () => {
    const syntonicComma = ExtendedMonzo.fromFraction(new Fraction(81, 80), 3);
    const octave = ExtendedMonzo.fromNumber(2, 3);
    const mapping = Mapping.fromCommas([syntonicComma]);

    const fifth = ExtendedMonzo.fromFraction(new Fraction(3, 2), 3);
    expect(mapping.apply(syntonicComma).toCents()).toBeCloseTo(0);
    expect(mapping.apply(fifth).toCents()).toBeCloseTo(696.239);
    expect(mapping.apply(octave).toCents()).toBeCloseTo(1200);
  });

  it("supports purifying octaves after tempering", () => {
    const syntonicComma = ExtendedMonzo.fromFraction(new Fraction(81, 80), 3);
    const impureMapping = Mapping.fromCommas([syntonicComma], "2.3.5", 3, {
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
    const miracle = Mapping.fromCommas([marvelComma, gamelisma]);

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
    const tet12 = Mapping.fromCommas(
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
    const breed = Mapping.fromCommas([breedsma], 7, 4, {
      temperEquaves: true,
    });
    const octave = ExtendedMonzo.fromNumber(2, 4);
    expect(breed.apply(breedsma).toCents()).toBeCloseTo(0);
    expect(breed.apply(octave).toCents()).toBeGreaterThan(1200);
    expect(breed.apply(octave).toCents()).toBeLessThan(1200.1);
  });

  it("leaves primes outside of the subgroup alone", () => {
    const largeLimma = ExtendedMonzo.fromFraction(new Fraction(27, 25), 5);
    const bug = Mapping.fromCommas([largeLimma]);
    const minorSixth = ExtendedMonzo.fromFraction(new Fraction(11, 7), 5);
    expect(bug.apply(largeLimma).toCents()).toBeCloseTo(0);
    expect(
      bug.apply(minorSixth).toFraction().equals(new Fraction(11, 7))
    ).toBeTruthy();
  });

  it("can construct POTE mavila from a list of vals", () => {
    const mavila = Mapping.fromVals([9, 16], "2.3.5", 4);
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
    const meantone = Mapping.fromVals([12, 19], 7, 4, {
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

    const porkypine = Mapping.fromCommas(
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

describe("Tempered scale generation", () => {
  it("generates TE optimal 12", () => {
    const scale = makeRank1(12, 5);
    expect(scale.size).toBe(12);
    expect(scale.equave.toCents()).toBeCloseTo(1198.44);
  });

  it("generates TE optimal 12c (mavila | superpyth)", () => {
    const scale = makeRank1("12c", "2.3.5");
    expect(scale.size).toBe(12);
    expect(scale.equave.toCents()).toBeCloseTo(1212.68);
  });

  it("generates TE optimal equalized Bohlen-Pierce", () => {
    const scale = makeRank1(13, "3.5.7");
    expect(scale.size).toBe(13);
    expect(scale.equave.toCents()).toBeCloseTo(1904.16);
  });

  it("generates CTE augmented from vals", () => {
    const vals = [3, 12];
    const limit = 5;
    const options = {
      constraints: ["2/1"],
    };
    const [divisions, sizes] = mosSizesRank2FromVals(
      vals,
      limit,
      undefined,
      3,
      options
    );
    expect(divisions).toBe(3);
    expect(arraysEqual(sizes, [12, 87, 99])).toBeTruthy();

    const scale = makeRank2FromVals(vals, sizes[0], 0, limit, options);

    expect(scale.size).toBe(12);

    const third = scale.getMonzo(4);
    const fifth = scale.getMonzo(7);
    const octave = scale.getMonzo(12);

    expect(third.toCents()).toBeCloseTo(400.0);
    expect(fifth.toCents()).toBeCloseTo(ratioToCents(3 / 2));
    expect(octave.toCents()).toBeCloseTo(1200.0);
  });

  it("generates POTE meantone from a comma", () => {
    const commas = ["81/80"];
    const [divisions, sizes] = mosSizesRank2FromCommas(
      commas,
      undefined,
      undefined,
      3
    );
    expect(divisions).toBe(1);
    expect(arraysEqual(sizes, [5, 7, 12])).toBeTruthy();

    const scale = makeRank2FromCommas(commas, sizes[1], 0);

    expect(scale.size).toBe(7);

    const fifth = scale.getMonzo(4);
    const octave = scale.getMonzo(7);

    expect(fifth.toCents()).toBeCloseTo(696.239);
    expect(octave.toCents()).toBeCloseTo(1200.0);
  });
});
