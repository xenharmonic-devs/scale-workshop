import { describe, it, expect } from "vitest";
import Fraction from "fraction.js";

import ExtendedMonzo from "../monzo";
import Scale from "../scale";

describe("Scale", () => {
  it("supports just intonation", () => {
    const intervals = [
      ExtendedMonzo.fromFraction(new Fraction(5, 4), 3),
      ExtendedMonzo.fromFraction(new Fraction(3, 2), 3),
      ExtendedMonzo.fromFraction(new Fraction(15, 8), 3),
      ExtendedMonzo.fromFraction(new Fraction(2), 3),
    ];
    const baseFrequency = 1000;
    const scale = Scale.fromIntervalArray(intervals, baseFrequency);
    expect(scale.getFrequency(0)).toBeCloseTo(baseFrequency);
    expect(scale.getFrequency(1)).toBeCloseTo(1250);
    expect(scale.getFrequency(2)).toBeCloseTo(1500);
    expect(scale.getFrequency(3)).toBeCloseTo(1875);
    expect(scale.getFrequency(4)).toBeCloseTo(2000);
    expect(scale.getFrequency(5)).toBeCloseTo(2500);
    expect(scale.getFrequency(6)).toBeCloseTo(3000);

    expect(scale.getFrequency(-2)).toBeCloseTo(750);
    expect(scale.getFrequency(-3)).toBeCloseTo(625);
    expect(scale.getFrequency(-4)).toBeCloseTo(500);
  });
  it("supports equal temperament", () => {
    const octave = new Fraction(2);
    const intervals = [
      ExtendedMonzo.fromEqualTemperament(new Fraction(1, 3), octave, 1),
      ExtendedMonzo.fromEqualTemperament(new Fraction(2, 3), octave, 1),
      ExtendedMonzo.fromEqualTemperament(new Fraction(3, 3), octave, 1),
    ];
    const baseFrequency = 1;
    const scale = Scale.fromIntervalArray(intervals, baseFrequency);
    expect(scale.getFrequency(0)).toBeCloseTo(baseFrequency);
    expect(scale.getFrequency(1)).toBeCloseTo(2 ** (1 / 3));
    expect(scale.getFrequency(2)).toBeCloseTo(2 ** (2 / 3));
    expect(scale.getFrequency(3)).toBeCloseTo(2 ** (3 / 3));

    expect(scale.getFrequency(-1)).toBeCloseTo(2 ** (-1 / 3));
  });
  it("supports raw cents", () => {
    const scale = Scale.fromIntervalArray(
      [ExtendedMonzo.fromCents(123, 0)],
      440
    );
    expect(scale.getMonzo(0).toCents()).toBeCloseTo(0);
    expect(scale.getMonzo(1).toCents()).toBeCloseTo(123);
    expect(scale.getMonzo(2).toCents()).toBeCloseTo(246);

    expect(scale.getMonzo(-1).toCents()).toBeCloseTo(-123);
  });

  it("can be sorted", () => {
    const intervals = [
      ExtendedMonzo.fromFraction(new Fraction(15, 8), 3),
      ExtendedMonzo.fromFraction(new Fraction(3, 2), 3),
      ExtendedMonzo.fromFraction(new Fraction(5, 4), 3),
      ExtendedMonzo.fromFraction(new Fraction(2), 3),
    ];
    const baseFrequency = 1000;
    const scale = Scale.fromIntervalArray(intervals, baseFrequency).sort();
    expect(scale.getFrequency(0)).toBeCloseTo(baseFrequency);
    expect(scale.getFrequency(1)).toBeCloseTo(1250);
    expect(scale.getFrequency(2)).toBeCloseTo(1500);
    expect(scale.getFrequency(3)).toBeCloseTo(1875);
    expect(scale.getFrequency(4)).toBeCloseTo(2000);
  });
  it("can be octave reduced", () => {
    const intervals = [
      ExtendedMonzo.fromFraction(new Fraction(3 / 5), 3),
      ExtendedMonzo.fromFraction(new Fraction(3), 3),
      ExtendedMonzo.fromFraction(new Fraction(2), 3),
    ];
    const baseFrequency = 1000;
    const scale = Scale.fromIntervalArray(intervals, baseFrequency).reduce();
    expect(scale.getFrequency(0)).toBeCloseTo(baseFrequency);
    expect(scale.getFrequency(1)).toBeCloseTo(1200);
    expect(scale.getFrequency(2)).toBeCloseTo(1500);
    expect(scale.getFrequency(3)).toBeCloseTo(2000);
  });
  it("can be rotated", () => {
    const intervals = [
      ExtendedMonzo.fromFraction(new Fraction(5, 4), 3),
      ExtendedMonzo.fromFraction(new Fraction(3, 2), 3),
      ExtendedMonzo.fromFraction(new Fraction(2), 3),
    ];
    const baseFrequency = 1000;
    const scale = Scale.fromIntervalArray(intervals, baseFrequency).rotate();
    expect(scale.getFrequency(0)).toBeCloseTo(baseFrequency);
    expect(scale.getFrequency(1)).toBeCloseTo(1200);
    expect(scale.getFrequency(2)).toBeCloseTo(1600);
    expect(scale.getFrequency(3)).toBeCloseTo(2000);
  });
  it("supports taking a subset", () => {
    const intervals = [
      ExtendedMonzo.fromFraction(new Fraction(5, 4), 3),
      ExtendedMonzo.fromFraction(new Fraction(3, 2), 3),
      ExtendedMonzo.fromFraction(new Fraction(2), 3),
    ];
    const baseFrequency = 1000;
    const scale = Scale.fromIntervalArray(intervals, baseFrequency).subset([
      0, 2,
    ]);
    expect(scale.getFrequency(0)).toBeCloseTo(baseFrequency);
    expect(scale.getFrequency(1)).toBeCloseTo(1500);
    expect(scale.getFrequency(2)).toBeCloseTo(2000);
  });
  it("throws an error for invalid subsets", () => {
    const intervals = [
      ExtendedMonzo.fromFraction(new Fraction(5, 4), 3),
      ExtendedMonzo.fromFraction(new Fraction(3, 2), 3),
      ExtendedMonzo.fromFraction(new Fraction(2), 3),
    ];
    const baseFrequency = 1000;
    expect(() =>
      Scale.fromIntervalArray(intervals, baseFrequency).subset([0, 3])
    ).toThrowError("Subset index out of bounds");
  });
  it("can be stretched", () => {
    const intervals = [
      ExtendedMonzo.fromEqualTemperament(
        new Fraction(7, 12),
        new Fraction(2),
        1
      ),
      ExtendedMonzo.fromEqualTemperament(
        new Fraction(12, 12),
        new Fraction(2),
        1
      ),
    ];
    const scale = Scale.fromIntervalArray(intervals).stretch(1.01);
    expect(scale.getMonzo(0).toCents()).toBeCloseTo(0);
    expect(scale.getMonzo(1).toCents()).toBeCloseTo(707);
    expect(scale.getMonzo(2).toCents()).toBeCloseTo(1212);
  });
  it("can be inverted", () => {
    const intervals = [
      ExtendedMonzo.fromFraction(new Fraction(5, 4), 3),
      ExtendedMonzo.fromFraction(new Fraction(3, 2), 3),
      ExtendedMonzo.fromFraction(new Fraction(2), 3),
    ];
    const baseFrequency = 300;
    const scale = Scale.fromIntervalArray(intervals, baseFrequency).invert();
    expect(scale.getFrequency(0)).toBeCloseTo(baseFrequency);
    expect(scale.getFrequency(1)).toBeCloseTo(400);
    expect(scale.getFrequency(2)).toBeCloseTo(480);
    expect(scale.getFrequency(3)).toBeCloseTo(600);
  });
  it("can raise a degree", () => {
    const octave = new Fraction(2);
    const intervals = [
      ExtendedMonzo.fromEqualTemperament(new Fraction(2, 12), octave, 1),
      ExtendedMonzo.fromEqualTemperament(new Fraction(3, 12), octave, 1),
      ExtendedMonzo.fromEqualTemperament(new Fraction(5, 12), octave, 1),
      ExtendedMonzo.fromEqualTemperament(new Fraction(7, 12), octave, 1),
      ExtendedMonzo.fromEqualTemperament(new Fraction(8, 12), octave, 1),
      ExtendedMonzo.fromEqualTemperament(new Fraction(10, 12), octave, 1),
      ExtendedMonzo.fromEqualTemperament(new Fraction(12, 12), octave, 1),
    ];
    const semitone = ExtendedMonzo.fromEqualTemperament(
      new Fraction(1, 12),
      octave,
      1
    );
    const harmonicMinor = Scale.fromIntervalArray(intervals).transposeDegree(
      6,
      semitone
    );
    expect(harmonicMinor.getMonzo(0).toCents()).toBeCloseTo(0);
    expect(harmonicMinor.getMonzo(1).toCents()).toBeCloseTo(200);
    expect(harmonicMinor.getMonzo(2).toCents()).toBeCloseTo(300);
    expect(harmonicMinor.getMonzo(3).toCents()).toBeCloseTo(500);
    expect(harmonicMinor.getMonzo(4).toCents()).toBeCloseTo(700);
    expect(harmonicMinor.getMonzo(5).toCents()).toBeCloseTo(800);
    expect(harmonicMinor.getMonzo(6).toCents()).toBeCloseTo(1100);
    expect(harmonicMinor.getMonzo(7).toCents()).toBeCloseTo(1200);
  });
  it("can insert new intervals", () => {
    const intervals = [
      ExtendedMonzo.fromNumber(2, 2),
      ExtendedMonzo.fromNumber(4, 2),
    ];
    const scale = Scale.fromIntervalArray(intervals, 1).insertAfter(
      1,
      ExtendedMonzo.fromNumber(3, 2)
    );
    expect(scale.getFrequency(0)).toBeCloseTo(1);
    expect(scale.getFrequency(1)).toBeCloseTo(2);
    expect(scale.getFrequency(2)).toBeCloseTo(3);
    expect(scale.getFrequency(3)).toBeCloseTo(4);
  });
  it("can be equalized", () => {
    const intervals = [
      ExtendedMonzo.fromFraction(new Fraction(5, 4), 3),
      ExtendedMonzo.fromFraction(new Fraction(3, 2), 3),
      ExtendedMonzo.fromFraction(new Fraction(2), 3),
    ];
    const scale =
      Scale.fromIntervalArray(intervals).approximateEqualTemperament(12);
    expect(scale.getMonzo(0).toCents()).toBeCloseTo(0);
    expect(scale.getMonzo(1).toCents()).toBeCloseTo(400);
    expect(scale.getMonzo(2).toCents()).toBeCloseTo(700);
    expect(scale.getMonzo(3).toCents()).toBeCloseTo(1200);
  });
  it("can be approximated by harmonics", () => {
    const intervals = [
      ExtendedMonzo.fromEqualTemperament(
        new Fraction(2, 5),
        new Fraction(2),
        4
      ),
      ExtendedMonzo.fromEqualTemperament(
        new Fraction(4, 5),
        new Fraction(2),
        4
      ),
      ExtendedMonzo.fromEqualTemperament(
        new Fraction(5, 5),
        new Fraction(2),
        4
      ),
    ];
    const scale = Scale.fromIntervalArray(intervals).approximateHarmonics(4);
    expect(
      scale
        .getMonzo(1)
        .strictEquals(ExtendedMonzo.fromFraction(new Fraction(5, 4), 4))
    ).toBeTruthy();
    expect(
      scale
        .getMonzo(2)
        .strictEquals(ExtendedMonzo.fromFraction(new Fraction(7, 4), 4))
    ).toBeTruthy();
    expect(
      scale
        .getMonzo(3)
        .strictEquals(ExtendedMonzo.fromFraction(new Fraction(8, 4), 4))
    ).toBeTruthy();
  });
  it("can be approximated by subharmonics", () => {
    const intervals = [
      ExtendedMonzo.fromEqualTemperament(
        new Fraction(3, 5),
        new Fraction(2),
        4
      ),
      ExtendedMonzo.fromEqualTemperament(
        new Fraction(4, 5),
        new Fraction(2),
        4
      ),
      ExtendedMonzo.fromEqualTemperament(
        new Fraction(5, 5),
        new Fraction(2),
        4
      ),
    ];
    const scale =
      Scale.fromIntervalArray(intervals).approximateSubharmonics(16);
    expect(
      scale
        .getMonzo(1)
        .strictEquals(ExtendedMonzo.fromFraction(new Fraction(16, 11), 4))
    ).toBeTruthy();
    expect(
      scale
        .getMonzo(2)
        .strictEquals(ExtendedMonzo.fromFraction(new Fraction(16, 9), 4))
    ).toBeTruthy();
    expect(
      scale
        .getMonzo(3)
        .strictEquals(ExtendedMonzo.fromFraction(new Fraction(16, 8), 4))
    ).toBeTruthy();
  });
  it("can be approximated in an odd limit", () => {
    const intervals = [
      ExtendedMonzo.fromEqualTemperament(
        new Fraction(2, 5),
        new Fraction(2),
        4
      ),
      ExtendedMonzo.fromEqualTemperament(
        new Fraction(4, 5),
        new Fraction(2),
        4
      ),
      ExtendedMonzo.fromEqualTemperament(
        new Fraction(5, 5),
        new Fraction(2),
        4
      ),
    ];
    const scale = Scale.fromIntervalArray(intervals).approximateOddLimit(7);
    expect(
      scale
        .getMonzo(1)
        .strictEquals(ExtendedMonzo.fromFraction(new Fraction(4, 3), 4))
    ).toBeTruthy();
    expect(
      scale
        .getMonzo(2)
        .strictEquals(ExtendedMonzo.fromFraction(new Fraction(7, 4), 4))
    ).toBeTruthy();
    expect(
      scale
        .getMonzo(3)
        .strictEquals(ExtendedMonzo.fromFraction(new Fraction(2), 4))
    ).toBeTruthy();
  });

  it("can generate equal temperament", () => {
    const scale = Scale.fromEqualTemperament(3, new Fraction(2), 1);
    expect(
      scale
        .getMonzo(1)
        .strictEquals(
          ExtendedMonzo.fromEqualTemperament(
            new Fraction(1, 3),
            new Fraction(2),
            1
          )
        )
    ).toBeTruthy();
    expect(
      scale
        .getMonzo(2)
        .strictEquals(
          ExtendedMonzo.fromEqualTemperament(
            new Fraction(2, 3),
            new Fraction(2),
            1
          )
        )
    ).toBeTruthy();
    expect(
      scale
        .getMonzo(3)
        .strictEquals(
          ExtendedMonzo.fromEqualTemperament(
            new Fraction(3, 3),
            new Fraction(2),
            1
          )
        )
    ).toBeTruthy();
  });
  it("can generate rank 2", () => {
    const meantoneFifth = ExtendedMonzo.fromEqualTemperament(
      new Fraction(1, 4),
      new Fraction(5),
      3
    );
    const octave = ExtendedMonzo.fromFraction(new Fraction(2), 3);
    const scale = Scale.fromRank2(meantoneFifth, octave, 5, 0);

    const [half, justThird] = scale.getMonzo(1).toEqualTemperament();
    expect(half.equals(new Fraction(1, 2))).toBeTruthy();
    expect(justThird.equals(new Fraction(5, 4))).toBeTruthy();

    const [one, anotherJustThird] = scale.getMonzo(2).toEqualTemperament();
    expect(one.equals(1)).toBeTruthy();
    expect(anotherJustThird.equals(new Fraction(5, 4))).toBeTruthy();

    expect(scale.getMonzo(3).strictEquals(meantoneFifth)).toBeTruthy();

    expect(scale.getMonzo(4).toCents()).toBeCloseTo(889.735);

    expect(scale.getMonzo(5).strictEquals(octave)).toBeTruthy();
  });
  it("can generate harmonic series segment", () => {
    const scale = Scale.fromHarmonicSeries(4, 8, 4);
    expect(
      scale.getMonzo(0).toFraction().equals(new Fraction(4, 4))
    ).toBeTruthy();
    expect(
      scale.getMonzo(1).toFraction().equals(new Fraction(5, 4))
    ).toBeTruthy();
    expect(
      scale.getMonzo(2).toFraction().equals(new Fraction(6, 4))
    ).toBeTruthy();
    expect(
      scale.getMonzo(3).toFraction().equals(new Fraction(7, 4))
    ).toBeTruthy();
    expect(
      scale.getMonzo(4).toFraction().equals(new Fraction(8, 4))
    ).toBeTruthy();
  });
  it("can generate subharmonic series segment", () => {
    const scale = Scale.fromSubharmonicSeries(4, 2, 2);
    expect(
      scale.getMonzo(0).toFraction().equals(new Fraction(4, 4))
    ).toBeTruthy();
    expect(
      scale.getMonzo(1).toFraction().equals(new Fraction(4, 3))
    ).toBeTruthy();
    expect(
      scale.getMonzo(2).toFraction().equals(new Fraction(4, 2))
    ).toBeTruthy();
  });
  it("can enumerate a chord", () => {
    const scale = Scale.fromChord([10, 13, 15, 16, 20], 5);
    expect(
      scale.getMonzo(0).toFraction().equals(new Fraction(10, 10))
    ).toBeTruthy();
    expect(
      scale.getMonzo(1).toFraction().equals(new Fraction(13, 10))
    ).toBeTruthy();
    expect(
      scale.getMonzo(2).toFraction().equals(new Fraction(15, 10))
    ).toBeTruthy();
    expect(
      scale.getMonzo(3).toFraction().equals(new Fraction(16, 10))
    ).toBeTruthy();
    expect(
      scale.getMonzo(4).toFraction().equals(new Fraction(20, 10))
    ).toBeTruthy();
  });
  it("can enumerate an inverted chord", () => {
    const scale = Scale.fromInvertedChord([10, 13, 15, 20], 5);
    expect(
      scale.getMonzo(0).toFraction().equals(new Fraction(20, 20))
    ).toBeTruthy();
    expect(
      scale.getMonzo(1).toFraction().equals(new Fraction(20, 15))
    ).toBeTruthy();
    expect(
      scale.getMonzo(2).toFraction().equals(new Fraction(20, 13))
    ).toBeTruthy();
    expect(
      scale.getMonzo(3).toFraction().equals(new Fraction(20, 10))
    ).toBeTruthy();
  });
  it("can generate a combination product set", () => {
    const one = ExtendedMonzo.fromNumber(1, 4);
    const two = ExtendedMonzo.fromNumber(2, 4);
    const three = ExtendedMonzo.fromNumber(3, 4);
    const five = ExtendedMonzo.fromNumber(5, 4);
    const seven = ExtendedMonzo.fromNumber(7, 4);
    const scale = Scale.fromCombinations(
      [one, three, five, seven],
      2,
      false,
      two
    );
    expect(
      scale.getMonzo(1).toFraction().equals(new Fraction(7, 6))
    ).toBeTruthy();
    expect(
      scale.getMonzo(2).toFraction().equals(new Fraction(5, 4))
    ).toBeTruthy();
    expect(
      scale.getMonzo(3).toFraction().equals(new Fraction(35, 24))
    ).toBeTruthy();
    expect(
      scale.getMonzo(4).toFraction().equals(new Fraction(5, 3))
    ).toBeTruthy();
    expect(
      scale.getMonzo(5).toFraction().equals(new Fraction(7, 4))
    ).toBeTruthy();
    expect(
      scale.getMonzo(6).toFraction().equals(new Fraction(2, 1))
    ).toBeTruthy();
  });
  it("can generate a lattice", () => {
    const two = ExtendedMonzo.fromNumber(2, 3);
    const three = ExtendedMonzo.fromNumber(3, 3);
    const five = ExtendedMonzo.fromNumber(5, 3);
    const scale = Scale.fromLattice([three, five], [3, 2], two);
    expect(scale.getMonzo(0).toFraction().equals(1)).toBeTruthy();
    expect(
      scale.getMonzo(1).toFraction().equals(new Fraction(9, 8))
    ).toBeTruthy();
    expect(
      scale.getMonzo(2).toFraction().equals(new Fraction(5, 4))
    ).toBeTruthy();
    expect(
      scale.getMonzo(3).toFraction().equals(new Fraction(45, 32))
    ).toBeTruthy();
    expect(
      scale.getMonzo(4).toFraction().equals(new Fraction(3, 2))
    ).toBeTruthy();
    expect(
      scale.getMonzo(5).toFraction().equals(new Fraction(15, 8))
    ).toBeTruthy();
    expect(
      scale.getMonzo(6).toFraction().equals(new Fraction(2, 1))
    ).toBeTruthy();
  });
  it("can generate an octahedron", () => {
    const two = ExtendedMonzo.fromNumber(2, 4);
    const three = ExtendedMonzo.fromNumber(3, 4);
    const five = ExtendedMonzo.fromNumber(5, 4);
    const seven = ExtendedMonzo.fromNumber(7, 4);
    const scale = Scale.fromCrossPolytope([three, five, seven], false, two);
    expect(scale.getMonzo(0).toFraction().equals(1)).toBeTruthy();
    expect(
      scale.getMonzo(1).toFraction().equals(new Fraction(35, 32))
    ).toBeTruthy();
    expect(
      scale.getMonzo(2).toFraction().equals(new Fraction(7, 6))
    ).toBeTruthy();
    expect(
      scale.getMonzo(3).toFraction().equals(new Fraction(21, 16))
    ).toBeTruthy();
    expect(
      scale.getMonzo(4).toFraction().equals(new Fraction(7, 5))
    ).toBeTruthy();
    expect(
      scale.getMonzo(5).toFraction().equals(new Fraction(49, 32))
    ).toBeTruthy();
    expect(
      scale.getMonzo(6).toFraction().equals(new Fraction(2, 1))
    ).toBeTruthy();
  });
  it("can generate a scale with a 24-cell symmetry", () => {
    const two = ExtendedMonzo.fromNumber(2, 5);
    const three = ExtendedMonzo.fromNumber(3, 5);
    const five = ExtendedMonzo.fromNumber(5, 5);
    const seven = ExtendedMonzo.fromNumber(7, 5);
    const eleven = ExtendedMonzo.fromNumber(11, 5);
    const scale = Scale.fromOctaplex([three, five, seven, eleven], false, two);
    expect(scale.size).toBe(24);
  });
  it("can generate a MOS scale", () => {
    const octave = ExtendedMonzo.fromNumber(2, 1);
    const bish = Scale.fromMos(3, 4, 2, 1, 3, octave);
    expect(bish.getMonzo(0).toCents()).toBeCloseTo(0);
    expect(bish.getMonzo(1).toCents()).toBeCloseTo(120);
    expect(bish.getMonzo(2).toCents()).toBeCloseTo(360);
    expect(bish.getMonzo(3).toCents()).toBeCloseTo(480);
    expect(bish.getMonzo(4).toCents()).toBeCloseTo(720);
    expect(bish.getMonzo(5).toCents()).toBeCloseTo(840);
    expect(bish.getMonzo(6).toCents()).toBeCloseTo(1080);
    expect(bish.getMonzo(7).toCents()).toBeCloseTo(1200);
  });
  it("can tile", () => {
    const two = ExtendedMonzo.fromNumber(2, 3);
    const three = ExtendedMonzo.fromNumber(3, 3);
    const five = ExtendedMonzo.fromNumber(5, 3);
    const hexagon = Scale.fromIntervalArray([
      three,
      five,
      three.mul(2).add(five),
      five.mul(2).add(three),
      three.mul(2).add(five.mul(2)),
      two,
    ]);
    const tiled = hexagon.merge(hexagon.transpose(three.sub(five)));
    expect(tiled.size).toBe(2 * hexagon.size - 2);
  });
  it("can produce pretty wild scales", () => {
    const two = ExtendedMonzo.fromNumber(2, 5);
    const three = ExtendedMonzo.fromNumber(3, 5);
    const five = ExtendedMonzo.fromNumber(5, 5);
    const seven = ExtendedMonzo.fromNumber(7, 5);
    const eleven = ExtendedMonzo.fromNumber(11, 5);
    const neutralDiagonal = three.add(five).add(seven).add(eleven).div(2);
    const orthoplex = Scale.fromCrossPolytope(
      [three, five, seven, eleven],
      true,
      two
    );
    const tesseract = Scale.fromCube([three, five, seven, eleven], two);
    const octaplex = orthoplex.merge(
      tesseract.transpose(neutralDiagonal.neg())
    );
    // Check that it's an orthoplex with origin
    expect(octaplex.size).toBe(24 + 1);
    // Check that every proper vertex is at unit distance from the origin
    for (let i = 1; i < octaplex.size; ++i) {
      expect(
        octaplex
          .getMonzo(i)
          .vector.slice(1)
          .reduce((a, b) => a.add(b.mul(b)), new Fraction(0))
          .equals(1)
      ).toBeTruthy();
    }
  });
});
