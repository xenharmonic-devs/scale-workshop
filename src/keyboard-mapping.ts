import { mmod } from 'xen-dev-utils'
import { CODES_LAYER_1 } from './keyboard'

export const DIGIT_ROW = CODES_LAYER_1[0].slice(1) as string[]
export const QWERTY_ROW = CODES_LAYER_1[1].slice(1) as string[]
export const ASDF_ROW = CODES_LAYER_1[2].slice(1) as string[]
export const ZXCV_ROW = CODES_LAYER_1[3] as string[]

function analyzeColors(keyColors: string[]) {
  let hasWhite = false
  let hasBlack = false
  for (const color of keyColors) {
    if (color.toLowerCase() === 'black') {
      hasBlack = true
    } else {
      hasWhite = true
    }
  }
  return { hasWhite, hasBlack }
}

/**
 * Map white keys to the row of keys starting with A, S, D and F
 * while mapping black keys to the row starting with Q, W, E and R.
 * @param keyColors Array containing the strings "white" and "black" in the desired order.
 * The array is assumed to be periodic and other strings/colors are treated as "white".
 * @param baseMidiNote Base MIDI note
 * @param baseIndex Base index that should incorporate equave and degree shifts
 * The result should be analogous to the virtual piano layout.
 */
export function mapWhiteAsdfBlackQwerty(
  keyColors: string[],
  baseMidiNote: number,
  baseIndex: number
) {
  const { hasWhite, hasBlack } = analyzeColors(keyColors)

  const map = new Map<string, number>()

  let colorIndex = baseIndex - baseMidiNote
  let whiteIndex = 0
  let blackIndex = 0
  let mappedIndex = baseIndex

  if (keyColors[mmod(colorIndex - 1, keyColors.length)].toLowerCase() === 'black') {
    map.set(QWERTY_ROW[0], mappedIndex - 1)
  }
  do {
    const color = keyColors[mmod(colorIndex++, keyColors.length)].toLowerCase()
    let code: string | undefined
    if (color !== 'black' && whiteIndex < ASDF_ROW.length) {
      code = ASDF_ROW[whiteIndex++]
      blackIndex = Math.max(blackIndex, whiteIndex)
    }
    if (color === 'black' && blackIndex < QWERTY_ROW.length) {
      code = QWERTY_ROW[blackIndex++]
      whiteIndex = Math.max(whiteIndex, blackIndex - 1)
    }
    if (code !== undefined) {
      map.set(code, mappedIndex++)
    }
  } while (
    (hasWhite && whiteIndex < ASDF_ROW.length) ||
    (hasBlack && blackIndex < QWERTY_ROW.length)
  )

  return map
}

/**
 * Map white keys to the rows containing QWERTY and ZXCV separated by an octave/equave
 * while mapping black keys to the rows with digits and ASDF respectively.
 * @param keyColors Array containing the strings "white" and "black" in the desired order.
 * The array is assumed to be periodic and other strings/colors are treated as "white".
 * @param scaleSize The size of the scale for calculating the octave shift between white&black courses.
 * @param baseMidiNote Base MIDI note
 * @param baseIndex Base index that should incorporate equave and degree shifts
 * @param zxcvIndex The amount to shift the ZXCV row to the right.
 * Expected values are 0 (no shift) and 1 to compensate for the lack of a button left of 'Z' on some keyboards.
 */
export function mapWhiteQweZxcBlack123Asd(
  keyColors: string[],
  scaleSize: number,
  baseMidiNote: number,
  baseIndex: number,
  zxcvIndex = 1
) {
  const { hasWhite, hasBlack } = analyzeColors(keyColors)

  const map = new Map<string, number>()

  // Map lower rows
  let colorIndex = baseIndex - baseMidiNote
  let whiteIndex = zxcvIndex
  let blackIndex = zxcvIndex
  let mappedIndex = baseIndex

  if (
    zxcvIndex === 1 &&
    keyColors[mmod(colorIndex - 1, keyColors.length)].toLowerCase() === 'black'
  ) {
    map.set(ASDF_ROW[0], mappedIndex - 1)
  }
  do {
    const color = keyColors[mmod(colorIndex++, keyColors.length)].toLowerCase()
    let code: string | undefined
    if (color !== 'black' && whiteIndex < ZXCV_ROW.length) {
      code = ZXCV_ROW[whiteIndex++]
      blackIndex = Math.max(blackIndex, whiteIndex - 1)
    }
    if (color === 'black' && blackIndex < ASDF_ROW.length) {
      code = ASDF_ROW[blackIndex++]
      whiteIndex = Math.max(whiteIndex, blackIndex)
    }
    if (code !== undefined) {
      map.set(code, mappedIndex++)
    }
  } while ((hasWhite && whiteIndex < ZXCV_ROW.length) || (hasBlack && blackIndex < ASDF_ROW.length))

  // Map upper rows and octave higher
  colorIndex = scaleSize + baseIndex - baseMidiNote
  whiteIndex = 0
  blackIndex = 1
  mappedIndex = scaleSize + baseIndex
  if (keyColors[mmod(colorIndex - 1, keyColors.length)].toLowerCase() === 'black') {
    map.set(DIGIT_ROW[0], mappedIndex - 1)
  }
  do {
    const color = keyColors[mmod(colorIndex++, keyColors.length)].toLowerCase()
    let code: string | undefined
    if (color !== 'black' && whiteIndex < QWERTY_ROW.length) {
      code = QWERTY_ROW[whiteIndex++]
      blackIndex = Math.max(blackIndex, whiteIndex)
    }
    if (color === 'black' && blackIndex < DIGIT_ROW.length) {
      code = DIGIT_ROW[blackIndex++]
      whiteIndex = Math.max(whiteIndex, blackIndex - 1)
    }
    if (code !== undefined) {
      map.set(code, mappedIndex++)
    }
  } while (
    (hasWhite && whiteIndex < QWERTY_ROW.length) ||
    (hasBlack && blackIndex < DIGIT_ROW.length)
  )

  return map
}
