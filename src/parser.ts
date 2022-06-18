import Fraction from "fraction.js";
import ExtendedMonzo from "@/monzo";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "./constants";

export enum LINE_TYPE {
  CENTS = "cents",
  DECIMAL = "decimal",
  RATIO = "ratio",
  N_OF_EDO = "n of edo",
  INVALID = "invalid",
  UNISON = "unison",
}

function isCent(input: string): boolean {
  // true, when the input has numbers at the beginning, followed by a dot, ending with any number of numbers
  // for example: 700.00, -700.00
  return /^-?\d+\.\d*$/.test(input.trim());
}

function isCommaDecimal(input: string): boolean {
  // true, when the input has numbers at the beginning, followed by a comma, ending with any number of numbers
  // for example: 1,25
  return /^\d+,\d*$/.test(input.trim());
}

function isNOfEdo(input: string) {
  // true, when the input has numbers at the beginning and the end, separated by a single backslash
  // for example: 7\12, -7\12
  return /^-?\d+\\\d+$/.test(input);
}

function isRatio(input: string) {
  // true, when the input has numbers at the beginning and the end, separated by a single slash
  // for example: 3/2
  return /^\d+\/\d+$/.test(input);
}

export function getLineType(input: string) {
  if (isCent(input)) {
    return LINE_TYPE.CENTS;
  }
  if (isCommaDecimal(input)) {
    return LINE_TYPE.DECIMAL;
  }
  if (isNOfEdo(input)) {
    return LINE_TYPE.N_OF_EDO;
  }
  if (isRatio(input)) {
    return LINE_TYPE.RATIO;
  }

  return LINE_TYPE.INVALID;
}

function parseCents(input: string, numberOfComponents: number): ExtendedMonzo {
  const cents = parseFloat(input);
  if (isNaN(cents)) {
    throw new Error(`Failed to parse ${input} to cents`);
  }
  return ExtendedMonzo.fromCents(cents, numberOfComponents);
}

function parseDecimal(
  input: string,
  numberOfComponents: number
): ExtendedMonzo {
  const value = parseFloat(input.replace(",", "."));
  if (isNaN(value)) {
    throw new Error(`Failed to parse ${input} to decimal`);
  }
  return ExtendedMonzo.fromValue(value, numberOfComponents);
}

function parseNOfEdo(input: string, numberOfComponents: number): ExtendedMonzo {
  const fractionOfOctave = new Fraction(input.replace("\\", "/"));
  const octave = new Fraction(2);
  return ExtendedMonzo.fromEqualTemperament(
    fractionOfOctave,
    octave,
    numberOfComponents
  );
}

export function parseLine(
  input: string,
  numberOfComponents = DEFAULT_NUMBER_OF_COMPONENTS
): ExtendedMonzo {
  switch (getLineType(input)) {
    case LINE_TYPE.CENTS:
      return parseCents(input, numberOfComponents);
    case LINE_TYPE.DECIMAL:
      return parseDecimal(input, numberOfComponents);
    case LINE_TYPE.N_OF_EDO:
      return parseNOfEdo(input, numberOfComponents);
    case LINE_TYPE.RATIO:
      return ExtendedMonzo.fromFraction(
        new Fraction(input),
        numberOfComponents
      );
    default:
      throw new Error(`Failed to parse ${input}`);
  }
}
