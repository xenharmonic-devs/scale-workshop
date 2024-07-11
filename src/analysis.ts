import { Interval, TimeMonzo, TimeReal, type IntervalDomain } from 'sonic-weave'
import { circleDistance, mmod, valueToCents } from 'xen-dev-utils'

const EPSILON = 1e-6

// Absolute logarithmic error from the nearest harmonic measured in nats
function harmonicError(ratio: number) {
  return Math.abs(Math.log(ratio) - Math.log(Math.round(ratio)))
}

// Calculate a small correction that removes the bias
// in the movement of an otonal chord wheel.
function otonalCorrection(ratios: number[]) {
  let correction = 1
  ratios.forEach((ratio) => {
    correction *= ratio / Math.round(ratio)
  })

  return Math.pow(correction, -1 / ratios.length)
}

// Calculate the best multiplier for a set of ratios that
// miminizes the perceived motion of an otonal chord wheel.
function otonalMultiplier(ratios: number[], maxMultiplier = 16) {
  let leastError = Infinity
  let result = 1
  for (let multiplier = 1; multiplier <= maxMultiplier; ++multiplier) {
    const candidate = multiplier * otonalCorrection(ratios.map((ratio) => ratio * multiplier))
    const balanced = ratios.map((ratio) => ratio * candidate)
    const error = balanced.map(harmonicError).reduce((a, b) => a + b)
    if (error + EPSILON < leastError) {
      leastError = error
      result = candidate
    }
  }
  return result
}

/**
 * Calculate the fundamental frequency implied by an array of frequencies
 * interpreted as an enumerated otonal chord.
 * @param frequencies Array of frequencies in the chord with the root first.
 * @param maxMultiplier Maximum interpretation of the root as an integer in an enumerated chord.
 * @returns The fundamental frequency below the root that minimizes the perceived motion of an otonal chord wheel.
 */
export function otonalFundamental(frequencies: number[], maxMultiplier = 16) {
  if (!frequencies.length) {
    return NaN
  }
  const ratios = frequencies.map((f) => f / frequencies[0])
  const multiplier = otonalMultiplier(ratios, maxMultiplier)
  return frequencies[0] / multiplier
}

// Absolute logarithmic error from the nearest subharmonic measured in nats
function subharmonicError(ratio: number) {
  return Math.abs(Math.log(ratio) + Math.log(Math.round(1 / ratio)))
}

// Calculate a small correction that removes the bias
// in the movement of an utonal chord wheel.
function utonalCorrection(ratios: number[]) {
  let correction = 1
  ratios.forEach((ratio) => {
    correction *= ratio * Math.round(1 / ratio)
  })

  return Math.pow(correction, 1 / ratios.length)
}

// Calculate the best divisor for a set of ratios that
// miminizes the perceived motion of an utonal chord wheel.
export function utonalDivisor(ratios: number[], maxDivisor = 23) {
  let leastError = Infinity
  let result = 1
  for (let divisor = 1; divisor <= maxDivisor; ++divisor) {
    const candidate = divisor * utonalCorrection(ratios.map((ratio) => ratio / divisor))
    const balanced = ratios.map((ratio) => ratio / candidate)
    const error = balanced.map(subharmonicError).reduce((a, b) => a + b)
    if (error + EPSILON < leastError) {
      leastError = error
      result = candidate
    }
  }
  return result
}

/**
 * Calculate the (high) fundamental frequency implied by an array of frequencies
 * interpreted as an enumerated utonal (inverted) chord.
 * @param frequencies Array of frequencies in the chord with the root first.
 * @param maxDivisor Maximum interpretation of the root as an integer in an enumerated chord.
 * @returns The fundamental frequency above the root that minimizes the perceived motion of an utonal chord wheel.
 */
export function utonalFundamental(frequencies: number[], maxDivisor = 23) {
  if (!frequencies.length) {
    return NaN
  }
  const ratios = frequencies.map((f) => f / frequencies[0])
  const divisor = utonalDivisor(ratios, maxDivisor)
  return divisor * frequencies[0]
}

/**
 * Calculate the maximum deviation of a set of pitches from an equal grid in pitch-space.
 * @param pitches Array of pitches measured in cents.
 * @param gridCents The distance in cents between two grid lines of the equal division e.g. `100.0`.
 * @returns The maximum distance in cents from a grid "line" in the set.
 */
export function misalignment(pitches: number[], gridCents: number) {
  const gridPitches = pitches.map((pitch) => Math.round(pitch / gridCents) * gridCents)
  let error = 0
  for (let i = 0; i < pitches.length; ++i) {
    error = Math.max(error, Math.abs(pitches[i] - gridPitches[i]))
  }
  return error
}

/**
 * Align a set of pitches on an equal division of pitch-space such that the maximum absolute error is minimized.
 * @param pitches An array of pitches measured in cents.
 * @param gridCents The distance in cents between two grid lines of the equal division e.g. `100.0`.
 * @returns The minimum misalignment achievable measured in cents and the pitches snapped to the grid.
 */
export function alignCents(pitches: number[], gridCents: number) {
  // The error function we're trying to optimize is piecewise linear.

  if (!pitches.length) {
    return {
      error: 0,
      degrees: []
    }
  }

  // Find the segment where the global optimum lies.
  let optimalPitches: number[]
  let minError = Infinity
  for (let i = 0; i < pitches.length; ++i) {
    const aligned = pitches.map((pitch) => pitch - pitches[i])
    const error = misalignment(aligned, gridCents)
    if (error < minError) {
      optimalPitches = aligned
      minError = error
    }
  }

  // Calculate the shape of the segment.
  const degrees = optimalPitches!.map((pitch) => Math.round(pitch / gridCents))
  let minOffset = Infinity
  let maxOffset = -Infinity
  let root = Infinity
  for (let i = 0; i < degrees.length; ++i) {
    const offset = optimalPitches![i] - degrees[i] * gridCents
    minOffset = Math.min(minOffset, offset)
    maxOffset = Math.max(maxOffset, offset)
    if (degrees[i] < root) {
      root = degrees[i]
    }
  }

  // Calculate minimum achievable absolute error.
  const error = 0.5 * Math.abs(minOffset) + 0.5 * Math.abs(maxOffset)
  // Move root to grid origin.
  for (let i = 0; i < degrees.length; ++i) {
    degrees[i] -= root
  }
  return {
    error,
    degrees
  }
}

/**
 * Align a set of ratios in frequency-space on an equal division of pitch-space such that the maximum absolute error is minimized.
 * @param ratios An array of frequency ratios.
 * @param gridCents The distance in cents between two grid lines of the equal division e.g. `100.0`.
 * @returns The minimum misalignment achievable measured in cents and the pitches snapped to the grid.
 */
export function alignValues(ratios: number[], gridCents: number) {
  return alignCents(ratios.map(valueToCents), gridCents)
}

/**
 * Find an equally tempered chord that best approximates the given frequencies with the root of the chord fixed to a grid line.
 * @param frequencies Array of frequencies in the chord with the root first.
 * @param maxDivisions Maximum divisions of the equave.
 * @param equaveCents The size of the equave measured in cents.
 * @returns The minimum achievable error. The number of divisions of the given equave. The degrees of the chord.
 */
export function rootedEquallyTemperedChord(
  frequencies: number[],
  maxDivisions: number,
  equaveCents = 1200
) {
  const root = valueToCents(Math.abs(frequencies[0]))
  const pitches = frequencies.map((f) => valueToCents(Math.abs(f)) - root)
  let bestError = Infinity
  let bestDivisions = maxDivisions
  for (let divisions = 1; divisions <= maxDivisions; ++divisions) {
    const error = misalignment(pitches, equaveCents / divisions)
    if (error + EPSILON < bestError) {
      bestError = error
      bestDivisions = divisions
    }
  }
  const gridCents = equaveCents / bestDivisions
  const degrees = pitches.map((pitch) => Math.round(pitch / gridCents))
  return {
    error: bestError,
    divisions: bestDivisions,
    degrees
  }
}

/**
 * Find an equally tempered chord that best approximates the given frequencies with the root free to move.
 * @param frequencies Array of frequencies in the chord with the root first.
 * @param maxDivisions Maximum divisions of the equave.
 * @param equaveCents The size of the equave measured in cents.
 * @returns The minimum achievable error. The number of divisions of the given equave. The degrees of the chord.
 */
export function freeEquallyTemperedChord(
  frequencies: number[],
  maxDivisions: number,
  equaveCents = 1200
) {
  const root = valueToCents(Math.abs(frequencies[0]))
  const pitches = frequencies.map((f) => valueToCents(Math.abs(f)) - root)
  let bestError = Infinity
  let bestDivisions = maxDivisions
  let bestDegrees: number[] = []
  for (let divisions = 1; divisions <= maxDivisions; ++divisions) {
    const { error, degrees } = alignCents(pitches, equaveCents / divisions)
    if (error + EPSILON < bestError) {
      bestError = error
      bestDivisions = divisions
      bestDegrees = degrees
    }
  }
  return {
    error: bestError,
    divisions: bestDivisions,
    degrees: bestDegrees
  }
}

export type Shell = {
  harmonics: number[]
  degrees: number[]
}

/**
 * Fast variant of sonic-weave's vertically aligned object returning an array of harmonics.
 */
export function vao(
  denominator: number,
  maxNumerator: number,
  divisions: number,
  tolerance: number,
  equaveCents: number
) {
  const gridCents = equaveCents / divisions
  const witnesses: number[] = []
  const denominatorCents = valueToCents(denominator)
  const harmonics = []
  const degrees = []
  search: for (let numerator = denominator; numerator < maxNumerator; ++numerator) {
    const cents = valueToCents(numerator) - denominatorCents
    const degree = Math.round(cents / gridCents)
    if (Math.abs(cents - degree * gridCents) > tolerance) {
      continue
    }
    for (const existing of witnesses) {
      if (circleDistance(cents, existing, equaveCents) < EPSILON) {
        continue search
      }
    }
    witnesses.push(cents)
    harmonics.push(numerator)
    degrees.push(degree)
  }
  return {
    harmonics,
    degrees
  }
}

function subsetOf(a: number[], b: number[]) {
  for (const value of a) {
    if (!b.includes(value)) {
      return false
    }
  }
  return true
}

/**
 * Vertically aligned objects that are free to offset the root to stay withing the given tolerance.
 */
export function freeVAOs(
  denominator: number,
  maxNumerator: number,
  divisions: number,
  tolerance: number,
  equaveCents: number,
  minSize = 5,
  maxShells = 20,
  gas = 10000
): Shell[] {
  const gridCents = equaveCents / divisions

  // Generate the largest possible object.
  const superShell = vao(denominator, maxNumerator, divisions, 2 * tolerance, equaveCents).harmonics

  const root = superShell.shift()!
  const result: Shell[] = []
  function accumulate(harmonics: number[], remaining: number[], degrees: number[]) {
    if (harmonics.length + remaining.length < minSize) {
      return
    }
    if (result.length >= maxShells) {
      return
    }
    let grew = false
    while (remaining.length) {
      if (gas-- < 0) {
        return
      }
      const candidate = [...harmonics]
      candidate.push(remaining.pop()!)
      const { error, degrees } = alignValues(candidate, gridCents)
      if (error <= tolerance) {
        grew = true
        accumulate(candidate, [...remaining], degrees)
      }
    }
    if (!grew) {
      for (const existing of result) {
        if (subsetOf(harmonics, existing.harmonics)) {
          return
        }
      }
      result.push({
        harmonics,
        degrees
      })
    }
  }
  superShell.reverse()
  accumulate([root], superShell, [0])
  result.sort((a, b) => b.harmonics.length - a.harmonics.length)

  if (!result.length) {
    // Out of gas or something. Bail out.
    return [vao(denominator, maxNumerator, divisions, tolerance, equaveCents)]
  }

  return result
}

// There's no perfect solution here, but I guess this is somewhat reasonable.
function mixedFormat(value: TimeMonzo | TimeReal): Interval {
  let domain: IntervalDomain = 'logarithmic'
  let label = ''
  if (value.isFractional()) {
    domain = 'linear'
  } else {
    label = value.totalCents().toFixed(1)
  }
  const interval = new Interval(value, domain)
  interval.label = label
  return interval
}

// Interval matrix a.k.a the modes of a scale
export function intervalMatrix(intervals: Interval[]) {
  intervals = intervals.map((i) => i.shallowClone())
  // Simplify by removing formatting.
  for (let i = 0; i < intervals.length; ++i) {
    intervals[i].node = undefined
    intervals[i].color = undefined
    intervals[i].label = ''
  }
  const equave = mixedFormat(intervals[intervals.length - 1].value)
  const unison = mixedFormat(equave.value.div(equave.value))
  const result = [[unison, ...intervals.map((i) => mixedFormat(i.value))]]
  for (let i = 0; i < intervals.length - 1; ++i) {
    const root = intervals[i].value
    const row = []
    for (let j = 0; j < intervals.length; ++j) {
      let value = intervals[j].value.div(root)
      if (j < i) {
        value = value.mul(equave.value)
      }
      row[mmod(j - i, intervals.length)] = mixedFormat(value)
    }
    row.push(equave)
    result.push(row)
  }
  return result
}

export function constantStructureViolations(matrix: Interval[][]) {
  const result: boolean[][] = []
  for (let i = 0; i < matrix.length; ++i) {
    result.push(Array(matrix[i].length).fill(false))
  }
  for (let i = 0; i < matrix[0].length; ++i) {
    for (let j = 0; j < matrix.length; ++j) {
      if (result[j][i]) {
        continue
      }
      const value = matrix[j][i].value
      for (let k = i + 1; k < matrix[0].length; ++k) {
        for (let l = 0; l < matrix.length; ++l) {
          if (matrix[l][k].value.strictEquals(value)) {
            result[j][i] = true
            result[l][k] = true
          }
        }
      }
    }
  }
  return result
}

/**
 * Compute a matrix of constant structure violations up to a margin.
 * @param centsMatrix Interval matrix converted to cents.
 * @param margin Margin of violation in cents.
 * @returns Boolean array of CS violations within the given margin.
 */
export function marginViolations(centsMatrix: number[][], margin: number) {
  const result: boolean[][] = []
  for (let i = 0; i < centsMatrix.length; ++i) {
    result.push(Array(centsMatrix[i].length).fill(false))
  }
  for (let i = 0; i < centsMatrix[0].length; ++i) {
    for (let j = 0; j < centsMatrix.length; ++j) {
      if (result[j][i]) {
        continue
      }
      const cents = centsMatrix[j][i]
      for (let k = i + 1; k < centsMatrix[0].length; ++k) {
        for (let l = 0; l < centsMatrix.length; ++l) {
          if (Math.abs(centsMatrix[l][k] - cents) < margin) {
            result[j][i] = true
            result[l][k] = true
          }
        }
      }
    }
  }
  return result
}

export function varietySignature(matrix: Interval[][]) {
  const result: number[] = []
  if (!matrix.length) {
    return result
  }
  for (let i = 0; i < matrix[0].length; ++i) {
    const variants: (TimeMonzo | TimeReal)[] = [matrix[0][i].value]
    search: for (let j = 1; j < matrix.length; ++j) {
      const monzo = matrix[j][i].value
      for (const variant of variants) {
        if (variant.strictEquals(monzo)) {
          continue search
        }
      }
      variants.push(monzo)
    }
    result.push(variants.length)
  }
  return result
}

export function brightnessSignature(centsMatrix: number[][]) {
  const totals = centsMatrix.map((row) => row.reduce((prev, cur) => prev + cur, 0))
  const minimum = Math.min(...totals)
  const maximum = Math.max(...totals)
  if (minimum === maximum) {
    return Array(centsMatrix.length).fill(1)
  }
  const normalizer = 1 / (maximum - minimum)
  return totals.map((t) => (t - minimum) * normalizer)
}
