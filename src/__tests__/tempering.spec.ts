import { describe, it, expect } from "vitest";

import ExtendedMonzo from "../monzo";
import {
  Mapping,
  makeRank1,
  makeRank2FromCommas,
  makeRank2FromVals,
  mosPatternsRank2FromCommas,
  mosPatternsRank2FromVals,
} from "../tempering";
import Scale from "../scale";
import { Interval } from "../interval";
import { arraysEqual, Fraction, valueToCents } from "xen-dev-utils";

describe("Temperament Mapping", () => {
  it("calculates POTE meantone", () => {
    const mapping = Mapping.fromCommas(["81/80"], 3);

    const syntonicComma = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(81, 80), 3),
      "ratio"
    );
    const octave = new Interval(ExtendedMonzo.fromNumber(2, 3), "ratio");
    const fifth = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(3, 2), 3),
      "ratio"
    );
    expect(mapping.apply(syntonicComma).totalCents()).toBeCloseTo(0);
    expect(mapping.apply(fifth).totalCents()).toBeCloseTo(696.239);
    expect(mapping.apply(octave).totalCents()).toBeCloseTo(1200);
  });

  it("supports purifying octaves after tempering", () => {
    const impureMapping = Mapping.fromCommas(["81/80"], 3, "2.3.5", {
      temperEquaves: true,
    });
    const octave = new Interval(ExtendedMonzo.fromNumber(2, 3), "ratio");
    expect(impureMapping.apply(octave).totalCents()).greaterThan(1200);

    const mapping = impureMapping.pureOctaves();

    const syntonicComma = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(81, 80), 3),
      "ratio"
    );
    const fifth = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(3, 2), 3),
      "ratio"
    );
    expect(mapping.apply(syntonicComma).totalCents()).toBeCloseTo(0);
    expect(mapping.apply(fifth).totalCents()).toBeGreaterThan(695);
    expect(mapping.apply(fifth).totalCents()).toBeLessThan(700);
    expect(mapping.apply(octave).totalCents()).toBeCloseTo(1200);
  });

  it("can temper out multiple commas", () => {
    const miracle = Mapping.fromCommas(["225/224", "1029/1024"], 4);

    const octave = new Interval(ExtendedMonzo.fromNumber(2, 4), "ratio");
    const marvelComma = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(225, 224), 4),
      "ratio"
    );
    const gamelisma = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(1029, 1024), 4),
      "ratio"
    );
    expect(miracle.apply(octave).totalCents()).toBeCloseTo(1200);
    expect(miracle.apply(marvelComma).totalCents()).toBeCloseTo(0);
    expect(miracle.apply(gamelisma).totalCents()).toBeCloseTo(0);

    const largeSecor = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(16, 15), 4),
      "ratio"
    );
    const smallSecor = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(15, 14), 4),
      "ratio"
    );
    const secorCents = miracle.apply(smallSecor).totalCents();
    expect(miracle.apply(largeSecor).totalCents()).toBeCloseTo(secorCents);
    expect(secorCents).toBeGreaterThan(116);
    expect(secorCents).toBeLessThan(117);
  });

  it("can temper to rank 1", () => {
    const tet12 = Mapping.fromCommas(["81/80", "128/125"], 3, undefined, {
      temperEquaves: true,
    });
    const octave = new Interval(ExtendedMonzo.fromNumber(2, 3), "ratio");
    const syntonicComma = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(81, 80), 3),
      "ratio"
    );
    const diesis = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(128, 125), 3),
      "ratio"
    );
    const semitone = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(16, 15), 3),
      "ratio"
    );
    expect(tet12.apply(syntonicComma).totalCents()).toBeCloseTo(0);
    expect(tet12.apply(diesis).totalCents()).toBeCloseTo(0);
    expect(tet12.apply(semitone).totalCents() * 12).toBeCloseTo(
      tet12.apply(octave).totalCents()
    );
    expect(tet12.apply(octave).totalCents()).toBeGreaterThan(1197);
    expect(tet12.apply(octave).totalCents()).toBeLessThan(1200);
  });

  it("can temper to rank 3", () => {
    const breed = Mapping.fromCommas(["2401/2400"], 4, 7, {
      temperEquaves: true,
    });
    const octave = new Interval(ExtendedMonzo.fromNumber(2, 4), "ratio");
    const breedsma = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(2401, 2400), 4),
      "ratio"
    );
    expect(breed.apply(breedsma).totalCents()).toBeCloseTo(0);
    expect(breed.apply(octave).totalCents()).toBeGreaterThan(1200);
    expect(breed.apply(octave).totalCents()).toBeLessThan(1200.1);
  });

  it("leaves primes outside of the subgroup alone", () => {
    const bug = Mapping.fromCommas(["27/25"], 5);
    const largeLimma = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(27, 25), 5),
      "ratio"
    );
    const minorSixth = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(11, 7), 5),
      "ratio"
    );
    expect(bug.apply(largeLimma).totalCents()).toBeCloseTo(0);
    expect(
      bug.apply(minorSixth).monzo.toFraction().equals(new Fraction(11, 7))
    ).toBeTruthy();
  });

  it("can construct POTE mavila from a list of vals", () => {
    const mavila = Mapping.fromVals([9, 16], 4, "2.3.5");
    const octave = new Interval(ExtendedMonzo.fromNumber(2, 4), "ratio");
    const pelogicComma = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(135, 128), 4),
      "ratio"
    );
    const fifth = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(3, 2), 4),
      "ratio"
    );
    const seventh = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(7, 4), 4),
      "ratio"
    );
    expect(mavila.apply(octave).totalCents()).toBeCloseTo(1200);
    expect(mavila.apply(pelogicComma).totalCents()).toBeCloseTo(0);
    expect(mavila.apply(fifth).totalCents()).toBeCloseTo(679.806);
    expect(
      mavila.apply(seventh).monzo.toFraction().equals(new Fraction(7, 4))
    ).toBeTruthy();
  });

  it("can construct CTE septimal meantone from a list of vals", () => {
    const meantone = Mapping.fromVals([12, 19], 4, 7, {
      constraints: ["2/1"],
    });
    const syntonicComma = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(81, 80), 4),
      "ratio"
    );
    const starlingComma = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(126, 125), 4),
      "ratio"
    );
    const octave = new Interval(ExtendedMonzo.fromNumber(2, 4), "ratio");
    const tritave = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(3, 1), 4),
      "ratio"
    );
    const pentave = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(5, 1), 4),
      "ratio"
    );
    const seven = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(7, 1), 4),
      "ratio"
    );
    expect(meantone.apply(syntonicComma).totalCents()).toBeCloseTo(0);
    expect(meantone.apply(starlingComma).totalCents()).toBeCloseTo(0);
    expect(meantone.apply(octave).totalCents()).toBeCloseTo(1200);
    expect(meantone.apply(tritave).totalCents()).toBeCloseTo(1896.9521);
    expect(meantone.apply(pentave).totalCents()).toBeCloseTo(2787.8085);
    expect(meantone.apply(seven).totalCents()).toBeCloseTo(3369.5214);
  });

  it("can represent pantent vals", () => {
    const edo12 = Mapping.fromWarts(12, 3);
    expect(edo12.vector[0]).toBeCloseTo((1200 * 12) / 12);
    expect(edo12.vector[1]).toBeCloseTo((1200 * 19) / 12);
    expect(edo12.vector[2]).toBeCloseTo((1200 * 28) / 12);

    const fifth = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(3, 2), 3),
      "ratio"
    );
    expect(edo12.apply(fifth).totalCents()).toBeCloseTo((1200 * 7) / 12);
  });

  it("can represent vals with warts", () => {
    const edo18b = Mapping.fromWarts("18b", 2);
    expect(edo18b.vector[0]).toBeCloseTo((1200 * 18) / 18);
    expect(edo18b.vector[1]).toBeCloseTo((1200 * 28) / 18);
  });

  it("can be applied to scales", () => {
    const porkypine = Mapping.fromCommas(["55/54", "100/99"], 5, "2.3.5.11");

    const octave = new Interval(ExtendedMonzo.fromNumber(2, 5), "ratio");
    const neutralSecond = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(12, 11), 5),
      "ratio"
    );
    const submajorSecond = new Interval(
      ExtendedMonzo.fromFraction(new Fraction(11, 10), 5),
      "ratio"
    );

    const porkypine8 = porkypine.apply(
      Scale.fromRank2(neutralSecond, octave, 8, 0)
    );

    expect(porkypine8.getMonzo(0).totalCents()).toBeCloseTo(0);
    expect(porkypine8.getMonzo(1).totalCents()).toBeCloseTo(
      porkypine.apply(submajorSecond).totalCents()
    );
    expect(porkypine8.getMonzo(7).totalCents()).toBeGreaterThan(
      porkypine8.getMonzo(6).totalCents()
    );
    expect(porkypine8.getMonzo(8).totalCents()).toBeCloseTo(1200);
  });
});

describe("Tempered scale generation", () => {
  it("generates TE optimal 12", () => {
    const scale = makeRank1(12, 5);
    expect(scale.size).toBe(12);
    expect(scale.equave.totalCents()).toBeCloseTo(1198.44);
  });

  it("generates TE optimal 12c (mavila | superpyth)", () => {
    const scale = makeRank1("12c", "2.3.5");
    expect(scale.size).toBe(12);
    expect(scale.equave.totalCents()).toBeCloseTo(1212.68);
  });

  it("generates TE optimal equalized Bohlen-Pierce", () => {
    const scale = makeRank1(13, "3.5.7");
    expect(scale.size).toBe(13);
    expect(scale.equave.totalCents()).toBeCloseTo(1904.16);
  });

  it("generates CTE augmented from vals", () => {
    const vals = [3, 12];
    const limit = 5;
    const options = {
      constraints: ["2/1"],
    };
    const infos = mosPatternsRank2FromVals(vals, limit, undefined, 5, options);
    const sizes = infos.map(
      (info) => info.numberOfLargeSteps + info.numberOfSmallSteps
    );
    expect(arraysEqual(sizes, [6, 9, 12, 15, 27])).toBeTruthy();

    const { generator, period, numPeriods } = makeRank2FromVals(
      vals,
      sizes[2],
      limit,
      options
    );
    const scale = Scale.fromRank2(
      new Interval(ExtendedMonzo.fromCents(generator, 0), "cents"),
      new Interval(ExtendedMonzo.fromCents(period, 0), "cents"),
      sizes[2],
      0,
      numPeriods
    );

    expect(scale.size).toBe(12);

    const third = scale.getMonzo(4);
    const fifth = scale.getMonzo(7);
    const octave = scale.getMonzo(12);

    expect(third.toCents()).toBeCloseTo(400.0);
    expect(fifth.toCents()).toBeCloseTo(valueToCents(3 / 2));
    expect(octave.toCents()).toBeCloseTo(1200.0);
  });

  it("generates POTE meantone from a comma", () => {
    const commas = ["81/80"];
    const infos = mosPatternsRank2FromCommas(commas, undefined, undefined, 5);
    const sizes = infos.map(
      (info) => info.numberOfLargeSteps + info.numberOfSmallSteps
    );
    expect(arraysEqual(sizes, [2, 3, 5, 7, 12])).toBeTruthy();

    const { generator, period, numPeriods } = makeRank2FromCommas(
      commas,
      sizes[3]
    );
    const scale = Scale.fromRank2(
      new Interval(ExtendedMonzo.fromCents(generator, 0), "cents"),
      new Interval(ExtendedMonzo.fromCents(period, 0), "cents"),
      sizes[3],
      0,
      numPeriods
    );

    expect(scale.size).toBe(7);

    const fifth = scale.getMonzo(4);
    const octave = scale.getMonzo(7);

    expect(fifth.toCents()).toBeCloseTo(696.239);
    expect(octave.toCents()).toBeCloseTo(1200.0);
  });
});
