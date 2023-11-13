import type { Scale } from "scale-workshop-core";
import { arraysEqual, mmod, valueToCents } from "xen-dev-utils";

const EPSILON = 1e-6;

// Absolute logarithmic error from the nearest harmonic measured in nats
function harmonicError(ratio: number) {
  return Math.abs(Math.log(ratio) - Math.log(Math.round(ratio)));
}

// Calculate a small correction that removes the bias
// in the movement of an otonal chord wheel.
function otonalCorrection(ratios: number[]) {
  let correction = 1;
  ratios.forEach((ratio) => {
    correction *= ratio / Math.round(ratio);
  });

  return Math.pow(correction, -1 / ratios.length);
}

// Calculate the best multiplier for a set of ratios that
// miminizes the perceived motion of an otonal chord wheel.
function otonalMultiplier(ratios: number[], maxMultiplier = 16) {
  let leastError = Infinity;
  let result = 1;
  for (let multiplier = 1; multiplier <= maxMultiplier; ++multiplier) {
    const candidate =
      multiplier * otonalCorrection(ratios.map((ratio) => ratio * multiplier));
    const balanced = ratios.map((ratio) => ratio * candidate);
    const error = balanced.map(harmonicError).reduce((a, b) => a + b);
    if (error + EPSILON < leastError) {
      leastError = error;
      result = candidate;
    }
  }
  return result;
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
    return NaN;
  }
  const ratios = frequencies.map((f) => f / frequencies[0]);
  const multiplier = otonalMultiplier(ratios, maxMultiplier);
  return frequencies[0] / multiplier;
}

// Absolute logarithmic error from the nearest subharmonic measured in nats
function subharmonicError(ratio: number) {
  return Math.abs(Math.log(ratio) + Math.log(Math.round(1 / ratio)));
}

// Calculate a small correction that removes the bias
// in the movement of an utonal chord wheel.
function utonalCorrection(ratios: number[]) {
  let correction = 1;
  ratios.forEach((ratio) => {
    correction *= ratio * Math.round(1 / ratio);
  });

  return Math.pow(correction, 1 / ratios.length);
}

// Calculate the best divisor for a set of ratios that
// miminizes the perceived motion of an utonal chord wheel.
export function utonalDivisor(ratios: number[], maxDivisor = 23) {
  let leastError = Infinity;
  let result = 1;
  for (let divisor = 1; divisor <= maxDivisor; ++divisor) {
    const candidate =
      divisor * utonalCorrection(ratios.map((ratio) => ratio / divisor));
    const balanced = ratios.map((ratio) => ratio / candidate);
    const error = balanced.map(subharmonicError).reduce((a, b) => a + b);
    if (error + EPSILON < leastError) {
      leastError = error;
      result = candidate;
    }
  }
  return result;
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
    return NaN;
  }
  const ratios = frequencies.map((f) => f / frequencies[0]);
  const divisor = utonalDivisor(ratios, maxDivisor);
  return divisor * frequencies[0];
}

// Interval matrix a.k.a the modes of a scale
export function intervalMatrix(scale: Scale) {
  const result = [];
  const degrees = [...Array(scale.size + 1).keys()];
  for (let i = 0; i < scale.size; ++i) {
    const mode = scale.rotate(i);
    result.push(degrees.map((j) => mode.getInterval(j)));
  }
  return result;
}

/**
 * Calculate the maximum deviation of a set of pitches from an equal grid in pitch-space.
 * @param pitches Array of pitches measured in cents.
 * @param gridCents The distance in cents between two grid lines of the equal division e.g. `100.0`.
 * @returns The maximum distance in cents from a grid "line" in the set.
 */
export function misalignment(pitches: number[], gridCents: number) {
  const gridPitches = pitches.map(
    (pitch) => Math.round(pitch / gridCents) * gridCents
  );
  let error = 0;
  for (let i = 0; i < pitches.length; ++i) {
    error = Math.max(error, Math.abs(pitches[i] - gridPitches[i]));
  }
  return error;
}

/**
 * Align a set of pitches on an equal division of pitch-space such that the maximum absolute error is minimized.
 * @param pitches An array of pitches measured in cents.
 * @param gridCents The distance in cents between two grid lines of the equal division e.g. `100.0`.
 * @returns The minimum misalignment achievable measured in cents and the pitches snapped to the grid.
 */
export function alignCents(pitches: number[], gridCents: number) {
  // The error function we're trying to optimize is piecewise linear.

  // Find the segment where the global optimum lies.
  let optimalPitches: number[];
  let minError = Infinity;
  for (let i = 0; i < pitches.length; ++i) {
    const aligned = pitches.map((pitch) => pitch - pitches[i]);
    const error = misalignment(aligned, gridCents);
    if (error < minError) {
      optimalPitches = aligned;
      minError = error;
    }
  }

  // Calculate the shape of the segment.
  const degrees = optimalPitches!.map((pitch) => Math.round(pitch / gridCents));
  let minOffset = Infinity;
  let maxOffset = -Infinity;
  let root = Infinity;
  for (let i = 0; i < degrees.length; ++i) {
    const offset = optimalPitches![i] - degrees[i] * gridCents;
    minOffset = Math.min(minOffset, offset);
    maxOffset = Math.max(maxOffset, offset);
    if (degrees[i] < root) {
      root = degrees[i];
    }
  }

  // Calculate minimum achievable absolute error.
  const error = 0.5 * Math.abs(minOffset) + 0.5 * Math.abs(maxOffset);
  // Move root to grid origin.
  for (let i = 0; i < degrees.length; ++i) {
    degrees[i] -= root;
  }
  return {
    error,
    degrees,
  };
}

/**
 * Align a set of ratios in frequency-space on an equal division of pitch-space such that the maximum absolute error is minimized.
 * @param ratios An array of frequency ratios.
 * @param gridCents The distance in cents between two grid lines of the equal division e.g. `100.0`.
 * @returns The minimum misalignment achievable measured in cents and the pitches snapped to the grid.
 */
export function alignValues(ratios: number[], gridCents: number) {
  return alignCents(ratios.map(valueToCents), gridCents);
}

function circleEqual(
  a: number,
  b: number,
  equaveCents: number,
  tolerance = EPSILON
) {
  return (
    Math.abs(mmod(a - b + equaveCents * 0.5, equaveCents) - equaveCents * 0.5) <
    tolerance
  );
}

export type Shell = {
  harmonics: number[];
  error: number;
  degrees: number[];
  scaleDegrees: Set<number>;
};

/**
 * Find the concordance shell centered around a root harmonic.
 * @param rootHarmonic Root harmonic.
 * @param maxHarmonic Maximum harmonic to consider for inclusion.
 * @param tolerance Maximum deviation in cents from the equal division of pitch-space.
 * @param division Number of equal divisions of the equave.
 * @param equave The size of the interval of equivalence in cents.
 * @returns An objects with
 *  harmonics of the shell as an array of integers,
 *  the harmonics snapped to the grid as an array of cents,
 *  the minimum achievable misalignment of the harmonics within the grid measured in cents.
 *  the shell as a reduced repeating scale of degrees (with only the zero endpoint included)
 */
export function concordanceShell(
  rootHarmonic: number,
  maxHarmonic: number,
  tolerance: number,
  divisions: number,
  equaveCents = 1200.0
): Shell {
  const gridCents = equaveCents / divisions;
  const harmonics = [rootHarmonic];
  const degrees = [0];
  const scaleDegrees = new Set([0]);
  const fingerprints = [0];
  let error = 0;
  search: for (
    let harmonic = rootHarmonic + 1;
    harmonic <= maxHarmonic;
    ++harmonic
  ) {
    const pitch = valueToCents(harmonic / rootHarmonic);
    const degree = Math.round(pitch / gridCents);
    const scaleDegree = mmod(degree, divisions);
    if (scaleDegrees.has(scaleDegree)) {
      for (const existing of fingerprints) {
        if (circleEqual(pitch, existing, equaveCents)) {
          continue search;
        }
      }
    }
    const deviation = Math.abs(pitch - degree * gridCents);
    if (deviation < tolerance) {
      harmonics.push(harmonic);
      degrees.push(degree);
      scaleDegrees.add(scaleDegree);
      fingerprints.push(pitch);
      error = Math.max(error, deviation);
    }
  }
  return {
    harmonics,
    error,
    degrees,
    scaleDegrees,
  };
}

function* subshells(shell: number[]) {
  if (shell.length <= 1) {
    return;
  }
  for (let i = 1; i < shell.length; ++i) {
    const subshell = [...shell];
    subshell.splice(i, 1);
    yield subshell;
  }
}

function subsetOf(a: number[], b: number[]) {
  for (const value of a) {
    if (!b.includes(value)) {
      return false;
    }
  }
  return true;
}

/**
 * Find concordance shells based on the given harmonic.
 * @param rootHarmonic Root harmonic.
 * @param maxHarmonic Maximum harmonic to consider for inclusion.
 * @param tolerance Maximum deviation in cents from the equal division of pitch-space.
 * @param division Number of equal divisions of the equave.
 * @param equave The size of the interval of equivalence in cents.
 * @param minSize Minimum size of the shell to search for.
 * @param maxShells Maximum number of shells to discover.
 * @returns An array of objects with
 *  harmonics of the shell as an array of integers,
 *  the harmonics snapped to the grid as an array of cents,
 *  the minimum achievable misalignment of the harmonics within the grid measured in cents.
 *  the shell as a reduced repeating scale of degrees (with only the zero endpoint included)
 */
export function minimaxConcordanceShells(
  rootHarmonic: number,
  maxHarmonic: number,
  tolerance: number,
  divisions: number,
  equaveCents = 1200.0,
  minSize = 3,
  maxShells = 100
): Shell[] {
  const gridCents = equaveCents / divisions;
  // Calculate the largest possible shell if everything aligns perfectly.
  const supershell = concordanceShell(
    rootHarmonic,
    maxHarmonic,
    2 * tolerance,
    divisions,
    equaveCents
  );

  if (supershell.harmonics.length < minSize) {
    return [];
  }

  const superAlignment = alignValues(supershell.harmonics, gridCents);
  // Not gonna happen, but let's pretend to be hopeful.
  if (superAlignment.error <= tolerance) {
    return [{ ...supershell, ...superAlignment }];
  }

  // Start breaking the super-shell into smaller and smaller sub-shells that fit within the tolerance.
  const result: Shell[] = [];
  const badShells = [supershell.harmonics];
  while (badShells.length) {
    const shell = badShells.shift()!; // Break bigger shells first.
    search: for (const subshell of subshells(shell)) {
      for (const existing of result) {
        if (subsetOf(subshell, existing.harmonics)) {
          continue search;
        }
      }
      for (const existing of badShells) {
        if (arraysEqual(existing, subshell)) {
          continue search;
        }
      }

      const alignment = alignValues(subshell, gridCents);
      if (alignment.error <= tolerance) {
        const scaleDegrees = new Set(
          alignment.degrees.map((degree) => mmod(degree, divisions))
        );
        result.push({
          harmonics: subshell,
          scaleDegrees,
          ...alignment,
        });
        if (result.length >= maxShells) {
          return result;
        }
      } else if (subshell.length > minSize) {
        badShells.push(subshell);
      }
    }
  }

  return result;
}
