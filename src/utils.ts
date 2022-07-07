import { computed, type ComputedRef } from "vue";
import { Fraction, gcd, mmod, PRIME_CENTS, valueToCents } from "xen-dev-utils";

export function isSafeFraction(fraction: Fraction) {
  return (
    fraction.n <= Number.MAX_SAFE_INTEGER &&
    fraction.d <= Number.MAX_SAFE_INTEGER
  );
}

export function fractionToString(
  fraction: Fraction,
  preferredNumerator?: number,
  preferredDenominator?: number
) {
  const numerator = fraction.n * fraction.s;
  if (preferredNumerator === undefined) {
    if (
      preferredDenominator === undefined ||
      fraction.d === preferredDenominator
    ) {
      return `${numerator}/${fraction.d}`;
    }
    if (preferredDenominator % fraction.d === 0) {
      const multiplier = preferredDenominator / fraction.d;
      return `${numerator * multiplier}/${fraction.d * multiplier}`;
    }
    return `${numerator}/${fraction.d}`;
  }
  if (fraction.n === preferredNumerator) {
    return `${numerator}/${fraction.d}`;
  }
  if (preferredNumerator % fraction.n === 0) {
    const multiplier = preferredNumerator / fraction.n;
    return `${numerator * multiplier}/${fraction.d * multiplier}`;
  }
  return `${numerator}/${fraction.d}`;
}

// Extra support for negative denominators
export function stringToFraction(input: string) {
  // eslint-disable-next-line prefer-const
  let [numerator, denominator, ...rest] = input.split("/");
  if (
    denominator !== undefined &&
    denominator.startsWith("-") &&
    !rest.length
  ) {
    denominator = denominator.slice(1);
    if (numerator.startsWith("-")) {
      numerator = numerator.slice(1);
    } else {
      numerator = "-" + numerator;
    }
    return new Fraction(`${numerator}/${denominator}`);
  }
  return new Fraction(input);
}

export function debounce(func: (...args: any[]) => void, timeout = 300) {
  let timer: number;
  return (...args: any[]) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      func(...args);
    }, timeout);
  };
}

const MIDI_NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

// Find MIDI note name from MIDI note number
export function midiNoteNumberToName(noteNumber: number) {
  const remainder = mmod(noteNumber, 12);
  const quotient = (noteNumber - remainder) / 12;
  return MIDI_NOTE_NAMES[remainder] + quotient.toString();
}

export function sanitizeFilename(input: string) {
  input = input.trim();
  if (!input.length) {
    return "untitled scale";
  }
  return input
    .replace(/[|&;$%@"<>()+,?]/g, "")
    .replace(/\//g, "_")
    .replace(/\\/g, "_");
}

export function formatExponential(x: number, fractionDigits = 3) {
  if (Math.abs(x) < 10000) {
    return x.toFixed(fractionDigits);
  }
  const e = Math.floor(Math.log10(Math.abs(x)));
  const f = 10 ** (fractionDigits - e);
  const d = 0.1 ** fractionDigits;
  return (d * Math.round(x * f)).toFixed(fractionDigits) + "e+" + e.toString();
}

export function formatHertz(frequency: number, fractionDigits = 3) {
  const magnitude = Math.abs(frequency);

  // Use regular formatting for magnitudes within human limits
  if (1 <= magnitude && magnitude < 100000) {
    return frequency.toFixed(fractionDigits) + "Hz";
  }

  // Submultiples
  if (magnitude < 1e-21) {
    return (frequency * 1e24).toFixed(fractionDigits) + "yHz";
  }
  if (magnitude < 1e-18) {
    return (frequency * 1e21).toFixed(fractionDigits) + "zHz";
  }
  if (magnitude < 1e-15) {
    return (frequency * 1e18).toFixed(fractionDigits) + "aHz";
  }
  if (magnitude < 1e-12) {
    return (frequency * 1e15).toFixed(fractionDigits) + "fHz";
  }
  if (magnitude < 1e-9) {
    return (frequency * 1e12).toFixed(fractionDigits) + "pHz";
  }
  if (magnitude < 1e-6) {
    return (frequency * 1e9).toFixed(fractionDigits) + "nHz";
  }
  if (magnitude < 1e-3) {
    return (frequency * 1e6).toFixed(fractionDigits) + "µHz";
  }
  if (magnitude < 1) {
    return (frequency * 1e3).toFixed(fractionDigits) + "mHz";
  }

  // Too large. Use scientific notation.
  if (magnitude > 1e28) {
    return formatExponential(frequency) + "Hz";
  }

  // Multiples
  if (magnitude > 1e24) {
    return (frequency * 1e-24).toFixed(fractionDigits) + "YHz";
  }
  if (magnitude > 1e21) {
    return (frequency * 1e-21).toFixed(fractionDigits) + "ZHz";
  }
  if (magnitude > 1e18) {
    return (frequency * 1e-18).toFixed(fractionDigits) + "EHz";
  }
  if (magnitude > 1e15) {
    return (frequency * 1e-15).toFixed(fractionDigits) + "PHz";
  }
  if (magnitude > 1e12) {
    return (frequency * 1e-12).toFixed(fractionDigits) + "THz";
  }
  if (magnitude > 1e9) {
    return (frequency * 1e-9).toFixed(fractionDigits) + "GHz";
  }
  if (magnitude > 1e6) {
    return (frequency * 1e-6).toFixed(fractionDigits) + "MHz";
  }
  return (frequency * 1e-3).toFixed(fractionDigits) + "kHz";
}

export function autoKeyColors(size: number) {
  if (size < 2) {
    return ["white"];
  }
  if (size === 3) {
    return ["white", "black", "white"];
  }
  if (size === 5) {
    return ["white", "black", "white", "black", "white"];
  }
  if (size === 6) {
    return ["white", "black", "white", "black", "white", "black"];
  }

  let generator = Math.round(Math.log2(4 / 3) * size);
  while (gcd(generator, size) > 1) {
    generator--;
  }

  const result: string[] = Array(size).fill("black");
  let index = mmod(-2 * generator, size);
  let hasBlackClusters = true;
  do {
    result[index] = "white";
    hasBlackClusters = false;
    for (let i = 0; i < size - 1; ++i) {
      if (result[i] === "black" && result[i + 1] === "black") {
        hasBlackClusters = true;
        break;
      }
    }
    index = mmod(index + generator, size);
  } while (hasBlackClusters);

  return result;
}

// Wrapper for a computed property that can fail.
// The error string is non-empty when the property fails to compute.
export function computedAndError<T>(
  getter: () => T,
  defaultValue: T
): [ComputedRef<T>, ComputedRef<string>] {
  const valueAndError = computed<[T, string]>(() => {
    try {
      return [getter(), ""];
    } catch (error) {
      if (error instanceof Error) {
        return [defaultValue, error.message || " "];
      }
      return [defaultValue, "" + error || " "];
    }
  });
  const value = computed(() => valueAndError.value[0]);
  const error = computed(() => valueAndError.value[1]);
  return [value, error];
}

// Cache of odd limit fractions. Expanded as necessary.
const ODD_FRACTIONS = [new Fraction(1), new Fraction(1, 3), new Fraction(3)];
const ODD_CENTS = [0, -PRIME_CENTS[1], PRIME_CENTS[1]];
const ODD_BREAKPOINTS = [1, 3];
const TWO = new Fraction(2);

/**
 * Approximate a musical interval by a ratio of which neither the numerator or denominator
 * exceeds a specified limit, once all powers of 2 are removed.
 * @param cents Size of the musical interval measured in cents.
 * @param limit Maximum odd limit.
 * @returns The closest fraction to the given intervals within the odd limit.
 */
export function approximateOddLimit(cents: number, limit: number) {
  const breakpointIndex = (limit - 1) / 2;
  // Expand cache.
  while (ODD_BREAKPOINTS.length <= breakpointIndex) {
    const newLimit = ODD_BREAKPOINTS.length * 2 + 1;
    for (let numerator = 1; numerator <= newLimit; numerator += 2) {
      for (let denominator = 1; denominator <= newLimit; denominator += 2) {
        const fraction = new Fraction(numerator, denominator);
        let novel = true;
        for (let i = 0; i < ODD_FRACTIONS.length; ++i) {
          if (fraction.equals(ODD_FRACTIONS[i])) {
            novel = false;
            break;
          }
        }
        if (novel) {
          ODD_FRACTIONS.push(fraction);
          ODD_CENTS.push(valueToCents(fraction.valueOf()));
        }
      }
    }
    ODD_BREAKPOINTS.push(ODD_FRACTIONS.length);
  }

  // Find closest odd limit fraction modulo octaves.
  let leastError = Infinity;
  let result = new Fraction(1);
  for (let i = 0; i < ODD_BREAKPOINTS[breakpointIndex]; ++i) {
    const oddCents = ODD_CENTS[i];
    const remainder = mmod(cents - oddCents, 1200);
    // Overshot
    if (remainder < leastError) {
      // Rounding done to eliminate floating point jitter.
      const exponent = Math.round((cents - oddCents - remainder) / 1200);
      leastError = remainder;
      // Exponentiate to add the required number of octaves.
      result = ODD_FRACTIONS[i].mul(TWO.pow(exponent));
    }
    // Undershot
    if (1200 - remainder < leastError) {
      const exponent = Math.round((cents - oddCents - remainder) / 1200) + 1;
      leastError = 1200 - remainder;
      result = ODD_FRACTIONS[i].mul(TWO.pow(exponent));
    }
  }
  return result;
}
