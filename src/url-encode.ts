import type { LocationQuery } from "vue-router";

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
    return result + num.toString(36);
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
  return result + num.toString();
}

function encodeLine(scaleLine: string) {
  scaleLine = scaleLine
    .replace("/", FRACTION)
    .replace(",", COMMA)
    .replace("\\", BACKSLASH)
    .replace(" ", SPACE)
    .replace("<", LEFT_ANGLE_BRACKET)
    .replace(">", RIGHT_ANGLE_BRACKET)
    .replace("[", LEFT_SQUARE_BRACKET)
    .replace("+", PLUS);
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
    .replace(FRACTION, "/")
    .replace(COMMA, ",")
    .replace(BACKSLASH, "\\")
    .replace(SPACE, " ")
    .replace(LEFT_ANGLE_BRACKET, "<")
    .replace(RIGHT_ANGLE_BRACKET, ">")
    .replace(LEFT_SQUARE_BRACKET, "[")
    .replace(PLUS, "+");
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
};

export type EncodedState = {
  l?: string;
  c?: string;
  n?: string;
  f?: string;
  m?: string;
  h?: string;
  v?: string;
};

export function decodeQuery(
  query: LocationQuery | URLSearchParams
): DecodedState {
  let get;
  if (query instanceof URLSearchParams) {
    get = (key: string, defaultIfNull: string) => {
      const result = query.get(key);
      if (result === null) {
        return defaultIfNull;
      }
      return result;
    };
  } else {
    get = (key: string, defaultIfNull: string) =>
      getSingle(query, key, defaultIfNull);
  }
  return {
    scaleLines: decodeLines(get("l", "")),
    keyColors: decodeKeyColors(get("c", "~-~~-~-~~-~-")),
    scaleName: get("n", ""),
    baseFrequency: parseFloat36(get("f", "c8")),
    baseMidiNote: parseInt(get("m", "1x"), 36),
    isomorphicHorizontal: parseInt(get("h", "1"), 36),
    isomorphicVertical: parseInt(get("v", "5"), 36),
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
  };

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
