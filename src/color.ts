import Fraction from "fraction.js";
import ExtendedMonzo from "./monzo";

type Monzo = number[];
type Mapping = number[];

const PSEUDO_EDO_MAPPING = [7, 11, 16, 20, 24, 26, 29, 30, 32, 34, 37];

const UNICODE_EXPONENTS = {
  "⁰": 0,
  "¹": 1,
  "²": 2,
  "³": 3,
  "⁴": 4,
  "⁵": 5,
  "⁶": 6,
  "⁷": 7,
  "⁸": 8,
  "⁹": 9,

  "¹¹": 11,
  "¹³": 13,
  "¹⁷": 17,
  "¹⁹": 19,
  "²³": 23,
};

const REVERSE_UNICODE_EXPONENTS: { [k: string]: string } = { "-": "⁻" };
Object.entries(UNICODE_EXPONENTS).forEach((e) => {
  REVERSE_UNICODE_EXPONENTS[e[1].toString()] = e[0];
});

const LONG_EXPONENTS = {
  bi: "²",
  tri: "³",
  quad: "⁴",
  quin: "⁵",
  sep: "⁷",
  le: "¹¹",
  the: "¹³",
  se: "¹⁷",
  ne: "¹⁹",
  twethe: "²³",
};

const LONG_FORMS = {
  a: "",

  la: "L",
  sa: "s",

  wa: "w",

  yo: "y",
  gu: "g",

  zo: "z",
  ru: "r",

  lo: "1o",
  lu: "1u",
  ilo: "1o",
  ilu: "1u",

  tho: "3o",
  thu: "3u",

  so: "17o",
  su: "17u",
  iso: "17o",
  isu: "17u",

  no: "19o",
  nu: "19u",
  ino: "19o",
  inu: "19u",

  twetho: "23o",
  twethu: "23u",

  tweno: "29o",
  twenu: "29u",

  thiwo: "31o",
  thiwu: "31u",
};

const ABBREVIATIONS = {
  y: [2, 1],
  g: [2, -1],

  z: [3, 1],
  r: [3, -1],

  "1o": [4, 1],
  "1u": [4, -1],

  "3o": [5, 1],
  "3u": [5, -1],

  "17o": [6, 1],
  "17u": [6, -1],

  "19o": [7, 1],
  "19u": [7, -1],

  "23o": [8, 1],
  "23u": [8, -1],

  "29o": [9, 1],
  "29u": [9, -1],

  "31o": [10, 1],
  "31u": [10, -1],
};

function dot(monzo: Monzo, mapping: Mapping) {
  let result = 0;
  monzo.forEach((component, i) => {
    result += component * mapping[i];
  });
  return result;
}

function parseExponent(token: string): [string, number] {
  let num = 1;
  if (token.startsWith("^")) {
    num = parseInt(token[1]);
    token = token.slice(2);
  } else if (token[0] in UNICODE_EXPONENTS) {
    num = 0;
    while (token[0] in UNICODE_EXPONENTS) {
      num *= 10;
      num += UNICODE_EXPONENTS[token[0] as keyof typeof UNICODE_EXPONENTS];
      token = token.slice(1);
    }
  }
  return [token, num];
}

export class ColorInterval {
  stepspan: number;
  magnitude: number;
  offWhite: Monzo;
  poQu: number;

  constructor(stepspan: number, magnitude: number, offWhite: Monzo, poQu = 0) {
    this.stepspan = stepspan;
    this.magnitude = magnitude;
    this.offWhite = offWhite;
    this.poQu = poQu;
  }

  static canParse(token: string) {
    return /[Ls]*(([ygzr]|\d+[ou]+)((\^\d)|[⁰¹²³⁴⁵⁶⁷⁸⁹]+)*)+[pq]*-*\d+/.test(
      token
    );
  }

  static fromString(token: string) {
    const offWhite = PSEUDO_EDO_MAPPING.map(() => 0);
    let magnitude = 0;
    let exponent;
    while (token.startsWith("L")) {
      token = token.slice(1);
      [token, exponent] = parseExponent(token);
      magnitude += exponent;
    }
    while (token.startsWith("s")) {
      token = token.slice(1);
      [token, exponent] = parseExponent(token);
      magnitude -= exponent;
    }
    let done = false;
    do {
      done = true;
      for (const prefix in ABBREVIATIONS) {
        if (token.startsWith(prefix)) {
          token = token.slice(prefix.length);
          const [index, amount] =
            ABBREVIATIONS[prefix as keyof typeof ABBREVIATIONS];
          let total = amount;
          if (prefix.endsWith("o") || prefix.endsWith("u")) {
            while (prefix.endsWith(token[0])) {
              token = token.slice(1);
              total += amount;
            }
          }
          [token, exponent] = parseExponent(token);
          offWhite[index] += total * exponent;
          done = false;
        }
      }
    } while (!done);

    if (token.startsWith("w")) {
      token = token.slice(1);
    }
    let poQu = 0;
    while (token.startsWith("p")) {
      poQu += 1;
      token = token.slice(1);
    }
    while (token.startsWith("q")) {
      poQu -= 1;
      token = token.slice(1);
    }

    let stepspan = parseInt(token);
    stepspan -= Math.sign(stepspan);
    return new ColorInterval(stepspan, magnitude, offWhite, poQu);
  }

  toExtendedMonzo(numberOfComponents: number) {
    if (numberOfComponents < this.offWhite.length) {
      throw new Error(
        `Need at least ${this.offWhite.length} components to represent color intervals`
      );
    }
    const stepspan = this.stepspan - this.poQu;
    const spanPrime = dot(this.offWhite, PSEUDO_EDO_MAPPING);
    const magnitudePrime = Math.round(
      (2 * (stepspan - spanPrime) + this.offWhite.reduce((a, b) => a + b, 0)) /
        7
    );
    const a =
      -3 * (stepspan - spanPrime) - 11 * (this.magnitude - magnitudePrime);
    const b =
      2 * (stepspan - spanPrime) + 7 * (this.magnitude - magnitudePrime);

    const result = [...this.offWhite];
    result[0] = a;
    result[1] = b;
    while (result.length < numberOfComponents) {
      result.push(0);
    }
    return new ExtendedMonzo(
      result.map((component) => new Fraction(component))
    );
  }
}

export function parseColorComma(token: string, numberOfComponents: number) {
  token = token.toLowerCase().replace("-", "");
  let shortToken = "";
  let exponent;
  let modified = true;
  let fresh = false;
  while (modified) {
    fresh = false;
    modified = false;
    exponent = null;
    const exponents: string[] = [];
    let done = false;
    while (!done) {
      done = true;
      for (const name in LONG_EXPONENTS) {
        if (token.startsWith(name)) {
          exponents.push(LONG_EXPONENTS[name as keyof typeof LONG_EXPONENTS]);
          token = token.slice(name.length);
          done = false;
          break;
        }
      }
    }
    if (exponents.length) {
      fresh = true;
      let m = 1;
      exponents.forEach((exponent_) => {
        m *= UNICODE_EXPONENTS[exponent_ as keyof typeof UNICODE_EXPONENTS];
      });
      exponent = m
        .toString()
        .split("")
        .map((c) => REVERSE_UNICODE_EXPONENTS[c])
        .join("");
    }
    done = false;
    while (!done) {
      done = true;
      for (const longForm in LONG_FORMS) {
        if (token.startsWith(longForm)) {
          shortToken += LONG_FORMS[longForm as keyof typeof LONG_FORMS];
          token = token.slice(longForm.length);
          modified = true;
          if (longForm === "a") {
            done = true;
            break;
          }
          if (exponent !== null) {
            shortToken += exponent;
            done = false;
          }
          if (longForm === "sa" || longForm === "la") {
            done = true;
          }
          break;
        }
      }
    }
  }
  let ordinal = 1;
  if (fresh && exponent !== null) {
    ordinal = UNICODE_EXPONENTS[exponent as keyof typeof UNICODE_EXPONENTS];
  }

  token = shortToken + token;

  const segment: [number, ExtendedMonzo][] = [];
  let degree = -2;
  while (true) {
    const monzo = ColorInterval.fromString(
      token + degree.toString()
    ).toExtendedMonzo(numberOfComponents);
    const nats = monzo.totalNats();
    if (nats < 0) {
      break;
    }
    segment.push([nats, monzo]);
    degree--;
  }
  degree = 1;
  while (segment.length < 7) {
    const monzo = ColorInterval.fromString(
      token + degree.toString()
    ).toExtendedMonzo(numberOfComponents);
    const nats = monzo.totalNats();
    if (nats > 0) {
      segment.push([nats, monzo]);
    }
    degree++;
  }

  segment.sort((a, b) => a[0] - b[0]);
  return segment[ordinal - 1][1];
}
