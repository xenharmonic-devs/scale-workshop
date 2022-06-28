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
