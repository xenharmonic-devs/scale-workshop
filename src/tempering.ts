import Fraction from "fraction.js";
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
} from "temperaments";

import ExtendedMonzo from "./monzo";
import Scale from "./scale";

export default class Mapping {
  columns: ExtendedMonzo[];

  constructor(columns: ExtendedMonzo[]) {
    this.columns = columns;
  }

  static fromValList(
    vals: (Val | number | string)[],
    subgroup: SubgroupValue,
    numberOfComponents: number,
    options?: TuningOptions
  ) {
    const temperament = Temperament.fromVals(vals, subgroup);
    return Mapping.fromTemperament(temperament, numberOfComponents, options);
  }

  static fromCommaList(
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
      // const untempered = interval.clone();
      // for (let i = 0; i < this.size; ++i) {
      //   untempered.vector[i] = untempered.vector[i].mul(0);
      // }
      // result = result.add(untempered);
      return result;
    }
    const scale = intervalOrScale;
    const intervals = scale.intervals.map((interval) => this.apply(interval));
    return new Scale(intervals, this.apply(scale.equave), scale.baseFrequency);
  }
}
