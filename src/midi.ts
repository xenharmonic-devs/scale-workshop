import { mmod } from 'xen-dev-utils'
import { midiKeyInfo } from 'xen-midi'

/**
 * Computes a mapping from white MIDI notes to non-black scale degrees.
 *
 * If the base note is a black one the next white one will be used instead.
 *
 * Assumes that the size of the scale and number of colors is equal.
 */
export function computeWhiteIndices(baseMidiNote: number, colors: string[]) {
  const info = midiKeyInfo(baseMidiNote)
  colors = colors.map((c) => c.toLowerCase())

  let index = baseMidiNote
  let whiteIndex = info.whiteNumber === undefined ? info.sharpOf + 1 : info.whiteNumber
  let colorIndex = -1
  const result: number[] = []
  while (whiteIndex >= 0 && index > -1024) {
    if (colors[mmod(colorIndex--, colors.length)] !== 'black') {
      result[whiteIndex--] = index
    }
    index--
  }
  index = baseMidiNote
  whiteIndex = info.whiteNumber === undefined ? info.sharpOf + 1 : info.whiteNumber
  colorIndex = -1
  while (whiteIndex < 75 && index < 1024) {
    if (colors[mmod(colorIndex++, colors.length)] !== 'black') {
      result[whiteIndex++] = index
    }
    index++
  }
  return result
}
