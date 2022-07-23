import type Scale from "@/scale";

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
