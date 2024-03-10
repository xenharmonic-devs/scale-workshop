import { mosPatterns, toBrightGeneratorPerPeriod } from 'moment-of-symmetry'
import {
  type Val,
  type SubgroupValue,
  Temperament,
  type TuningOptions,
  fromWarts,
  Subgroup,
  type JipOrLimit
} from 'temperaments'
import { DEFAULT_NUMBER_OF_COMPONENTS } from './constants'
import { PRIME_CENTS, type FractionValue, type Monzo } from 'xen-dev-utils'

export function toPrimeMapping(mapping: number[], subgroup: Subgroup) {
  const result = subgroup.toPrimeMapping(mapping)

  while (result.length > DEFAULT_NUMBER_OF_COMPONENTS) {
    result.pop()
  }
  while (result.length < DEFAULT_NUMBER_OF_COMPONENTS) {
    result.push(PRIME_CENTS[result.length])
  }
  return result as number[]
}

export class Mapping {
  vector: number[]

  constructor(vector: number[]) {
    this.vector = vector
  }

  static fromVals(
    vals: (Val | number | string)[],
    numberOfComponents: number,
    subgroup: SubgroupValue,
    options?: TuningOptions
  ) {
    const temperament = Temperament.fromVals(vals, subgroup)
    return Mapping.fromTemperament(temperament, numberOfComponents, options)
  }

  static fromCommas(
    commaList: (Monzo | FractionValue)[],
    numberOfComponents: number,
    subgroup?: SubgroupValue,
    options?: TuningOptions
  ) {
    const temperament = Temperament.fromCommas(commaList, subgroup, true)
    return Mapping.fromTemperament(temperament, numberOfComponents, options)
  }

  static fromTemperament(
    temperament: Temperament,
    numberOfComponents: number,
    options?: TuningOptions
  ) {
    options = Object.assign({}, options || {})
    options.primeMapping = true
    options.units = 'cents'
    const mapping = temperament.getMapping(options)
    if (mapping.length > numberOfComponents) {
      throw new Error('Not enough components to represent mapping')
    }
    while (mapping.length < numberOfComponents) {
      mapping.push(PRIME_CENTS[mapping.length])
    }

    return new Mapping(mapping)
  }

  static fromWarts(wartToken: number | string, jipOrLimit: JipOrLimit, equaveCents?: number) {
    // XXX: There's something weird going on with how fromWarts gets transpiled
    let mapping: Val
    if (typeof jipOrLimit === 'number') {
      mapping = fromWarts(wartToken, jipOrLimit)
    } else {
      mapping = fromWarts(wartToken, jipOrLimit)
    }
    if (!mapping.length) {
      throw new Error('Failed to produce mapping')
    }
    if (equaveCents === undefined) {
      if (Array.isArray(jipOrLimit)) {
        equaveCents = jipOrLimit[0]
      } else {
        equaveCents = 1200
      }
    }
    const vector: number[] = []
    mapping.forEach((steps) => {
      vector.push((equaveCents! * steps) / mapping[0])
    })
    return new Mapping(vector)
  }

  get size() {
    return this.vector.length
  }

  pureOctaves() {
    const purifier = 1200 / this.vector[0]
    return new Mapping(this.vector.map((component) => component * purifier))
  }
}

function mosPatternsRank2(
  temperament: Temperament,
  maxSize?: number,
  maxLength?: number,
  options?: TuningOptions
) {
  const numPeriods = temperament.numPeriodsGenerators()[0]
  const [period, generator] = temperament.periodGenerators(options)
  return mosPatterns(generator / period, numPeriods, maxSize, maxLength)
}

export function mosPatternsRank2FromVals(
  vals: (Val | number | string)[],
  subgroup: SubgroupValue,
  maxSize?: number,
  maxLength?: number,
  options?: TuningOptions
) {
  const temperament = Temperament.fromVals(vals, subgroup)
  const rank = temperament.getRank()
  if (rank !== 2) {
    throw new Error(`Given vals define a rank ${rank} temperament. Need rank 2.`)
  }
  return mosPatternsRank2(temperament, maxSize, maxLength, options)
}

export function mosPatternsRank2FromCommas(
  commas: (Monzo | FractionValue)[],
  subgroup?: SubgroupValue,
  maxSize?: number,
  maxLength?: number,
  options?: TuningOptions
) {
  const temperament = Temperament.fromCommas(commas, subgroup, true)
  const rank = temperament.getRank()
  if (rank !== 2) {
    if (subgroup) {
      throw new Error(`Given commas and subgroup define a rank ${rank} temperament. Need rank 2.`)
    } else {
      throw new Error(
        `Given commas and inferred subgroup define a rank ${rank} temperament. Need rank 2.`
      )
    }
  }
  return mosPatternsRank2(temperament, maxSize, maxLength, options)
}

export type Rank2Params = {
  generator: number
  period: number
  numPeriods: number
}

function makeRank2(temperament: Temperament, size: number, options?: TuningOptions): Rank2Params {
  const numPeriods = temperament.numPeriodsGenerators()[0]
  if (size % numPeriods) {
    throw new Error(`Given size '${size}' isn't a multiple of ${numPeriods}`)
  }
  const segmentSize = size / numPeriods

  const [period, generator] = temperament.periodGenerators(options)
  const brightGenerator = toBrightGeneratorPerPeriod(generator / period, segmentSize) * period

  return { generator: brightGenerator, period, numPeriods }
}

export function makeRank2FromVals(
  vals: (Val | number | string)[],
  size: number,
  subgroup: SubgroupValue,
  options?: TuningOptions
) {
  const temperament = Temperament.fromVals(vals, subgroup)
  const rank = temperament.getRank()
  if (rank !== 2) {
    throw new Error(`Given vals define a rank ${rank} temperament. Need rank 2.`)
  }
  return makeRank2(temperament, size, options)
}

export function makeRank2FromCommas(
  commas: (Monzo | FractionValue)[],
  size: number,
  subgroup?: SubgroupValue,
  options?: TuningOptions
) {
  const temperament = Temperament.fromCommas(commas, subgroup, true)
  const rank = temperament.getRank()
  if (rank !== 2) {
    if (subgroup) {
      throw new Error(`Given commas and subgroup define a rank ${rank} temperament. Need rank 2.`)
    } else {
      throw new Error(
        `Given commas and inferred subgroup define a rank ${rank} temperament. Need rank 2.`
      )
    }
  }
  return makeRank2(temperament, size, options)
}
