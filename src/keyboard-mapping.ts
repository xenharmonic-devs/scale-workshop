import { mmod } from "xen-dev-utils";
import { CODES_LAYER_1 } from "./keyboard";

export const DIGIT_ROW = CODES_LAYER_1[0].slice(1) as string[];
export const QWERTY_ROW = CODES_LAYER_1[1].slice(1) as string[];
export const ASDF_ROW = CODES_LAYER_1[2].slice(1) as string[];
export const ZXCV_ROW = CODES_LAYER_1[3] as string[];

/**
 * Map white keys to the row of keys starting with A, S, D and F
 * while mapping black keys to the row starting with Q, W, E and R.
 * @param keyColors Array containing the strings "white" and "black" in the desired order.
 * The array is assumed to be periodic and other strings/colors are ignored.
 * @param map Map instance to store the result in.
 */
export function mapWhiteAsdfBlackQwerty(
  keyColors: string[],
  map: Map<string, number>
) {
  if (!keyColors.includes("white") || !keyColors.includes("black")) {
    return;
  }

  map.clear();

  let colorIndex = 0;
  let whiteIndex = 0;
  let blackIndex = 1;
  let mappedIndex = 0;
  do {
    const color = keyColors[mmod(colorIndex++, keyColors.length)];
    let code: string | undefined;
    if (color === "white" && whiteIndex < ASDF_ROW.length) {
      code = ASDF_ROW[whiteIndex++];
      blackIndex = Math.max(blackIndex, whiteIndex);
    }
    if (color === "black" && blackIndex < QWERTY_ROW.length) {
      code = QWERTY_ROW[blackIndex++];
      whiteIndex = Math.max(whiteIndex, blackIndex - 1);
    }
    if (code !== undefined) {
      map.set(code, mappedIndex++);
    }
  } while (whiteIndex < ASDF_ROW.length || blackIndex < QWERTY_ROW.length);

  if (keyColors[keyColors.length - 1] === "black") {
    map.set(QWERTY_ROW[0], -1);
  }
}

/**
 * Map white keys to the rows containing QWERTY and ZXCV separated by an octave/equave
 * while mapping black keys to the rows with digits and ASDF respectively.
 * @param keyColors Array containing the strings "white" and "black" in the desired order.
 * The array is assumed to be periodic and other strings/colors are ignored.
 * @param map Map instance to store the result in.
 * @param scaleSize The size of the scale for calculating the octave shift between white&black courses.
 * @param zxcvIndex The amount to shift the ZXCV row to the right.
 * Expected values are 0 (no shift) and 1 to compensate for the lack of a button left of 'Z' on some keyboards.
 */
export function mapWhiteQweZxcBlack123Asd(
  keyColors: string[],
  map: Map<string, number>,
  scaleSize: number,
  zxcvIndex = 1
) {
  if (!keyColors.includes("white") || !keyColors.includes("black")) {
    return;
  }

  map.clear();

  // Map lower rows
  let colorIndex = 0;
  let whiteIndex = zxcvIndex;
  let blackIndex = zxcvIndex;
  let mappedIndex = 0;
  do {
    const color = keyColors[mmod(colorIndex++, keyColors.length)];
    let code: string | undefined;
    if (color === "white" && whiteIndex < ZXCV_ROW.length) {
      code = ZXCV_ROW[whiteIndex++];
      blackIndex = Math.max(blackIndex, whiteIndex - 1);
    }
    if (color === "black" && blackIndex < ASDF_ROW.length) {
      code = ASDF_ROW[blackIndex++];
      whiteIndex = Math.max(whiteIndex, blackIndex);
    }
    if (code !== undefined) {
      map.set(code, mappedIndex++);
    }
  } while (whiteIndex < ZXCV_ROW.length || blackIndex < ASDF_ROW.length);

  if (zxcvIndex === 1 && keyColors[keyColors.length - 1] === "black") {
    map.set(ASDF_ROW[0], -1);
  }

  // Map upper rows and octave higher
  colorIndex = 0;
  whiteIndex = 0;
  blackIndex = 1;
  mappedIndex = scaleSize;
  do {
    const color = keyColors[mmod(colorIndex++, keyColors.length)];
    let code: string | undefined;
    if (color === "white" && whiteIndex < QWERTY_ROW.length) {
      code = QWERTY_ROW[whiteIndex++];
      blackIndex = Math.max(blackIndex, whiteIndex);
    }
    if (color === "black" && blackIndex < DIGIT_ROW.length) {
      code = DIGIT_ROW[blackIndex++];
      whiteIndex = Math.max(whiteIndex, blackIndex - 1);
    }
    if (code !== undefined) {
      map.set(code, mappedIndex++);
    }
  } while (whiteIndex < QWERTY_ROW.length || blackIndex < DIGIT_ROW.length);

  if (keyColors[keyColors.length - 1] === "black") {
    map.set(DIGIT_ROW[0], scaleSize - 1);
  }
}
