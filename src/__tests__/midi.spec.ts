import { describe, it, expect } from 'vitest'
import { midiKeyInfo } from 'xen-midi'

import { computeWhiteIndices } from '../midi'

describe('White key to white color mapper', () => {
  it('reproduces a chromatic scale in the default (A minor) configuration', () => {
    const map = computeWhiteIndices(69, [
      'black',
      'white',
      'white',
      'black',
      'white',
      'black',
      'white',
      'white',
      'black',
      'white',
      'black',
      'white'
    ])

    for (let index = 69; index < 69 + 12; index++) {
      const info = midiKeyInfo(index)
      if (info.whiteNumber === undefined) {
        expect(map[info.sharpOf] + 1).toBe(index)
      } else {
        expect(map[info.whiteNumber]).toBe(index)
      }
    }
  })

  it('reproduces a chromatic scale in a C major configuration', () => {
    const map = computeWhiteIndices(60, [
      'black',
      'white',
      'black',
      'white',
      'white',
      'black',
      'white',
      'black',
      'white',
      'black',
      'white',
      'white'
    ])

    for (let index = 60; index < 60 + 12; index++) {
      const info = midiKeyInfo(index)
      if (info.whiteNumber === undefined) {
        expect(map[info.sharpOf] + 1).toBe(index)
      } else {
        expect(map[info.whiteNumber]).toBe(index)
      }
    }
  })

  it('maps smitonics opportunistically', () => {
    const map = computeWhiteIndices(
      69,
      'black white white black white white black white white black white '.split(' ')
    )

    // The logic of App.midiNoteOn is merely emulated here.

    // White keys
    expect(map[40]).toBe(69) // A4 -> J
    expect(map[41]).toBe(71) // B4 -> K
    expect(map[42]).toBe(72) // C5 -> L
    expect(map[43]).toBe(74) // D5 -> M
    expect(map[44]).toBe(75) // E5 -> N
    expect(map[45]).toBe(77) // F5 -> O
    expect(map[46]).toBe(78) // G5 -> P
    expect(map[40 + 7]).toBe(69 + 11) // A5 -> J'

    // Black keys
    expect(map[40] + 1).toBe(70) // A#4 -> J&
    expect(map[42] + 1).toBe(73) // C#5 -> L&
    expect(map[43] + 1).toBe(map[43 + 1]) // D#5 unmapped
    expect(map[45] + 1).toBe(map[45 + 1]) // F#5 unmapped
    expect(map[46] + 1).toBe(79) // G#5 -> P&
  })

  it('maps a tetratonic parent scale of a heptatonic scale', () => {
    const map = computeWhiteIndices(69, 'black white black white black white white'.split(' '))

    // White keys
    expect(map[40]).toBe(69) // A4 -> J
    expect(map[41]).toBe(71) // B4 -> K
    expect(map[42]).toBe(73) // C5 -> L
    expect(map[43]).toBe(75) // D5 -> M
    expect(map[44]).toBe(69 + 7) // E5 -> J'
    expect(map[45]).toBe(71 + 7) // F5 -> K'
    expect(map[46]).toBe(73 + 7) // G5 -> L'
    expect(map[40 + 7]).toBe(75 + 7) // A5 -> M'
  })
})
