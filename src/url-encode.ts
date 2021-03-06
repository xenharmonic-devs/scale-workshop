import type { LocationQuery } from "vue-router";
import { ASDF_ROW, DIGIT_ROW, QWERTY_ROW, ZXCV_ROW } from "./keyboard-mapping";

// URL friendly versions of special characters
const NEWLINE = "_";
const FRACTION = "F";
const COMMA = "C";
const BACKSLASH = "B";
const SPACE = "S";
const LEFT_ANGLE_BRACKET = "L";
const RIGHT_ANGLE_BRACKET = "R";
const LEFT_SQUARE_BRACKET = "Q";
const PLUS = "P";

const FRACTION_RE = new RegExp(FRACTION, "g");
const COMMA_RE = new RegExp(COMMA, "g");
const BACKSLASH_RE = new RegExp(BACKSLASH, "g");
const SPACE_RE = new RegExp(SPACE, "g");
const LEFT_ANGLE_BRACKET_RE = new RegExp(LEFT_ANGLE_BRACKET, "g");
const RIGHT_ANGLE_BRACKET_RE = new RegExp(RIGHT_ANGLE_BRACKET, "g");
const LEFT_SQUARE_BRACKET_RE = new RegExp(LEFT_SQUARE_BRACKET, "g");
const PLUS_RE = new RegExp(PLUS, "g");

// Color shorhands
const BLACK = "-";
const WHITE = "~";
const SEPARATOR = "_";

function isDigit(character: string) {
  return /\d/.test(character);
}

function isBase36Digit(character: string) {
  return isDigit(character) || /[a-z]/.test(character);
}

function encodeDigits(digits: string, keepZero: boolean) {
  if (!digits.length) {
    return "";
  }
  let result = "";
  const num = parseInt(digits);
  if (num || keepZero) {
    [...digits].every((leadingZero) => {
      if (leadingZero === "0") {
        result += "0";
        return true;
      } else {
        return false;
      }
    });
    if (num) {
      return result + num.toString(36);
    } else {
      return result;
    }
  }
  return "";
}

function decodeDigits(digits: string) {
  if (!digits.length) {
    return "";
  }
  let result = "";
  const num = parseInt(digits, 36);
  [...digits].every((leadingZero) => {
    if (leadingZero === "0") {
      result += "0";
      return true;
    } else {
      return false;
    }
  });
  if (num) {
    return result + num.toString();
  } else {
    return result;
  }
}

function encodeLine(scaleLine: string) {
  scaleLine = scaleLine
    .replace(/\//g, FRACTION)
    .replace(/,/g, COMMA)
    .replace(/\\/g, BACKSLASH)
    .replace(/ /g, SPACE)
    .replace(/</g, LEFT_ANGLE_BRACKET)
    .replace(/>/g, RIGHT_ANGLE_BRACKET)
    .replace(/\[/g, LEFT_SQUARE_BRACKET)
    .replace(/\+/g, PLUS);
  let lastNondigit = "";
  let result = "";
  let currentNumber = "";

  [...scaleLine].forEach((character) => {
    if (isDigit(character)) {
      currentNumber += character;
    } else {
      result += encodeDigits(currentNumber, !".,".includes(lastNondigit));
      currentNumber = "";
      lastNondigit = character;
      result += character;
    }
  });
  return result + encodeDigits(currentNumber, !".,".includes(lastNondigit));
}

function decodeLine(encoded: string) {
  let result = "";
  let currentNumber = "";
  [...encoded].forEach((character) => {
    if (isBase36Digit(character)) {
      currentNumber += character;
    } else {
      result += decodeDigits(currentNumber);
      currentNumber = "";
      result += character;
    }
  });
  result += decodeDigits(currentNumber);

  return result
    .replace(FRACTION_RE, "/")
    .replace(COMMA_RE, ",")
    .replace(BACKSLASH_RE, "\\")
    .replace(SPACE_RE, " ")
    .replace(LEFT_ANGLE_BRACKET_RE, "<")
    .replace(RIGHT_ANGLE_BRACKET_RE, ">")
    .replace(LEFT_SQUARE_BRACKET_RE, "[")
    .replace(PLUS_RE, "+");
}

export function encodeLines(scaleLines: string[]) {
  return scaleLines.map(encodeLine).join(NEWLINE);
}

export function decodeLines(encoded: string) {
  return encoded.split(NEWLINE).map(decodeLine);
}

export function encodeKeyColors(keyColors: string[]) {
  let result = "";
  keyColors.forEach((color) => {
    if (color === "black") {
      result += BLACK;
    } else if (color === "white") {
      result += WHITE;
    } else if (
      result.length &&
      !(result.endsWith(BLACK) || result.endsWith(WHITE))
    ) {
      result += SEPARATOR + color;
    } else {
      result += color;
    }
  });
  return result;
}

export function decodeKeyColors(encoded: string) {
  const result: string[] = [];
  let color = "";

  function pushColor() {
    if (color.length) {
      result.push(color);
    }
    color = "";
  }

  [...encoded].forEach((character) => {
    if (character === BLACK) {
      pushColor();
      result.push("black");
    } else if (character === WHITE) {
      pushColor();
      result.push("white");
    } else if (character === SEPARATOR) {
      pushColor();
    } else {
      color += character;
    }
  });
  pushColor();
  return result;
}

// Inverse of number.toString(36)
export function parseFloat36(string: string) {
  const [integerString, fractionString] = string.split(".");
  return (
    parseInt(integerString, 36) +
    parseInt(fractionString || "0", 36) / 36 ** (fractionString?.length || 0)
  );
}

// Use all URL friendly characters to encode numbers
// (reserve '.' for future fractional extension)
export function encodeNumber(n: number): string {
  // Digits and lower-case letters
  if (n >= 0 && n < 36) {
    return n.toString(36);
  }
  // Upper-case letters
  if (n >= 36 && n < 62) {
    return String.fromCharCode(29 + n);
  }
  // Misc
  if (n === 62) {
    return "_";
  }
  if (n === 63) {
    return "~";
  }

  // Negative
  if (n < 0) {
    return "-" + encodeNumber(-n);
  }

  // Recurse for multiple symbols
  return encodeNumber(Math.floor(n / 64)) + encodeNumber(n % 64);
}

export function decodeNumber(string: string) {
  let sign = 1;
  if (string[0] === "-") {
    sign = -1;
    string = string.slice(1);
  }
  let result = 0;
  for (const char of string) {
    result *= 64;
    if (/\d|[a-z]/.test(char)) {
      result += parseInt(char, 36);
    } else if (char === "_") {
      result += 62;
    } else if (char === "~") {
      result += 63;
    } else {
      result += char.charCodeAt(0) - 29;
    }
  }
  return sign * result;
}

function encodeNumberDelimited(n: number | undefined) {
  if (n === undefined) {
    return ".";
  }
  const result = encodeNumber(n);
  if (n >= 0 && result.length > 1) {
    return "--" + result + "-";
  }
  if (n < 0) {
    return result + "-";
  }
  return result;
}

export function encodeKeyMap(map: Map<string, number>) {
  let result = "";
  DIGIT_ROW.forEach((code) => (result += encodeNumberDelimited(map.get(code))));
  QWERTY_ROW.forEach(
    (code) => (result += encodeNumberDelimited(map.get(code)))
  );
  ASDF_ROW.forEach((code) => (result += encodeNumberDelimited(map.get(code))));
  ZXCV_ROW.forEach((code) => (result += encodeNumberDelimited(map.get(code))));
  return result;
}

export function decodeKeyMap(string: string): Map<string, number> {
  const tokens = [];
  while (string.length) {
    if (string.startsWith("--")) {
      let token = string[2];
      string = string.slice(3);
      while (string[0] !== "-") {
        token += string[0];
        string = string.slice(1);
      }
      tokens.push(token);
    } else if (string.startsWith("-")) {
      let token = string[0];
      string = string.slice(1);
      while (string[0] !== "-") {
        token += string[0];
        string = string.slice(1);
      }
      tokens.push(token);
    } else if (string[0] === ".") {
      tokens.push(null);
    } else {
      tokens.push(string[0]);
    }
    string = string.slice(1);
  }

  const result = new Map();
  tokens
    .map((t) => (t === null ? null : decodeNumber(t)))
    .forEach((n, i) => {
      if (n === null) {
        return;
      }
      for (const row of [DIGIT_ROW, QWERTY_ROW, ASDF_ROW, ZXCV_ROW]) {
        if (i < row.length) {
          return result.set(row[i], n);
        }
        i -= row.length;
      }
    });

  return result;
}

function getSingle(query: LocationQuery, key: string, defaultIfNull: string) {
  const result = query[key];
  if (Array.isArray(result)) {
    throw new Error(`Failed to decode key '${key}'`);
  }
  if (result === null) {
    return defaultIfNull;
  }
  return result;
}

export type DecodedState = {
  scaleLines: string[];
  keyColors: string[];
  scaleName: string;
  baseFrequency: number;
  baseMidiNote: number;
  isomorphicHorizontal: number;
  isomorphicVertical: number;
  keyboardMode: "isomorphic" | "mapped";
  keyboardMapping: Map<string, number>;
};

export type EncodedState = {
  l?: string;
  c?: string;
  n?: string;
  f?: string;
  m?: string;
  h?: string;
  v?: string;
  k?: string;
};

export function decodeQuery(
  query: LocationQuery | URLSearchParams
): DecodedState {
  let keyboardMode: "isomorphic" | "mapped" = "isomorphic";
  let get;
  if (query instanceof URLSearchParams) {
    get = (key: string, defaultIfNull: string) => {
      const result = query.get(key);
      if (result === null) {
        return defaultIfNull;
      }
      return result;
    };
    if (query.has("k")) {
      keyboardMode = "mapped";
    }
  } else {
    get = (key: string, defaultIfNull: string) =>
      getSingle(query, key, defaultIfNull);
    if ("k" in query) {
      keyboardMode = "mapped";
    }
  }
  return {
    scaleLines: decodeLines(get("l", "")),
    keyColors: decodeKeyColors(get("c", "~-~~-~-~~-~-")),
    scaleName: get("n", ""),
    baseFrequency: parseFloat36(get("f", "c8")),
    baseMidiNote: parseInt(get("m", "1x"), 36),
    isomorphicHorizontal: parseInt(get("h", "1"), 36),
    isomorphicVertical: parseInt(get("v", "5"), 36),
    keyboardMode,
    keyboardMapping: decodeKeyMap(
      get("k", "............-1-1.46.9bd.gi023578acefhj...........")
    ),
  };
}

export function encodeQuery(state: DecodedState): EncodedState {
  const result: EncodedState = {
    n: state.scaleName,
    l: encodeLines(state.scaleLines),
    c: encodeKeyColors(state.keyColors),
    f: state.baseFrequency.toString(36),
    m: state.baseMidiNote.toString(36),
    h: state.isomorphicHorizontal.toString(36),
    v: state.isomorphicVertical.toString(36),
    k: encodeKeyMap(state.keyboardMapping),
  };

  if (state.keyboardMode === "isomorphic") {
    delete result.k;
  }

  // The app includes version information so we can safely strip defaults
  if (!result.n?.length) {
    delete result.n;
  }
  if (!result.l?.length) {
    delete result.l;
  }
  if (result.c === "~-~~-~-~~-~-") {
    delete result.c;
  }
  if (result.f === "c8") {
    delete result.f;
  }
  if (result.m === "1x") {
    delete result.m;
  }
  if (result.h === "1") {
    delete result.h;
  }
  if (result.v === "5") {
    delete result.v;
  }

  return result;
}
