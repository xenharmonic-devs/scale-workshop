import { describe, it, expect } from 'vitest'
import { arraysEqual } from 'xen-dev-utils'

import { otonalFundamental, utonalFundamental } from '../analysis'

describe('Otonal balancer', () => {
  it('can figure out that the major chord in 12edo approximates 4:5:6', () => {
    const frequencies = [2 ** 0, 2 ** (4 / 12), 2 ** (7 / 12)]
    const fundamental = otonalFundamental(frequencies)
    expect(
      arraysEqual(
        frequencies.map((f) => Math.round(f / fundamental)),
        [4, 5, 6]
      )
    ).toBeTruthy()
  })
})

describe('Utonal balancer', () => {
  it('can figure out that the minor chord in 12edo approximates 1/6:1/5:1/4', () => {
    const frequencies = [2 ** 0, 2 ** (3 / 12), 2 ** (7 / 12)]
    const fundamental = utonalFundamental(frequencies)
    expect(
      arraysEqual(
        frequencies.map((f) => 1 / Math.round(fundamental / f)),
        [1 / 6, 1 / 5, 1 / 4]
      )
    ).toBeTruthy()
  })
})
