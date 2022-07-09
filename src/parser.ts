import ExtendedMonzo from "@/monzo";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import { stringToFraction } from "@/utils";
import { Interval, type IntervalOptions } from "@/interval";
import { Fraction } from "xen-dev-utils";

export enum LINE_TYPE {
  CENTS = "cents",
  DECIMAL = "decimal",
  RATIO = "ratio",
  N_OF_EDO = "n of edo",
  FREQUENCY = "frequency", // TODO: Implement parsing #107
  GENERALIZED_N_OF_EDO = "generalized n of edo",
  MONZO = "monzo",
  COMPOSITE = "composite",
  INVALID = "invalid",
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
  return /^-?\d+\\-?\d+$/.test(input);
}

function isRatio(input: string) {
  // true, when the input has numbers at the beginning and the end, separated by a single slash
  // for example: 3/2
  return /^\d+\/\d+$/.test(input);
}

function isGeneralizedNOfEdo(input: string) {
  // true, when input looks like N-of-EDO followed by a fraction or a number in angle brackets
  // for example: 7\11<3/2>, -7\13<5>
  return /^-?\d+\\-?\d+<\d+(\/\d+)?>$/.test(input);
}

function isMonzo(input: string) {
  // true, when input has a square bracket followed by a comma/space separated list of numbers or fractions followed by and angle bracket
  return /^\[(-?\d+(\/-?\d+)?[\s,]*)*>$/.test(input);
}

function isNonComposite(input: string) {
  return (
    isCent(input) ||
    isCommaDecimal(input) ||
    isNOfEdo(input) ||
    isRatio(input) ||
    isGeneralizedNOfEdo(input) ||
    isMonzo(input)
  );
}

function isSubtractive(input: string) {
  let prefix: string | undefined;
  const parts = input.split("-");
  for (let i = 0; i < parts.length; ++i) {
    if (prefix === undefined) {
      prefix = parts[i];
    } else {
      prefix += "-" + parts[i];
    }
    if (isNonComposite(prefix.trim())) {
      prefix = undefined;
    }
  }
  return !prefix?.length;
}

function isComposite(input: string) {
  if (!input.includes("-") && !input.includes("+")) {
    return false;
  }
  const parts = input.split("+");
  for (let i = 0; i < parts.length; ++i) {
    const part = parts[i].trim();
    if (!isSubtractive(part)) {
      return false;
    }
  }
  return true;
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
  if (isGeneralizedNOfEdo(input)) {
    return LINE_TYPE.GENERALIZED_N_OF_EDO;
  }
  if (isMonzo(input)) {
    return LINE_TYPE.MONZO;
  }
  if (isComposite(input)) {
    return LINE_TYPE.COMPOSITE;
  }

  return LINE_TYPE.INVALID;
}

function parseCents(
  input: string,
  numberOfComponents: number,
  options?: IntervalOptions
) {
  const cents = parseFloat(input);
  if (isNaN(cents)) {
    throw new Error(`Failed to parse ${input} to cents`);
  }
  return new Interval(
    ExtendedMonzo.fromCents(cents, numberOfComponents),
    "cents",
    input,
    options
  );
}

function parseDecimal(
  input: string,
  numberOfComponents: number,
  options?: IntervalOptions
) {
  const value = parseFloat(input.replace(",", "."));
  if (isNaN(value)) {
    throw new Error(`Failed to parse ${input} to decimal`);
  }
  return new Interval(
    ExtendedMonzo.fromValue(value, numberOfComponents),
    "decimal",
    input,
    options
  );
}

function parseNOfEdo(
  input: string,
  numberOfComponents: number,
  options?: IntervalOptions
) {
  const fractionOfOctave = stringToFraction(input.replace("\\", "/"));
  const octave = new Fraction(2);
  return new Interval(
    ExtendedMonzo.fromEqualTemperament(
      fractionOfOctave,
      octave,
      numberOfComponents
    ),
    "equal temperament",
    input,
    options
  );
}

function parseGeneralizeNOfEdo(
  input: string,
  numberOfComponents: number,
  options?: IntervalOptions
) {
  const [nOfEdo, equavePart] = input.split("<");
  const fractionOfEquave = stringToFraction(nOfEdo.replace("\\", "/"));
  const equave = new Fraction(equavePart.slice(0, -1));
  return new Interval(
    ExtendedMonzo.fromEqualTemperament(
      fractionOfEquave,
      equave,
      numberOfComponents
    ),
    "equal temperament",
    input,
    options
  );
}

function parseMonzo(
  input: string,
  numberOfComponents: number,
  options?: IntervalOptions
) {
  const components: Fraction[] = [];
  input
    .slice(1, -1)
    .replace(/,/g, " ")
    .split(/\s/)
    .forEach((token) => {
      token = token.trim();
      if (token.length) {
        components.push(stringToFraction(token));
      }
    });
  if (components.length > numberOfComponents) {
    throw new Error("Not enough components to represent monzo");
  }
  while (components.length < numberOfComponents) {
    components.push(new Fraction(0));
  }
  return new Interval(new ExtendedMonzo(components), "monzo", input, options);
}

function parseSubtractive(
  input: string,
  numberOfComponents: number,
  options?: IntervalOptions
): [Interval, boolean] {
  let centCount = 0;
  let prefix: string | undefined;
  const parts = input.split("-");
  const results = [];
  for (let i = 0; i < parts.length; ++i) {
    if (prefix === undefined) {
      prefix = parts[i];
    } else {
      prefix += "-" + parts[i];
    }
    if (isNonComposite(prefix.trim())) {
      if (isCent(prefix.trim())) {
        centCount++;
      }
      results.push(parseLine(prefix.trim(), numberOfComponents, options));
      prefix = undefined;
    }
  }
  if (prefix?.length || !results.length) {
    throw new Error(`Failed to parse composite part ${input}`);
  }
  if (results.length === 1) {
    return [results[0], false];
  }
  return [
    results[0].sub(results.slice(1).reduce((a, b) => a.add(b))),
    results.length === 2 && centCount > 0,
  ];
}

function parseComposite(
  input: string,
  numberOfComponents: number,
  options?: IntervalOptions
) {
  const parts = input.split("+");
  // Special handling for cent offsets: Use name of the primary interval
  if (parts.length === 1) {
    const [result, hasOffset] = parseSubtractive(
      parts[0],
      numberOfComponents,
      options
    );
    if (hasOffset) {
      return result;
    }
  }
  if (
    parts.length === 2 &&
    (isCent(parts[0].trim()) || isCent(parts[1].trim()))
  ) {
    return parseLine(parts[0].trim()).add(parseLine(parts[1].trim()));
  }

  const result = parts
    .map((part) => parseSubtractive(part, numberOfComponents, options)[0])
    .reduce((a, b) => a.add(b));
  result.name = input;
  return result;
}

export function parseLine(
  input: string,
  numberOfComponents = DEFAULT_NUMBER_OF_COMPONENTS,
  options?: IntervalOptions
): Interval {
  switch (getLineType(input)) {
    case LINE_TYPE.CENTS:
      return parseCents(input, numberOfComponents, options);
    case LINE_TYPE.DECIMAL:
      return parseDecimal(input, numberOfComponents, options);
    case LINE_TYPE.N_OF_EDO:
      return parseNOfEdo(input, numberOfComponents, options);
    case LINE_TYPE.RATIO:
      return new Interval(
        ExtendedMonzo.fromFraction(new Fraction(input), numberOfComponents),
        "ratio",
        input,
        options
      );
    case LINE_TYPE.GENERALIZED_N_OF_EDO:
      return parseGeneralizeNOfEdo(input, numberOfComponents, options);
    case LINE_TYPE.MONZO:
      return parseMonzo(input, numberOfComponents, options);
    case LINE_TYPE.COMPOSITE:
      return parseComposite(input, numberOfComponents, options);
    default:
      throw new Error(`Failed to parse ${input}`);
  }
}
