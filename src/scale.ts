import Fraction from "fraction.js";

import ExtendedMonzo, { type ScaleLineOptions } from "@/monzo";
import { kCombinations } from "@/combinations";
import { LOG_PRIMES, PRIMES } from "@/constants";

function mmod(a: number, b: number) {
  return ((a % b) + b) % b;
}

export default class Scale {
  intervals: ExtendedMonzo[];
  equave: ExtendedMonzo;
  baseFrequency: number;

  constructor(
    intervals: ExtendedMonzo[],
    equave: ExtendedMonzo,
    baseFrequency: number
  ) {
    this.intervals = intervals;
    this.equave = equave;
    this.baseFrequency = baseFrequency;
  }

  static fromIntervalArray(intervals: ExtendedMonzo[], baseFrequency = 440) {
    if (intervals.length < 1) {
      throw new Error("At least one interval is required");
    }
    intervals = [...intervals];
    const equave = intervals.pop()!;
    intervals.unshift(equave.mul(0));
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
    const equaveMonzo = ExtendedMonzo.fromFraction(equave, numberOfComponents);
    return new Scale(intervals, equaveMonzo, baseFrequency);
  }

  static fromRank2(
    generator: ExtendedMonzo,
    period: ExtendedMonzo,
    size: number,
    down: number,
    baseFrequency = 440
  ) {
    if (down < 0) {
      throw new Error("Down must be non-negative");
    }
    if (down > size) {
      throw new Error("Down must be less than size");
    }
    const intervals = [];
    for (let i = 0; i < size; ++i) {
      intervals.push(generator.mul(i - down).mmod(period));
    }
    const result = new Scale(intervals, period, baseFrequency);
    result.sortInPlace();
    return result;
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
        ExtendedMonzo.fromFraction(
          new Fraction(numerator, denominator),
          numberOfComponents
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
        ExtendedMonzo.fromFraction(
          new Fraction(numerator, denominator),
          numberOfComponents
        )
      );
    }
    const equave = intervals.pop()!;
    return new Scale(intervals, equave, baseFrequency);
  }

  static fromChord(
    chord: number[],
    numberOfComponents: number,
    baseFrequency = 440
  ) {
    if (chord.length < 2) {
      throw new Error("Need at least two tones to enumerate a chord");
    }
    const root = chord[0];
    const intervals = chord.map((tone) =>
      ExtendedMonzo.fromFraction(new Fraction(tone, root), numberOfComponents)
    );
    const equave = intervals.pop()!;
    return new Scale(intervals, equave, baseFrequency);
  }

  static fromInvertedChord(
    chord: number[],
    numberOfComponents: number,
    baseFrequency = 440
  ) {
    if (chord.length < 2) {
      throw new Error("Need at least two tones to enumerate a chord");
    }
    const numerator = chord[chord.length - 1];
    const intervals = chord.map((denominator) =>
      ExtendedMonzo.fromFraction(
        new Fraction(numerator, denominator),
        numberOfComponents
      )
    );
    intervals.reverse();
    const equave = intervals.pop()!;
    return new Scale(intervals, equave, baseFrequency);
  }

  static fromCombinations(
    factors: ExtendedMonzo[],
    numElements: number,
    addUnity: boolean,
    equave: ExtendedMonzo,
    baseFrequency = 440
  ) {
    if (numElements > factors.length) {
      throw new Error(
        "Number of elements in a combination must be less than or equal to the number of factors"
      );
    }
    const unity = equave.mul(0);
    let intervals: ExtendedMonzo[] = [];
    kCombinations(factors, numElements).forEach((combination) => {
      intervals.push(
        combination.reduce(
          (a: ExtendedMonzo, b: ExtendedMonzo) => a.add(b),
          unity
        )
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
    basis: ExtendedMonzo[],
    dimensions: number[],
    equave: ExtendedMonzo,
    baseFrequency = 440
  ) {
    let intervals: ExtendedMonzo[] = [];
    function span(accumulator: ExtendedMonzo, index: number) {
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

  static fromCube(
    basis: ExtendedMonzo[],
    equave: ExtendedMonzo,
    baseFrequency = 440
  ) {
    return this.fromLattice(
      basis,
      Array(basis.length).fill(2),
      equave,
      baseFrequency
    );
  }

  static fromCrossPolytope(
    basis: ExtendedMonzo[],
    addUnity: boolean,
    equave: ExtendedMonzo,
    baseFrequency = 440
  ) {
    let intervals: ExtendedMonzo[] = [];
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
    basis: ExtendedMonzo[],
    addUnity: boolean,
    equave: ExtendedMonzo,
    baseFrequency = 440
  ) {
    if (basis.length !== 4) {
      throw new Error("Octaplex can only be generated using 4 basis vectors");
    }
    let intervals: ExtendedMonzo[] = [];
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
    return new Scale(intervals, equaveMonzo, baseFrequency);
  }

  static fromDwarf(
    val: number,
    equave: number,
    numberOfComponents: number,
    baseFrequency = 440
  ) {
    const valPerLogEquave = val / Math.log(equave);
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
          degree += component * Math.round(LOG_PRIMES[i] * valPerLogEquave);
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
    return new Scale(intervals, equaveMonzo, baseFrequency);
  }

  get size() {
    return this.intervals.length;
  }

  get numberOfComponents() {
    return this.equave.numberOfComponents;
  }

  getMonzo(index: number) {
    const numEquaves = Math.floor(index / this.size);
    index -= numEquaves * this.size;
    return this.intervals[index].add(this.equave.mul(numEquaves));
  }

  getFrequency(index: number) {
    return this.baseFrequency * Math.exp(this.getMonzo(index).totalNats());
  }

  sortInPlace() {
    this.intervals.sort((a, b) => a.compare(b));
    return this;
  }

  variant(intervals: ExtendedMonzo[]) {
    return new Scale(intervals, this.equave, this.baseFrequency);
  }

  sort() {
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

  subset(indices: number[]) {
    if (!indices.includes(0)) {
      throw new Error("Subset must include unison");
    }
    const intervals: (ExtendedMonzo | undefined)[] = indices.map(
      (i) => this.intervals[i]
    );
    if (intervals.includes(undefined)) {
      throw new Error("Subset index out of bounds");
    }
    return this.variant(intervals as ExtendedMonzo[]);
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

  vary(maxNats: number) {
    const intervals = this.intervals.map((interval) => {
      const offset = (Math.random() * 2 - 1) * maxNats;
      return new ExtendedMonzo(
        interval.vector,
        interval.residual,
        interval.nats + offset
      );
    });
    return this.variant(intervals);
  }

  // Moves unison as well. Useful with merge, but not by itself.
  transpose(offset: ExtendedMonzo) {
    const intervals = this.intervals.map((interval) => interval.add(offset));
    return this.variant(intervals);
  }

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

  transposeDegree(degree: number, offset: ExtendedMonzo) {
    degree = mmod(degree, this.size);
    const intervals = [...this.intervals];
    intervals[degree] = intervals[degree].add(offset);
    return this.variant(intervals);
  }

  insertAfter(degree: number, interval: ExtendedMonzo) {
    degree = mmod(degree, this.size);
    const intervals = [...this.intervals];
    intervals.splice(degree + 1, 0, interval);
    return this.variant(intervals);
  }

  approximateEqualTemperament(divisions: number) {
    const step = this.equave.div(divisions);
    const stepNats = step.totalNats();
    const intervals = this.intervals.map((interval) => {
      const numSteps = Math.round(interval.totalNats() / stepNats);
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

  // Reverse parsing
  toScaleLines(options?: ScaleLineOptions): string[] {
    const result = this.intervals
      .slice(1)
      .map((interval) => interval.toScaleLine(options));
    result.push(this.equave.toScaleLine(options));
    return result;
  }
}
