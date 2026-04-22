import { PRIME_CENTS } from 'xen-dev-utils/primes'
import { Interval } from 'sonic-weave/interval'
import { TimeMonzo } from 'sonic-weave/monzo'
import { version } from '../package.json'
import { Fraction } from 'xen-dev-utils/fraction'

/**
 * Optional API base URL injected from environment configuration.
 */
export const API_URL: string | undefined = import.meta.env.VITE_API_URL

/**
 * Application title shown in browser metadata and top-level UI.
 */
export const APP_TITLE = `Scale Workshop ${version}`

/**
 * Prime component limit used by SonicWeave values in app-wide defaults.
 */
export const DEFAULT_NUMBER_OF_COMPONENTS = 25 // Enough to represent all primes < 100

/**
 * Newline match expression that accepts both Unix and Windows line endings.
 */
export const NEWLINE_TEST = /\r?\n/
/**
 * Unix line ending string.
 */
export const UNIX_NEWLINE = '\n'
/**
 * Windows line ending string.
 */
export const WINDOWS_NEWLINE = '\r\n'

/**
 * Number of MIDI notes in the supported note table.
 */
export const NUMBER_OF_NOTES = 128

/**
 * Mouse button id for the primary/left button.
 */
export const LEFT_MOUSE_BTN = 0

/**
 * Runtime detection flag for Safari (excluding Chrome/Firefox on iOS).
 */
export const IS_SAFARI =
  navigator.vendor &&
  navigator.vendor.indexOf('Apple') > -1 &&
  navigator.userAgent &&
  navigator.userAgent.indexOf('CriOS') == -1 &&
  navigator.userAgent.indexOf('FxiOS') == -1

/**
 * Maximum number of intervals that may be serialized into shared URLs.
 */
export const MAX_NUMBER_OF_SHARED_INTERVALS = 255

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

/**
 * Commonly-used interval constants.
 */
export const OCTAVE = new Interval(
  TimeMonzo.fromFraction(2, DEFAULT_NUMBER_OF_COMPONENTS),
  'linear'
)
export const FIFTH = new Interval(
  TimeMonzo.fromFraction('3/2', DEFAULT_NUMBER_OF_COMPONENTS),
  'linear'
)
export const THIRD = new Interval(
  TimeMonzo.fromFraction('5/4', DEFAULT_NUMBER_OF_COMPONENTS),
  'linear'
)
export const FIFTH_12TET = new Interval(
  TimeMonzo.fromEqualTemperament('7/12', 2, DEFAULT_NUMBER_OF_COMPONENTS),
  'logarithmic'
)
export const UNISON = new Interval(
  TimeMonzo.fromFraction(1, DEFAULT_NUMBER_OF_COMPONENTS),
  'linear'
)

export const INTERVALS_12TET = [...Array(12).keys()].map(
  (i) =>
    new Interval(
      TimeMonzo.fromEqualTemperament(new Fraction(i + 1, 12), 2, DEFAULT_NUMBER_OF_COMPONENTS),
      'logarithmic'
    )
)

export const CS_EDO = 5407372813
export const CS_VAL = new TimeMonzo(new Fraction(0), [])
for (let i = 0; i < DEFAULT_NUMBER_OF_COMPONENTS; ++i) {
  CS_VAL.primeExponents.push(new Fraction(Math.round((PRIME_CENTS[i] / 1200.0) * CS_EDO)))
}

export const DUMMY_ID = '000000000'
