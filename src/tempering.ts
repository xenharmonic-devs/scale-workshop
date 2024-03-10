import { mosPatterns, toBrightGeneratorPerPeriod } from 'moment-of-symmetry'
import {
  type Val,
  type SubgroupValue,
  Temperament,
  type TuningOptions,
  Subgroup,
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
