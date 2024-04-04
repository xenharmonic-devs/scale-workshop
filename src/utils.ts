import { computed, watch, type ComputedRef, type Ref } from 'vue'
import { gcd, mmod } from 'xen-dev-utils'
import {
  evaluateExpression,
  getSourceVisitor,
  Interval,
  parseAST,
  repr,
  StatementVisitor
} from 'sonic-weave'

/**
 * Calculate the smallest power of two greater or equal to the input value.
 * @param x Integer to compare to.
 * @returns Smallest `2**n` such that `x <= 2**n`.
 */
export function ceilPow2(x: number) {
  return 1 << (32 - Math.clz32(x - 1))
}

export function parseInterval(input: string) {
  if (!input.trim()) {
    throw new Error('No input')
  }
  const result = evaluateExpression(input)
  if (result instanceof Interval) {
    return result
  }
  throw new Error('Must evaluate to an interval')
}

export function decimalString(amount: number) {
  const result = amount.toString()
  if (result.includes('e')) {
    return result
  }
  return result + 'e'
}

export function centString(cents: number, fractionDigits?: number) {
  const result = fractionDigits === undefined ? cents.toString() : cents.toFixed(fractionDigits)
  if (result.includes('e')) {
    return result + ' c'
  }
  if (!result.includes('.')) {
    return result + '.'
  }
  return result
}

export function parseCents(cents: number, fractionDigits?: number) {
  return parseInterval(centString(cents, fractionDigits))
}

// Split at whitespace, pipes, amps, colons, semicolons and commas
export const SEPARATOR_RE = /\s|\||&|:|;|,/

export function splitText(text: string) {
  return text.split(SEPARATOR_RE).filter((token) => token.length)
}

export function expandCode(source: string) {
  const globalVisitor = getSourceVisitor()
  const defaults = globalVisitor.rootContext.clone()
  const visitor = new StatementVisitor(globalVisitor.rootContext, globalVisitor)
  const ast = parseAST(source)
  for (const statement of ast.body) {
    const interupt = visitor.visit(statement)
    if (interupt) {
      throw new Error('Illegal statement.')
    }
  }
  return visitor.expand(defaults)
}

export function arrayToString(values: Interval[] | number[] | string[]) {
  if (!values.length) {
    return '[]'
  }
  if (typeof values[0] === 'number') {
    return `[${values.map((v) => v.toString()).join(', ')}]`
  }
  if (typeof values[0] === 'string') {
    return `[${values.map((v) => JSON.stringify(v)).join(', ')}]`
  }
  const visitor = getSourceVisitor().createExpressionVisitor()
  return repr.bind(visitor)(values as Interval[])
}

export function debounce(func: (...args: any[]) => void, timeout = 300) {
  let timer: number
  return (...args: any[]) => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      func(...args)
    }, timeout)
  }
}

const MIDI_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/**
 * Convert an integer MIDI note number to a name such as A4.
 * @param noteNumber MIDI note number to convert.
 * @param octaveOffset Defaults to the English standard: 69 = A4. An offset of zero results in the French standard 69 = A5.
 * @returns String representation of the MIDI note number.
 */
export function midiNoteNumberToName(noteNumber: number, octaveOffset = -1) {
  const remainder = mmod(noteNumber, 12)
  const quotient = (noteNumber - remainder) / 12 + octaveOffset
  return MIDI_NOTE_NAMES[remainder] + quotient.toString()
}

export function sanitizeFilename(input: string) {
  input = input.trim()
  if (!input.length) {
    return 'untitled scale'
  }
  return input
    .replace(/[|&;$%@"<>()+,?]/g, '')
    .replace(/\//g, '_')
    .replace(/\\/g, '_')
}

export function formatExponential(x: number, fractionDigits = 3) {
  if (isNaN(x) || !isFinite(x)) {
    return x.toString()
  }
  if (Math.abs(x) < 10000) {
    return x.toFixed(fractionDigits)
  }
  const e = Math.floor(Math.log10(Math.abs(x)))
  const f = 10 ** (fractionDigits - e)
  const d = 0.1 ** fractionDigits
  return (d * Math.round(x * f)).toFixed(fractionDigits) + 'e+' + e.toString()
}

export function formatHertz(frequency: number, fractionDigits = 3) {
  const magnitude = Math.abs(frequency)

  // Use regular formatting for magnitudes within human limits
  if (1 <= magnitude && magnitude < 100000) {
    return frequency.toFixed(fractionDigits) + 'Hz'
  }

  // Submultiples
  if (magnitude < 1e-27) {
    return (frequency * 1e30).toFixed(fractionDigits) + 'qHz'
  }
  if (magnitude < 1e-24) {
    return (frequency * 1e27).toFixed(fractionDigits) + 'rHz'
  }
  if (magnitude < 1e-21) {
    return (frequency * 1e24).toFixed(fractionDigits) + 'yHz'
  }
  if (magnitude < 1e-18) {
    return (frequency * 1e21).toFixed(fractionDigits) + 'zHz'
  }
  if (magnitude < 1e-15) {
    return (frequency * 1e18).toFixed(fractionDigits) + 'aHz'
  }
  if (magnitude < 1e-12) {
    return (frequency * 1e15).toFixed(fractionDigits) + 'fHz'
  }
  if (magnitude < 1e-9) {
    return (frequency * 1e12).toFixed(fractionDigits) + 'pHz'
  }
  if (magnitude < 1e-6) {
    return (frequency * 1e9).toFixed(fractionDigits) + 'nHz'
  }
  if (magnitude < 1e-3) {
    return (frequency * 1e6).toFixed(fractionDigits) + 'µHz'
  }
  if (magnitude < 1) {
    return (frequency * 1e3).toFixed(fractionDigits) + 'mHz'
  }

  // Too large. Use scientific notation.
  if (magnitude > 1e34 || isNaN(magnitude)) {
    return formatExponential(frequency) + 'Hz'
  }

  // Multiples
  if (magnitude > 1e30) {
    return (frequency * 1e-30).toFixed(fractionDigits) + 'QHz'
  }
  if (magnitude > 1e27) {
    return (frequency * 1e-27).toFixed(fractionDigits) + 'RHz'
  }
  if (magnitude > 1e24) {
    return (frequency * 1e-24).toFixed(fractionDigits) + 'YHz'
  }
  if (magnitude > 1e21) {
    return (frequency * 1e-21).toFixed(fractionDigits) + 'ZHz'
  }
  if (magnitude > 1e18) {
    return (frequency * 1e-18).toFixed(fractionDigits) + 'EHz'
  }
  if (magnitude > 1e15) {
    return (frequency * 1e-15).toFixed(fractionDigits) + 'PHz'
  }
  if (magnitude > 1e12) {
    return (frequency * 1e-12).toFixed(fractionDigits) + 'THz'
  }
  if (magnitude > 1e9) {
    return (frequency * 1e-9).toFixed(fractionDigits) + 'GHz'
  }
  if (magnitude > 1e6) {
    return (frequency * 1e-6).toFixed(fractionDigits) + 'MHz'
  }
  return (frequency * 1e-3).toFixed(fractionDigits) + 'kHz'
}

export function autoKeyColors(size: number) {
  if (size < 2) {
    return ['white']
  }
  if (size === 3) {
    return ['white', 'black', 'white']
  }
  if (size === 5) {
    return ['white', 'black', 'white', 'black', 'white']
  }
  if (size === 6) {
    return ['white', 'black', 'white', 'black', 'white', 'black']
  }

  let generator = Math.round(Math.log2(4 / 3) * size)
  while (gcd(generator, size) > 1) {
    generator--
  }

  const result: string[] = Array(size).fill('black')
  let index = mmod(-2 * generator, size)
  let hasBlackClusters = true
  do {
    result[index] = 'white'
    hasBlackClusters = false
    for (let i = 0; i < size - 1; ++i) {
      if (result[i] === 'black' && result[i + 1] === 'black') {
        hasBlackClusters = true
        break
      }
    }
    index = mmod(index + generator, size)
  } while (hasBlackClusters)

  return result
}

/**
 * Fill in the gaps of a parent scale (in white) with accidentals (in black).
 * @param generatorPerPeriod Generator sizre divided by period size (in pitch space).
 * @param size Size of the parent scale.
 * @param down Number of generators to go down from 1/1.
 * @returns Array of key colors.
 */
export function gapKeyColors(generatorPerPeriod: number, size: number, down: number, flats = true) {
  const scale = [...Array(size).keys()].map((i) => mmod(generatorPerPeriod * (i - down), 1))
  scale.sort((a, b) => a - b)
  const colors: ('white' | 'black')[] = Array(size).fill('white')

  let i = size - down
  let delta = 1
  if (flats) {
    i = -down - 1
    delta = -1
  }
  // Limit for sanity
  while (Math.abs(i) < 1000) {
    const newNote = mmod(generatorPerPeriod * i, 1)
    let gapFound = false
    for (let j = 1; j < scale.length; ++j) {
      const oldNote = scale[j]
      if (oldNote > newNote) {
        if (colors[j] === 'black' || colors[j - 1] === 'black') {
          return colors
        } else {
          scale.splice(j, 0, newNote)
          colors.splice(j, 0, 'black')
        }
        gapFound = true
        break
      }
    }
    if (!gapFound) {
      if (colors[colors.length - 1] === 'black' || colors[0] === 'black') {
        return colors
      }
      scale.push(newNote)
      colors.push('black')
    }

    i += delta
  }

  return colors
}

// Wrapper for a computed property that can fail.
// The error string is non-empty when the property fails to compute.
export function computedAndError<T>(
  getter: () => T,
  defaultValue: T
): [ComputedRef<T>, ComputedRef<string>] {
  const valueAndError = computed<[T, string]>(() => {
    try {
      return [getter(), '']
    } catch (error) {
      if (error instanceof Error) {
        return [defaultValue, error.message || ' ']
      }
      return [defaultValue, '' + error || ' ']
    }
  })
  const value = computed(() => valueAndError.value[0])
  const error = computed(() => valueAndError.value[1])
  return [value, error]
}

export function setAndReportValidity(
  element: HTMLInputElement | HTMLSelectElement | HTMLObjectElement | null,
  message: string
) {
  if (!element) {
    return
  }
  element.setCustomValidity(message)
  element.reportValidity()
}

// Calculates euclidean distance for monzos, as it assumes that if points are not of the same dimension, then the missing dimensions have a value of zero.
export function monzoEuclideanDistance(
  equavePrimeIndex: number,
  point1: number[],
  point2: number[]
): number {
  // Ensure that both points have the same dimension
  const maxDimension = Math.max(point1.length, point2.length)
  // Pad the shorter point with zeroes to match the longer point's dimension
  const point1_ = point1.concat(Array(maxDimension - point1.length).fill(0))
  const point2_ = point2.concat(Array(maxDimension - point2.length).fill(0))

  const distance = Math.hypot(
    ...point1_.map((coord1, index) => {
      return index === equavePrimeIndex ? 0 : point2_[index] - coord1
    })
  )

  return distance
}

export type AccidentalStyle = 'double' | 'single' | 'ASCII'

const NOMINALS = ['F', 'C', 'G', 'D', 'A', 'E', 'B']

/**
 * Obtain a nominal with sharps and flats along the chain of fifths starting from C.
 * @param fifthsUp How far clockwise to travel along the spiral of fifths.
 * @param style Whether or not to use '𝄫' and '𝄪' or to use 'b' and '#' throughout.
 * @returns The label of the pitch class.
 */
export function spineLabel(fifthsUp: number, style: AccidentalStyle = 'double'): string {
  let label = NOMINALS[mmod(fifthsUp + 1, NOMINALS.length)]
  let accidentals = Math.floor((fifthsUp + 1) / NOMINALS.length)
  const flat = style === 'ASCII' ? 'b' : '♭'
  const sharp = style === 'ASCII' ? '#' : '♯'
  while (accidentals <= -2) {
    if (style === 'double') {
      label += '𝄫'
    } else {
      label += flat + flat
    }
    accidentals += 2
  }
  while (accidentals >= 2) {
    if (style === 'double') {
      label += '𝄪'
    } else {
      label += sharp + sharp
    }
    accidentals -= 2
  }
  if (accidentals > 0) {
    label += sharp
  }
  if (accidentals < 0) {
    label += flat
  }
  return label
}

const ENHARMONICS = [
  ['C=', 'B#', 'Dbb'],
  ['C#', 'Db'],
  ['D=', 'C##', 'Ebb'],
  ['Eb', 'D#'],
  ['E=', 'Fb', 'D##'],
  ['F=', 'E#', 'Gbb'],
  ['F#', 'Gb'],
  ['G=', 'F##', 'Abb'],
  ['G#', 'Ab'],
  ['A=', 'G##', 'Bbb'],
  ['Bb', 'A#'],
  ['B=', 'Cb', 'A##']
]

// Find a set of Pythagorean enharmonics corresponding to a MIDI note number
export function midiNoteNumberToEnharmonics(
  noteNumber: number,
  style: AccidentalStyle = 'double',
  octaveOffset = -1
) {
  const remainder = mmod(noteNumber, 12)
  const quotient = (noteNumber - remainder) / 12 + octaveOffset
  const enharmonics = ENHARMONICS[remainder]
  const result = []
  for (let enharmonic of enharmonics) {
    if (style === 'double') {
      enharmonic = enharmonic.replace('bb', '𝄫')
      enharmonic = enharmonic.replace('##', '𝄪')
    }
    if (style === 'single' || style === 'double') {
      enharmonic = enharmonic.replace(/b/g, '♭')
      enharmonic = enharmonic.replace(/#/g, '♯')
      enharmonic = enharmonic.replace('=', '♮')
    }
    let octave = quotient.toString()
    if (enharmonic.startsWith('B') && enharmonics[0].startsWith('C')) {
      octave = (quotient - 1).toString()
    }
    if (enharmonic.startsWith('C') && enharmonics[0].startsWith('B')) {
      octave = (quotient + 1).toString()
    }
    result.push(enharmonic + octave)
  }
  return result
}

export function annotateColors(sourceLines: string[], keyColors: string[]) {
  if (!keyColors.length) {
    return
  }
  for (let i = 0; i < sourceLines.length; ++i) {
    sourceLines[i] += ' ' + keyColors[mmod(i + 1, keyColors.length)].replace(/%/g, '')
  }
}

/**
 * Synchronize local storage with the values of Vue refs.
 * @param values Vue refs to watch in a `{ref1, ref2}` record.
 */
export function syncValues(values: Record<string, Ref>) {
  for (const [key, value] of Object.entries(values)) {
    watch(value, (newValue) => window.localStorage.setItem(key, String(newValue)))
  }
}
