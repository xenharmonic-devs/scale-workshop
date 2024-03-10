import { describe, it, expect } from 'vitest'

import {
  makeRank2FromCommas,
  makeRank2FromVals,
  mosPatternsRank2FromCommas,
  mosPatternsRank2FromVals,
  toPrimeMapping
} from '../tempering'
import { arraysEqual, PRIME_CENTS, valueToCents } from 'xen-dev-utils'
import { Subgroup } from 'temperaments'
import { DEFAULT_NUMBER_OF_COMPONENTS } from '../constants'

describe('Prime map converter', () => {
  it('does (almost) nothing in 5-limit JI', () => {
    const fiveLimit = PRIME_CENTS.slice(0, 3)
    const mapping = toPrimeMapping(fiveLimit, new Subgroup(5))
    expect(mapping[0]).toBeCloseTo(fiveLimit[0])
    expect(mapping[1]).toBeCloseTo(fiveLimit[1])
    expect(mapping[2]).toBeCloseTo(fiveLimit[2])
    expect(mapping.length).toBe(DEFAULT_NUMBER_OF_COMPONENTS)
    expect(mapping[3]).toBeCloseTo(PRIME_CENTS[3])
  })

  it('converts a mapping in 2.3.13/5 to 2.3.5.7.11.13...', () => {
    const original = [1200, 1901, 1654]
    const mapping = toPrimeMapping(original, new Subgroup('2.3.13/5'))
    expect(mapping[0]).toBeCloseTo(1200)
    expect(mapping[1]).toBeCloseTo(1901)
    expect(mapping[3]).toBeCloseTo(PRIME_CENTS[3])
    expect(mapping[4]).toBeCloseTo(PRIME_CENTS[4])
    expect(mapping[5] - mapping[2]).toBeCloseTo(1654)
    expect(mapping[6]).toBeCloseTo(PRIME_CENTS[6])
  })
})

describe('Tempered scale generation', () => {
  it('generates CTE augmented from vals', () => {
    const vals = [3, 12]
    const limit = 5
    const options = {
      constraints: ['2/1']
    }
    const infos = mosPatternsRank2FromVals(vals, limit, undefined, 5, options)
    const sizes = infos.map((info) => info.numberOfLargeSteps + info.numberOfSmallSteps)
    expect(arraysEqual(sizes, [6, 9, 12, 15, 27])).toBeTruthy()

    const { generator, period, numPeriods } = makeRank2FromVals(vals, sizes[2], limit, options)
    expect(period).toBeCloseTo(400);
    expect(generator + period).toBeCloseTo(valueToCents(3 / 2));
    expect(numPeriods).toBe(3);
  })

  it('generates POTE meantone from a comma', () => {
    const commas = ['81/80']
    const infos = mosPatternsRank2FromCommas(commas, undefined, undefined, 5)
    const sizes = infos.map((info) => info.numberOfLargeSteps + info.numberOfSmallSteps)
    expect(arraysEqual(sizes, [2, 3, 5, 7, 12])).toBeTruthy()

    const { generator, period, numPeriods } = makeRank2FromCommas(commas, sizes[3])
    expect(generator).toBeCloseTo(696.239)
    expect(period).toBeCloseTo(1200)
    expect(numPeriods).toBe(1)
  })

  it('generates frostburn from a comma', () => {
    const commas = [[-5, 0, 7, -4, 0, 0, 0]]
    const infos = mosPatternsRank2FromCommas(commas, new Subgroup('2.5.7'), undefined, 6)
    const sizes = infos.map((info) => info.numberOfLargeSteps + info.numberOfSmallSteps)
    expect(sizes).toEqual([2, 3, 4, 5, 6, 11])
  })
})
