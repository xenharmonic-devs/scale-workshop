import Fraction from "fraction.js";
import { mosSizes } from "moment-of-symmetry";
import {
  type Monzo,
  type Val,
  type SubgroupValue,
  Temperament,
  type TuningOptions,
  type FractionValue,
  PRIMES,
  LOG_PRIMES,
  fromWarts,
  type Weights,
  Subgroup,
} from "temperaments";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "./constants";

import ExtendedMonzo from "./monzo";
import Scale from "./scale";
import { toBrightGenerator } from "./utils";

export class Mapping {
  columns: ExtendedMonzo[];

  constructor(columns: ExtendedMonzo[]) {
    this.columns = columns;
  }

  static fromVals(
    vals: (Val | number | string)[],
    subgroup: SubgroupValue,
    numberOfComponents: number,
    options?: TuningOptions
  ) {
    const temperament = Temperament.fromVals(vals, subgroup);
    return Mapping.fromTemperament(temperament, numberOfComponents, options);
  }

  static fromCommas(
    commaList: ExtendedMonzo[] | (Monzo | FractionValue)[],
    subgroup?: SubgroupValue,
    numberOfComponents?: number,
    options?: TuningOptions
  ) {
    if (commaList.length) {
      if (commaList[0] instanceof ExtendedMonzo) {
        if (numberOfComponents === undefined) {
          numberOfComponents = commaList[0].numberOfComponents;
        }
        commaList = (commaList as ExtendedMonzo[]).map((em: ExtendedMonzo) =>
          em.toIntegerMonzo()
        );
      }
    }
    if (numberOfComponents === undefined) {
      throw new Error("Must give number of components or use extended monzos");
    }
    const temperament = Temperament.fromCommas(
      commaList as (Monzo | FractionValue)[],
      subgroup,
      true
    );
    return Mapping.fromTemperament(temperament, numberOfComponents, options);
  }

  static fromTemperament(
    temperament: Temperament,
    numberOfComponents: number,
    options?: TuningOptions
  ) {
    options = options || {};
    const primeMapping = options.primeMapping;
    const units = options.units;
    options.primeMapping = true;
    options.units = "nats";
    const mapping = temperament.getMapping(options);
    options.primeMapping = primeMapping;
    options.units = units;
    if (mapping.length > numberOfComponents) {
      throw new Error("Not enough components to represent mapping");
    }
    const columns: ExtendedMonzo[] = [];
    mapping.forEach((primeMapping, index) => {
      const column = ExtendedMonzo.fromNumber(
        PRIMES[index],
        numberOfComponents
      );
      columns.push(column.stretch(primeMapping / LOG_PRIMES[index]));
    });
    while (columns.length < numberOfComponents) {
      columns.push(
        ExtendedMonzo.fromNumber(PRIMES[columns.length], numberOfComponents)
      );
    }
    return new Mapping(columns);
  }

  static fromWarts(
    wartToken: number | string,
    numberOfPrimesOrJip: number | number[],
    equave?: ExtendedMonzo
  ) {
    const mapping = fromWarts(wartToken, numberOfPrimesOrJip);
    if (!mapping.length) {
      throw new Error("Failed to produce mapping");
    }
    if (equave === undefined) {
      if (Array.isArray(numberOfPrimesOrJip)) {
        equave = ExtendedMonzo.fromNumber(1, mapping.length);
        equave.nats = numberOfPrimesOrJip[0];
      } else {
        equave = ExtendedMonzo.fromNumber(2, mapping.length);
      }
    }
    const columns: ExtendedMonzo[] = [];
    mapping.forEach((steps) => {
      columns.push(equave!.mul(new Fraction(steps, mapping[0])));
    });
    return new Mapping(columns);
  }

  get size() {
    return this.columns.length;
  }

  pureOctaves() {
    const purifier = Math.LN2 / this.columns[0].totalNats();
    const columns = this.columns.map((column) => column.stretch(purifier));
    return new Mapping(columns);
  }

  apply(interval: ExtendedMonzo): ExtendedMonzo;
  apply(scale: Scale): Scale;
  apply(intervalOrScale: ExtendedMonzo | Scale): ExtendedMonzo | Scale {
    if (intervalOrScale instanceof ExtendedMonzo) {
      const interval = intervalOrScale;
      let result = this.columns[0].mul(interval.vector[0]);
      for (let i = 1; i < this.size; ++i) {
        result = result.add(this.columns[i].mul(interval.vector[i]));
      }
      return result;
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
    subgroup,
    DEFAULT_NUMBER_OF_COMPONENTS,
    { temperEquaves: true, weights }
  );
  return mapping.apply(scale);
}

function divisionsAndMosSizes(
  temperament: Temperament,
  maxSize?: number,
  maxLength?: number,
  options?: TuningOptions
): [number, number[]] {
  const divisions = temperament.divisionsGenerator()[0];
  const [period, generator] = temperament.periodGenerator(options);
  return [
    divisions,
    mosSizes(generator / period, maxSize, maxLength).map(
      (size) => size * divisions
    ),
  ];
}

export function mosSizesRank2FromVals(
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
  return divisionsAndMosSizes(temperament, maxSize, maxLength, options);
}

export function mosSizesRank2FromCommas(
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
  return divisionsAndMosSizes(temperament, maxSize, maxLength, options);
}

function makeRank2(
  temperament: Temperament,
  size: number,
  down: number,
  options?: TuningOptions
) {
  const divisions = temperament.divisionsGenerator()[0];
  if (size % divisions !== 0) {
    throw new Error(`Given size '${size}' isn't a multiple of ${divisions}`);
  }
  const segmentSize = size / divisions;

  const [period, generator] = temperament.periodGenerator(options);
  const brightGenerator = toBrightGenerator(generator, period, segmentSize);

  const scale = Scale.fromRank2(
    ExtendedMonzo.fromCents(brightGenerator, DEFAULT_NUMBER_OF_COMPONENTS),
    ExtendedMonzo.fromCents(period, DEFAULT_NUMBER_OF_COMPONENTS),
    segmentSize,
    down
  );

  return scale.repeat(divisions);
}

export function makeRank2FromVals(
  vals: (Val | number | string)[],
  size: number,
  down: number,
  subgroup: SubgroupValue,
  options?: TuningOptions
) {
  const temperament = Temperament.fromVals(vals, subgroup);
  if (temperament.getRank() !== 2) {
    throw new Error("Given vals do not define a rank 2 temperament");
  }
  return makeRank2(temperament, size, down, options);
}

export function makeRank2FromCommas(
  commas: (Monzo | FractionValue)[],
  size: number,
  down: number,
  subgroup?: SubgroupValue,
  options?: TuningOptions
) {
  const temperament = Temperament.fromCommas(commas, subgroup);
  if (temperament.getRank() !== 2) {
    throw new Error("Given vals do not define a rank 2 temperament");
  }
  return makeRank2(temperament, size, down, options);
}
