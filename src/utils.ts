import type Fraction from "fraction.js";

export function arraysEqual(a: any[], b: any[]) {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

// Stolen from fraction.js, because it's not exported.
export function gcd(a: number, b: number): number {
  if (!a) return b;
  if (!b) return a;
  while (true) {
    a %= b;
    if (!a) return b;
    b %= a;
    if (!b) return a;
  }
}

export function lcm(a: number, b: number): number {
  return (Math.abs(a) / gcd(a, b)) * Math.abs(b);
}

export function mmod(a: number, b: number) {
  return ((a % b) + b) % b;
}

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
  const sign = fraction.s < 0 ? "-" : "";
  if (preferredNumerator === undefined) {
    if (
      preferredDenominator === undefined ||
      fraction.d === preferredDenominator
    ) {
      return `${sign}${fraction.n}/${fraction.d}`;
    }
    if (preferredDenominator % fraction.d === 0) {
      const multiplier = preferredDenominator / fraction.d;
      return `${sign}${fraction.n * multiplier}/${fraction.d * multiplier}`;
    }
    return `${sign}${fraction.n}/${fraction.d}`;
  }
  if (fraction.n === preferredNumerator) {
    return `${sign}${fraction.n}/${fraction.d}`;
  }
  if (preferredNumerator % fraction.n === 0) {
    const multiplier = preferredNumerator / fraction.n;
    return `${sign}${fraction.n * multiplier}/${fraction.d * multiplier}`;
  }
  return `${sign}${fraction.n}/${fraction.d}`;
}

export function centsToNats(cents: number) {
  return (cents / 1200) * Math.LN2;
}

export function natsToCents(nats: number) {
  return (nats / Math.LN2) * 1200;
}

export function debounce(func: (...args: any[]) => void, timeout = 300) {
  let timer: number;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, timeout);
  };
}

export function valueToCents(value: number) {
  return (Math.log(value) / Math.LN2) * 1200;
}

export function mtof(index: number) {
  return 440 * Math.pow(2, (index - 69) / 12);
}

export function ratioToCents(ratio: number) {
  return 1200 * Math.log2(ratio);
}

export function frequencyToCentOffset(frequency: number) {
  return ratioToCents(frequency / 440);
}

const MIDI_NOTE_NUMBER_OF_A4 = 69;
// convert a frequency to a midi note number and cents offset
// assuming 12-edo at 440Hz
// returns an array [midiNoteNumber, centsOffset]
export function ftom(frequency: number) {
  const semitones = MIDI_NOTE_NUMBER_OF_A4 + 12 * Math.log2(frequency / 440);
  const midiNoteNumber = Math.round(semitones);
  const centsOffset = (semitones - midiNoteNumber) * 100;
  return [midiNoteNumber, centsOffset];
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

export function clamp(minValue: number, maxValue: number, value: number) {
  if (value < minValue) {
    return minValue;
  }
  if (value > maxValue) {
    return maxValue;
  }
  return value;
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

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#implementing_basic_set_operations
export function setUnion<T>(...args: Set<T>[]): Set<T> {
  if (!args.length) {
    return new Set();
  }
  const union = new Set(args[0]);
  args.slice(1).forEach((arg) => {
    for (const element of arg) {
      union.add(element);
    }
  });
  return union;
}
