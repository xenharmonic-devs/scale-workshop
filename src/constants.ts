import { ExtendedMonzo, Interval } from 'scale-workshop-core'
import { version } from '../package.json'

// GLOBALS
export const APP_TITLE = `Scale Workshop ${version}`

export const DEFAULT_NUMBER_OF_COMPONENTS = 25 // Enough to represent all primes < 100

export const NEWLINE_TEST = /\r?\n/
export const UNIX_NEWLINE = '\n'
export const WINDOWS_NEWLINE = '\r\n'

export const NUMBER_OF_NOTES = 128

// Vite production build workarounds
export const BASE_URL = import.meta.env.BASE_URL.startsWith('.')
  ? import.meta.env.BASE_URL.slice(1)
  : import.meta.env.BASE_URL

// Browser interaction
export const LEFT_MOUSE_BTN = 0

// === Sanity limits for tempering ===

// Anything larger than this isn't evaluated interactively
export const MAX_INTERACTIVE_SUBGROUP_SIZE = 6
// Anything larger than this uses O(n²) methods (if available) instead of O(exp(n))
export const MAX_GEO_SUBGROUP_SIZE = 9

// Some often used intervals
export const OCTAVE = new Interval(
  ExtendedMonzo.fromFraction(2, DEFAULT_NUMBER_OF_COMPONENTS),
  'ratio'
)
export const FIFTH = new Interval(
  ExtendedMonzo.fromFraction('3/2', DEFAULT_NUMBER_OF_COMPONENTS),
  'ratio'
)
export const THIRD = new Interval(
  ExtendedMonzo.fromFraction('5/4', DEFAULT_NUMBER_OF_COMPONENTS),
  'ratio'
)
export const FIFTH_12TET = new Interval(
  ExtendedMonzo.fromEqualTemperament('7/12', '2/1', DEFAULT_NUMBER_OF_COMPONENTS),
  'equal temperament'
)
