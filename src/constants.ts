// import { ExtendedMonzo, Interval } from 'scale-workshop-core'
import { Interval, TimeMonzo } from 'sonic-weave'
import { version } from '../package.json'
import { Fraction } from 'xen-dev-utils'

// GLOBALS
export const APP_TITLE = `Scale Workshop ${version}`

export const DEFAULT_NUMBER_OF_COMPONENTS = 25 // Enough to represent all primes < 100

export const NEWLINE_TEST = /\r?\n/
export const UNIX_NEWLINE = '\n'
export const WINDOWS_NEWLINE = '\r\n'

export const NUMBER_OF_NOTES = 128

// Browser interaction
export const LEFT_MOUSE_BTN = 0

// === Sanity limits for tempering ===

// Anything larger than this isn't evaluated interactively
export const MAX_INTERACTIVE_SUBGROUP_SIZE = 6
// Anything larger than this uses O(n²) methods (if available) instead of O(exp(n))
export const MAX_GEO_SUBGROUP_SIZE = 9

export const SEMITONE_12TET = 2 ** (1 / 12)

export const TET12 = [...Array(12).keys()].map((i) => SEMITONE_12TET ** (i + 1))

export const MIDI_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const MIDI_NOTE_COLORS = [
  'white',
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
  'white'
]

// Some often used intervals
export const OCTAVE = new Interval(
  TimeMonzo.fromFraction(2, DEFAULT_NUMBER_OF_COMPONENTS),
  'linear',
  { type: 'FractionLiteral', numerator: 2n, denominator: 1n }
)
export const FIFTH = new Interval(
  TimeMonzo.fromFraction('3/2', DEFAULT_NUMBER_OF_COMPONENTS),
  'linear',
  { type: 'FractionLiteral', numerator: 3n, denominator: 2n }
)
export const THIRD = new Interval(
  TimeMonzo.fromFraction('5/4', DEFAULT_NUMBER_OF_COMPONENTS),
  'linear'
)
export const FIFTH_12TET = new Interval(
  TimeMonzo.fromEqualTemperament('7/12', 2, DEFAULT_NUMBER_OF_COMPONENTS),
  'logarithmic'
)

export const INTERVALS_12TET = [...Array(12).keys()].map(
  (i) =>
    new Interval(
      TimeMonzo.fromEqualTemperament(new Fraction(i + 1, 12), 2, DEFAULT_NUMBER_OF_COMPONENTS),
      'logarithmic'
    )
)
