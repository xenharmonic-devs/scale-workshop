import Fraction from "fraction.js";
import { mos } from "moment-of-symmetry";

import ExtendedMonzo from "@/monzo";
import { kCombinations } from "@/combinations";
import { PRIME_CENTS, PRIMES } from "@/constants";
import { Interval, type IntervalOptions } from "@/interval";
import { mmod, valueToCents } from "@/utils";

// TODO: Convert methods relevant for non-destructive editing #33
export default class Scale {
  intervals: Interval[];
  equave: Interval;
  baseFrequency: number;

  constructor(intervals: Interval[], equave: Interval, baseFrequency: number) {
    this.intervals = intervals;
    this.equave = equave;
    this.baseFrequency = baseFrequency;
  }

  static fromIntervalArray(intervals: Interval[], baseFrequency = 440) {
    if (intervals.length < 1) {
      throw new Error("At least one interval is required");
    }
    intervals = [...intervals];
    const equave = intervals.pop()!;
    intervals.unshift(equave.zeroed());
    return new Scale(intervals, equave, baseFrequency);
  }

  static fromEqualTemperament(
    divisions: number,
    equave: Fraction,
    numberOfComponents: number,
    baseFrequency = 440
  ) {
    const intervals = [];
    for (let i = 0; i < divisions; ++i) {
      intervals.push(
        ExtendedMonzo.fromEqualTemperament(
          new Fraction(i, divisions),
          equave,
          numberOfComponents
        )
      );
    }
    const options: IntervalOptions = {
      preferredEtDenominator: divisions,
      preferredEtEquave: equave,
    };
    const equaveInterval = new Interval(
      ExtendedMonzo.fromFraction(equave, numberOfComponents),
      "equal temperament",
      undefined,
      options
    );
    return new Scale(
      intervals.map(
        (monzo) => new Interval(monzo, "equal temperament", undefined, options)
      ),
      equaveInterval,
      baseFrequency
    );
  }

  static fromRank2(
    generator: Interval,
    period: Interval,
    size: number,
    down: number,
    numPeriods = 1,
    baseFrequency = 440
  ) {
    if (down < 0) {
      throw new Error("Down must be non-negative");
    }
    if (down > size) {
      throw new Error("Down must be less than size");
    }
    if (size % numPeriods) {
      throw new Error("Size must be a multiple of the number of periods");
    }
    if (down % numPeriods) {
      throw new Error("Down must be a multiple of the number of periods");
    }
    size /= numPeriods;
    down /= numPeriods;
    const intervals = [];
    for (let i = 0; i < size; ++i) {
      intervals.push(generator.mul(i - down).mmod(period));
    }
    const result = new Scale(intervals, period, baseFrequency);
    result.sortInPlace();
    return result.repeat(numPeriods);
  }

  static fromHarmonicSeries(
    denominator: number,
    greatestNumerator: number,
    numberOfComponents: number,
    baseFrequency = 440
  ) {
    if (denominator <= 0) {
      throw new Error("The denominator must be positive");
    }
    if (greatestNumerator <= denominator) {
      throw new Error(
        "The greatest numerator must be larger than the denominator"
      );
    }
    const intervals = [];
    for (
      let numerator = denominator;
      numerator <= greatestNumerator;
      numerator++
    ) {
      intervals.push(
        new Interval(
          ExtendedMonzo.fromFraction(
            new Fraction(numerator, denominator),
            numberOfComponents
          ),
          "ratio",
          undefined,
          { preferredDenominator: denominator }
        )
      );
    }
    const equave = intervals.pop()!;
    return new Scale(intervals, equave, baseFrequency);
  }

  static fromSubharmonicSeries(
    numerator: number,
    leastDenominator: number,
    numberOfComponents: number,
    baseFrequency = 440
  ) {
    if (numerator <= 1) {
      throw new Error("The numerator must be larger than one");
    }
    if (leastDenominator <= 0) {
      throw new Error("The least demoninator must be positive");
    }
    const intervals = [];
    for (
      let denominator = numerator;
      denominator >= leastDenominator;
      denominator--
    ) {
      intervals.push(
        new Interval(
          ExtendedMonzo.fromFraction(
            new Fraction(numerator, denominator),
            numberOfComponents
          ),
          "ratio",
          undefined,
          { preferredNumerator: numerator }
        )
      );
    }
    const equave = intervals.pop()!;
    return new Scale(intervals, equave, baseFrequency);
  }

  static fromChord(chord: Interval[], baseFrequency = 440) {
    if (chord.length < 2) {
      throw new Error("Need at least two tones to enumerate a chord");
    }
    const root = chord[0];
    const intervals = chord.map((tone) => tone.sub(root));
    const equave = intervals.pop()!;
    return new Scale(intervals, equave, baseFrequency);
  }

  static fromCombinations(
    factors: Interval[],
    numElements: number,
    addUnity: boolean,
    equave: Interval,
    baseFrequency = 440
  ) {
    if (numElements > factors.length) {
      throw new Error(
        "Number of elements in a combination must be less than or equal to the number of factors"
      );
    }
    const unity = equave.mul(0);
    let intervals: Interval[] = [];
    kCombinations(factors, numElements).forEach((combination) => {
      intervals.push(
        combination.reduce((a: Interval, b: Interval) => a.add(b), unity)
      );
    });
    if (addUnity) {
      intervals.push(unity);
    } else {
      intervals.sort((a, b) => a.compare(b));
      const root = intervals[0];
      intervals = intervals.map((interval) => interval.sub(root));
    }
    intervals = intervals.map((interval) => interval.mmod(equave));
    intervals.sort((a, b) => a.compare(b));
    return new Scale(intervals, equave, baseFrequency);
  }

  static fromLattice(
    basis: Interval[],
    dimensions: number[],
    equave: Interval,
    baseFrequency = 440
  ) {
    let intervals: Interval[] = [];
    function span(accumulator: Interval, index: number) {
      if (index >= dimensions.length) {
        intervals.push(accumulator);
        return;
      }
      for (let i = 0; i < dimensions[index]; ++i) {
        span(accumulator.add(basis[index].mul(i)), index + 1);
      }
    }
    span(equave.mul(0), 0);
    intervals = intervals.map((interval) => interval.mmod(equave));
    intervals.sort((a, b) => a.compare(b));
    return new Scale(intervals, equave, baseFrequency);
  }

  static fromCube(basis: Interval[], equave: Interval, baseFrequency = 440) {
    return this.fromLattice(
      basis,
      Array(basis.length).fill(2),
      equave,
      baseFrequency
    );
  }

  static fromCrossPolytope(
    basis: Interval[],
    addUnity: boolean,
    equave: Interval,
    baseFrequency = 440
  ) {
    let intervals: Interval[] = [];
    basis.forEach((basisInterval) => {
      intervals.push(basisInterval);
      intervals.push(basisInterval.neg());
    });
    if (addUnity) {
      intervals.push(equave.mul(0));
    } else {
      intervals.sort((a, b) => a.compare(b));
      const root = intervals[0];
      intervals = intervals.map((interval) => interval.sub(root));
    }
    intervals = intervals.map((interval) => interval.mmod(equave));
    intervals.sort((a, b) => a.compare(b));
    return new Scale(intervals, equave, baseFrequency);
  }

  static fromOctaplex(
    basis: Interval[],
    addUnity: boolean,
    equave: Interval,
    baseFrequency = 440
  ) {
    if (basis.length !== 4) {
      throw new Error("Octaplex can only be generated using 4 basis vectors");
    }
    let intervals: Interval[] = [];
    [-1, 1].forEach((sign1) => {
      [-1, 1].forEach((sign2) => {
        intervals.push(basis[0].mul(sign1).add(basis[1].mul(sign2)));
        intervals.push(basis[0].mul(sign1).add(basis[2].mul(sign2)));
        intervals.push(basis[0].mul(sign1).add(basis[3].mul(sign2)));
        intervals.push(basis[1].mul(sign1).add(basis[3].mul(sign2)));
        intervals.push(basis[2].mul(sign1).add(basis[3].mul(sign2)));
        intervals.push(basis[1].mul(sign1).add(basis[2].mul(sign2)));
      });
    });
    if (addUnity) {
      intervals.push(equave.mul(0));
    } else {
      intervals.sort((a, b) => a.compare(b));
      const root = intervals[0];
      intervals = intervals.map((interval) => interval.sub(root));
    }
    intervals = intervals.map((interval) => interval.mmod(equave));
    intervals.sort((a, b) => a.compare(b));
    return new Scale(intervals, equave, baseFrequency);
  }

  // All Euler-Fokker genera can be generated using Scale.fromLattice,
  // but a single-parameter generator is conceptually simpler.
  static fromEulerGenus(
    guideTone: number,
    equave: number,
    numberOfComponents: number,
    baseFrequency = 440
  ) {
    const factors = [];
    for (let remainder = 1; remainder < equave; ++remainder) {
      for (let n = remainder; n <= guideTone; n += equave) {
        if (guideTone % n === 0) {
          factors.push(n);
        }
      }
    }
    const equaveMonzo = ExtendedMonzo.fromNumber(equave, numberOfComponents);
    const intervals = factors.map((factor) =>
      ExtendedMonzo.fromNumber(factor, numberOfComponents).mmod(equaveMonzo)
    );
    intervals.sort((a, b) => a.compare(b));
    return new Scale(
      intervals.map((interval) => new Interval(interval, "ratio")),
      new Interval(equaveMonzo, "ratio"),
      baseFrequency
    );
  }

  static fromDwarf(
    val: number,
    equave: number,
    numberOfComponents: number,
    baseFrequency = 440
  ) {
    const valPerEquaveCents = val / valueToCents(equave);
    const degrees = new Set();
    const members = [];
    let n = 1;
    while (members.length < val) {
      let degree = 0;
      let m = n;
      let i = 0;
      while (m > 1) {
        let component = 0;
        while (m % PRIMES[i] === 0) {
          m /= PRIMES[i];
          component++;
        }
        if (component !== 0) {
          degree += component * Math.round(PRIME_CENTS[i] * valPerEquaveCents);
        }
        i++;
      }
      degree = degree % val;
      if (!degrees.has(degree)) {
        degrees.add(degree);
        members.push(n);
      }
      n++;
    }
    const equaveMonzo = ExtendedMonzo.fromNumber(equave, numberOfComponents);
    const intervals = members.map((member) =>
      ExtendedMonzo.fromNumber(member, numberOfComponents).mmod(equaveMonzo)
    );
    intervals.sort((a, b) => a.compare(b));
    return new Scale(
      intervals.map((interval) => new Interval(interval, "ratio")),
      new Interval(equaveMonzo, "ratio"),
      baseFrequency
    );
  }

  static fromMos(
    numberOfLargeSteps: number,
    numberOfSmallSteps: number,
    sizeOfLargeStep: number,
    sizeOfSmallStep: number,
    brightGeneratorsUp: number,
    equave: Interval,
    baseFrequency = 440
  ) {
    const steps = mos(
      numberOfLargeSteps,
      numberOfSmallSteps,
      sizeOfLargeStep,
      sizeOfSmallStep,
      brightGeneratorsUp
    );
    const equaveSteps = steps[steps.length - 1];
    equave.options = { preferredEtDenominator: equaveSteps };
    if (equave.monzo.isFractional()) {
      equave.options.preferredEtEquave = equave.monzo.toFraction();
      equave.type = "equal temperament";
    }
    return Scale.fromIntervalArray(
      steps.map((step) => equave.mul(new Fraction(step, equaveSteps))),
      baseFrequency
    );
  }

  get size() {
    return this.intervals.length;
  }

  get numberOfComponents() {
    return this.equave.monzo.numberOfComponents;
  }

  getInterval(index: number) {
    const numEquaves = Math.floor(index / this.size);
    index -= numEquaves * this.size;
    return this.intervals[index].add(this.equave.mul(numEquaves));
  }

  getMonzo(index: number) {
    const numEquaves = Math.floor(index / this.size);
    index -= numEquaves * this.size;
    return this.intervals[index].monzo.add(this.equave.monzo.mul(numEquaves));
  }

  getFrequency(index: number) {
    return this.baseFrequency * this.getMonzo(index).valueOf();
  }

  getName(index: number) {
    index = mmod(index, this.size);
    if (index === 0) {
      return this.equave.name;
    }
    return this.intervals[index].name;
  }

  sortInPlace() {
    this.intervals.sort((a, b) => a.compare(b));
    return this;
  }

  variant(intervals: Interval[]) {
    return new Scale(intervals, this.equave, this.baseFrequency);
  }

  sorted() {
    const intervals = [...this.intervals];
    intervals.sort((a, b) => a.compare(b));
    return this.variant(intervals);
  }

  reduce() {
    const intervals = this.intervals.map((interval) =>
      interval.mmod(this.equave)
    );
    return this.variant(intervals);
  }

  repeat(numRepeats = 2) {
    if (numRepeats === 0) {
      return new Scale(
        [this.intervals[0]],
        this.equave.zeroed(),
        this.baseFrequency
      );
    }
    const intervals = [...this.intervals];
    for (let i = 1; i < numRepeats; ++i) {
      this.intervals.forEach((interval) => {
        intervals.push(interval.add(this.equave.mul(i)));
      });
    }
    return new Scale(
      intervals,
      this.equave.mul(numRepeats),
      this.baseFrequency
    );
  }

  rotate(numSteps = 1) {
    numSteps = mmod(numSteps, this.size);
    const root = this.intervals[numSteps];
    const intervals = [];
    for (let i = numSteps; i < this.size + numSteps; ++i) {
      if (i >= this.size) {
        intervals.push(
          this.intervals[i - this.size].sub(root).add(this.equave)
        );
      } else {
        intervals.push(this.intervals[i].sub(root));
      }
    }
    return this.variant(intervals);
  }

  subset(indices: number[] | Set<number>) {
    if (indices instanceof Set) {
      indices = [...indices.values()];
    }
    if (!indices.includes(0)) {
      throw new Error("Subset must include unison");
    }
    const intervals: (Interval | undefined)[] = indices.map(
      (i) => this.intervals[i]
    );
    if (intervals.includes(undefined)) {
      throw new Error("Subset index out of bounds");
    }
    return this.variant(intervals as Interval[]);
  }

  stretch(scalar: number) {
    const intervals = this.intervals.map((interval) =>
      interval.stretch(scalar)
    );
    return new Scale(
      intervals,
      this.equave.stretch(scalar),
      this.baseFrequency
    );
  }

  invert() {
    const intervals = this.intervals.slice(0, 1);
    for (let i = this.intervals.length - 1; i >= 1; --i) {
      intervals.push(this.equave.sub(this.intervals[i]));
    }
    return this.variant(intervals);
  }

  vary(maxCents: number, varyEquave = false) {
    const intervals = this.intervals.map((interval) => interval.vary(maxCents));
    const result = this.variant(intervals);
    if (varyEquave) {
      result.equave = this.equave.vary(maxCents);
    }
    return result;
  }

  // Moves unison as well. Useful with merge, but not by itself.
  transpose(offset: Interval) {
    const intervals = this.intervals.map((interval) => interval.add(offset));
    return this.variant(intervals);
  }

  /*
  // Duplicates unison and other scale degrees.
  concat(other: Scale) {
    if (this.baseFrequency !== other.baseFrequency) {
      throw new Error("Base frequencies must match when concatenating");
    }
    if (!this.equave.strictEquals(other.equave)) {
      throw new Error("Equaves must match when concatenating");
    }
    const intervals = this.intervals.concat(other.intervals);
    return this.variant(intervals);
  }

  removeDuplicatesInPlace() {
    let i = 1;
    while (i < this.intervals.length) {
      for (let j = 0; j < i; ++j) {
        if (this.intervals[i].strictEquals(this.intervals[j])) {
          this.intervals.splice(i, 1);
          i--;
          break;
        }
      }
      i++;
    }
    return this;
  }

  merge(other: Scale) {
    return this.concat(other).reduce().removeDuplicatesInPlace().sortInPlace();
  }

  transposeDegree(degree: number, offset: Interval) {
    degree = mmod(degree, this.size);
    const intervals = [...this.intervals];
    intervals[degree] = intervals[degree].add(offset);
    return this.variant(intervals);
  }

  insertAfter(degree: number, interval: Interval) {
    degree = mmod(degree, this.size);
    const intervals = [...this.intervals];
    intervals.splice(degree + 1, 0, interval);
    return this.variant(intervals);
  }
  */

  approximateEqualTemperament(divisions: number) {
    const step = this.equave.div(divisions);
    const stepCents = step.totalCents();
    const intervals = this.intervals.map((interval) => {
      const numSteps = Math.round(interval.totalCents() / stepCents);
      return step.mul(numSteps);
    });
    return this.variant(intervals);
  }

  approximateHarmonics(denominator: number) {
    const equave = this.equave.approximateHarmonic(denominator);
    const intervals = this.intervals.map((interval) =>
      interval.approximateHarmonic(denominator)
    );
    return new Scale(intervals, equave, this.baseFrequency);
  }

  approximateSubharmonics(numerator: number) {
    const equave = this.equave.approximateSubharmonic(numerator);
    const intervals = this.intervals.map((interval) =>
      interval.approximateSubharmonic(numerator)
    );
    return new Scale(intervals, equave, this.baseFrequency);
  }

  approximateOddLimit(limit: number) {
    const equave = this.equave.approximateOddLimit(limit);
    const intervals = this.intervals.map((interval) =>
      interval.approximateOddLimit(limit)
    );
    return new Scale(intervals, equave, this.baseFrequency);
  }

  mergeOptions(options: IntervalOptions) {
    const intervals = this.intervals.map((interval) =>
      interval.mergeOptions(options)
    );
    const equave = this.equave.mergeOptions(options);
    return new Scale(intervals, equave, this.baseFrequency);
  }

  // Reverse parsing
  toStrings(): string[] {
    const result = this.intervals
      .slice(1)
      .map((interval) => interval.toString());
    result.push(this.equave.toString());
    return result;
  }
}
