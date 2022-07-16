import { mosPatterns, toBrightGeneratorPerPeriod } from "moment-of-symmetry";
import {
  type Monzo,
  type Val,
  type SubgroupValue,
  Temperament,
  type TuningOptions,
  fromWarts,
  type Weights,
  Subgroup,
} from "temperaments";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "./constants";
import Scale from "./scale";
import { Interval } from "./interval";
import { PRIME_CENTS, valueToCents, type FractionValue } from "xen-dev-utils";

export class Mapping {
  vector: number[];

  constructor(vector: number[]) {
    this.vector = vector;
  }

  static fromVals(
    vals: (Val | number | string)[],
    numberOfComponents: number,
    subgroup: SubgroupValue,
    options?: TuningOptions
  ) {
    const temperament = Temperament.fromVals(vals, subgroup);
    return Mapping.fromTemperament(temperament, numberOfComponents, options);
  }

  static fromCommas(
    commaList: (Monzo | FractionValue)[],
    numberOfComponents: number,
    subgroup?: SubgroupValue,
    options?: TuningOptions
  ) {
    const temperament = Temperament.fromCommas(commaList, subgroup, true);
    return Mapping.fromTemperament(temperament, numberOfComponents, options);
  }

  static fromTemperament(
    temperament: Temperament,
    numberOfComponents: number,
    options?: TuningOptions
  ) {
    options = Object.assign({}, options || {});
    options.primeMapping = true;
    options.units = "cents";
    const mapping = temperament.getMapping(options);
    if (mapping.length > numberOfComponents) {
      throw new Error("Not enough components to represent mapping");
    }
    while (mapping.length < numberOfComponents) {
      mapping.push(PRIME_CENTS[mapping.length]);
    }

    return new Mapping(mapping);
  }

  static fromWarts(
    wartToken: number | string,
    numberOfPrimesOrJip: number | number[],
    equaveCents?: number
  ) {
    const mapping = fromWarts(wartToken, numberOfPrimesOrJip);
    if (!mapping.length) {
      throw new Error("Failed to produce mapping");
    }
    if (equaveCents === undefined) {
      if (Array.isArray(numberOfPrimesOrJip)) {
        equaveCents = numberOfPrimesOrJip[0];
      } else {
        equaveCents = 1200;
      }
    }
    const vector: number[] = [];
    mapping.forEach((steps) => {
      vector.push((equaveCents! * steps) / mapping[0]);
    });
    return new Mapping(vector);
  }

  get size() {
    return this.vector.length;
  }

  pureOctaves() {
    const purifier = 1200 / this.vector[0];
    return new Mapping(this.vector.map((component) => component * purifier));
  }

  apply(interval: Interval): Interval;
  apply(scale: Scale): Scale;
  apply(intervalOrScale: Interval | Scale): Interval | Scale {
    if (intervalOrScale instanceof Interval) {
      const interval = intervalOrScale;
      const monzo = interval.monzo;
      const totalCents = monzo.totalCents();
      if (!totalCents) {
        return interval;
      }
      const cents =
        monzo.vector
          .map((component, i) => component.valueOf() * this.vector[i])
          .reduce((a, b) => a + b) +
        valueToCents(monzo.residual.valueOf()) +
        monzo.cents;
      const tempered = monzo.stretch(cents / totalCents);
      return new Interval(
        tempered,
        interval.type,
        interval.name,
        interval.options
      );
    }
    const scale = intervalOrScale;
    const intervals = scale.intervals.map((interval) => this.apply(interval));
    return new Scale(intervals, this.apply(scale.equave), scale.baseFrequency);
  }
}

// (TE-)optimized equal temperaments
export function makeRank1(
  val: Val | string | number,
  subgroup: SubgroupValue,
  weights?: Weights
) {
  subgroup = new Subgroup(subgroup);
  if (typeof val === "number" || typeof val === "string") {
    val = subgroup.fromWarts(val);
  }

  const equave = subgroup.basis[0];
  const divisions = val[0];
  const scale = Scale.fromEqualTemperament(
    divisions,
    equave,
    DEFAULT_NUMBER_OF_COMPONENTS
  );

  const mapping = Mapping.fromVals(
    [val],
    DEFAULT_NUMBER_OF_COMPONENTS,
    subgroup,
    { temperEquaves: true, weights }
  );
  return mapping.apply(scale);
}

function mosPatternsRank2(
  temperament: Temperament,
  maxSize?: number,
  maxLength?: number,
  options?: TuningOptions
) {
  const numPeriods = temperament.numPeriodsGenerator()[0];
  const [period, generator] = temperament.periodGenerator(options);
  return mosPatterns(generator / period, numPeriods, maxSize, maxLength);
}

export function mosPatternsRank2FromVals(
  vals: (Val | number | string)[],
  subgroup: SubgroupValue,
  maxSize?: number,
  maxLength?: number,
  options?: TuningOptions
) {
  const temperament = Temperament.fromVals(vals, subgroup);
  if (temperament.getRank() !== 2) {
    throw new Error("Given vals do not define a rank 2 temperament");
  }
  return mosPatternsRank2(temperament, maxSize, maxLength, options);
}

export function mosPatternsRank2FromCommas(
  commas: (Monzo | FractionValue)[],
  subgroup?: SubgroupValue,
  maxSize?: number,
  maxLength?: number,
  options?: TuningOptions
) {
  const temperament = Temperament.fromCommas(commas, subgroup);
  if (temperament.getRank() !== 2) {
    throw new Error("Given commas do not define a rank 2 temperament");
  }
  return mosPatternsRank2(temperament, maxSize, maxLength, options);
}

export type Rank2Params = {
  generator: number;
  period: number;
  numPeriods: number;
};

function makeRank2(
  temperament: Temperament,
  size: number,
  options?: TuningOptions
): Rank2Params {
  const numPeriods = temperament.numPeriodsGenerator()[0];
  if (size % numPeriods) {
    throw new Error(`Given size '${size}' isn't a multiple of ${numPeriods}`);
  }
  const segmentSize = size / numPeriods;

  const [period, generator] = temperament.periodGenerator(options);
  const brightGenerator =
    toBrightGeneratorPerPeriod(generator / period, segmentSize) * period;

  return { generator: brightGenerator, period, numPeriods };
}

export function makeRank2FromVals(
  vals: (Val | number | string)[],
  size: number,
  subgroup: SubgroupValue,
  options?: TuningOptions
) {
  const temperament = Temperament.fromVals(vals, subgroup);
  if (temperament.getRank() !== 2) {
    throw new Error("Given vals do not define a rank 2 temperament");
  }
  return makeRank2(temperament, size, options);
}

export function makeRank2FromCommas(
  commas: (Monzo | FractionValue)[],
  size: number,
  subgroup?: SubgroupValue,
  options?: TuningOptions
) {
  const temperament = Temperament.fromCommas(commas, subgroup);
  if (temperament.getRank() !== 2) {
    throw new Error("Given vals do not define a rank 2 temperament");
  }
  return makeRank2(temperament, size, options);
}
