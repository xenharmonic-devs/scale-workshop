import { Scale } from '@/scale'
import { midiNoteNumberToEnharmonics, type AccidentalStyle } from '@/utils'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { mmod, mtof } from 'xen-dev-utils'
import {
  getSourceVisitor,
  parseAST,
  relative,
  Interval,
  TimeMonzo,
  str,
  centsColor,
  factorColor,
  type SonicWeaveValue,
  StatementVisitor,
  ExpressionVisitor,
  builtinNode
} from 'sonic-weave'
import {
  DEFAULT_NUMBER_OF_COMPONENTS,
  INTERVALS_12TET,
  MIDI_NOTE_COLORS,
  MIDI_NOTE_NAMES,
  NUMBER_OF_NOTES,
  TET12
} from '@/constants'
import { pianoMap } from 'isomorphic-qwerty'
import { computeWhiteIndices } from '@/midi'

// Colors from #1 to #12 inclusive.
function defaultColors(base: number) {
  return [...Array(12).keys()].map((i) => MIDI_NOTE_COLORS[mmod(base + 1 + i, 12)])
}

// Labels from #1 to #12 inclusive.
function defaultLabels(base: number, accidentalStyle: AccidentalStyle) {
  const result = [...Array(12).keys()].map((i) => MIDI_NOTE_NAMES[mmod(base + 1 + i, 12)])
  if (accidentalStyle === 'ASCII') {
    return result
  }
  return result.map((n) => n.replace('#', '♯'))
}

export const useScaleStore = defineStore('scale', () => {
  // Note that most of these values are debounce-computed due to being expensive.
  // The second party is responsible for debouncing `computeScale`.
  const accidentalPreference = ref<AccidentalStyle>(
    (localStorage.getItem('accidentalPreference') as AccidentalStyle) ?? 'double'
  )
  // Some keyboards like FI have a handy key left of 'Z'
  const hasLeftOfZ = ref(localStorage.getItem('hasLeftOfZ') === 'true')

  const name = ref('')
  const baseMidiNote = ref(60)
  const enharmonics = computed(() =>
    midiNoteNumberToEnharmonics(baseMidiNote.value, accidentalPreference.value)
  )
  const enharmonic = ref(enharmonics.value[0])
  const userBaseFrequency = ref(261.63)
  const autoFrequency = ref(true)
  const baseFrequency = computed({
    get() {
      return autoFrequency.value ? mtof(baseMidiNote.value) : userBaseFrequency.value
    },
    set(value: number) {
      userBaseFrequency.value = value
    }
  })
  const autoColors = ref<'silver' | 'cents' | 'factors'>('silver')
  const sourceText = ref('')
  const relativeIntervals = ref(INTERVALS_12TET)
  const latticeIntervals = ref(INTERVALS_12TET)
  const scale = ref(new Scale(TET12, baseFrequency.value, baseMidiNote.value))
  const colors = ref(defaultColors(baseMidiNote.value))
  const labels = ref(defaultLabels(baseMidiNote.value, accidentalPreference.value))
  const error = ref('')

  // Keyboard mode affects both physical qwerty and virtual keyboards
  const keyboardMode = ref<'isomorphic' | 'piano'>('isomorphic')
  // QWERTY mapping is coupled to equave and degree shifts
  const equaveShift = ref(0)
  const degreeShift = ref(0)
  // QWERTY physical layout mimics a piano layout
  // Asdf: Non-black keys on ASDF-row black keys on QWERTY row
  // QweZxc0: Two octaves similar to 'Asdf' (assumes that there's a key left of 'Z')
  // QweZxc1: Two octaves similar to 'Asdf' (assumes that there's no key left of 'Z')
  // Zxc0: Generic keys on ZXCV-row, maroon keys on ASDF, navy keys on QWERTY, indigo keys on digits row (left of Z)
  // Zxc1: Same as above (no left of Z)
  const pianoMode = ref<'Asdf' | 'QweZxc' | 'Zxc'>('Asdf')
  const accidentalColor = ref('black')
  const lowAccidentalColor = ref('maroon')
  const middleAccidentalColor = ref('navy')
  const highAccidentalColor = ref('indigo')

  // TODO: Configure all piano modes

  // === Computed state ===
  const sourcePrefix = computed(() => {
    const base = `numComponents(${DEFAULT_NUMBER_OF_COMPONENTS})\n`
    if (autoFrequency.value) {
      return `${base}${enharmonic.value} = mtof(_) = 1/1`
    }
    return `${base}${enharmonic.value} = baseFrequency = 1/1`
  })

  const frequencies = computed(() => scale.value.getFrequencyRange(0, NUMBER_OF_NOTES))

  const latticePermutation = computed(() => {
    const intervals = relativeIntervals.value
    const result: number[] = []
    tracking: for (let i = 0; i < intervals.length; ++i) {
      for (const id of intervals[i].trackingIds) {
        if (id < 1) {
          result.push(-id)
          continue tracking
        }
      }
      result.push(i)
    }
    return result
  })

  const inverseLatticePermutation = computed(() => {
    const result: number[] = []
    for (let i = 0; i < latticePermutation.value.length; ++i) {
      // XXX: JS is one wild language.
      result[latticePermutation.value[i]] = i
    }
    return result
  })

  const latticeLabels = computed(() => inverseLatticePermutation.value.map((i) => labels.value[i]))
  const latticeColors = computed(() => inverseLatticePermutation.value.map((i) => colors.value[i]))

  /**
   * Obtain the lowercased color corresponding to specified MIDI index
   * @param index MIDI index
   */
  function colorForIndex(index: number) {
    // Colors have the same period as the scale so equave shift can be ignored here
    return colors.value[mmod(index - baseMidiNote.value - 1, colors.value.length)].toLowerCase()
  }

  /**
   * Obtain the label corresponding to specified MIDI index
   * @param index MIDI index
   */
  function labelForIndex(index: number) {
    return labels.value[mmod(index - baseMidiNote.value - 1, labels.value.length)]
  }

  // QWERTY mapping is coupled to key colors
  const qwertyMapping = computed<Map<string, number>>(() => {
    const black = accidentalColor.value.toLowerCase()
    let firstIndex = baseMidiNote.value + degreeShift.value + scale.value.size * equaveShift.value
    if (pianoMode.value === 'Asdf') {
      if (colorForIndex(firstIndex - 1) === black) {
        firstIndex--
      }

      // Max = 30 overshoots quite a bit, but it's a nice round number.
      const ys: number[] = []
      for (let i = firstIndex; i < firstIndex + 30; ++i) {
        ys.push(colorForIndex(i) === black ? 1 : 2)
      }
      const { indexByCode } = pianoMap(ys)
      for (const [code, index] of indexByCode) {
        indexByCode.set(code, index + firstIndex)
      }
      return indexByCode
    } else if (pianoMode.value === 'QweZxc') {
      const ys: number[] = []
      // ZXCV & ASDF
      if (!hasLeftOfZ.value) {
        if (colorForIndex(firstIndex - 1) === black) {
          firstIndex--
        }
        ys.push(3) // Dummy filler for the missing key
      }
      for (let i = firstIndex; i < firstIndex + 30; ++i) {
        ys.push(colorForIndex(i) === black ? 2 : 3)
      }
      const { indexByCode } = pianoMap(ys)
      if (!hasLeftOfZ.value) {
        firstIndex-- // Correct for the dummy
      }
      for (const [code, index] of indexByCode) {
        indexByCode.set(code, index + firstIndex)
      }

      // QWERTY & digits
      firstIndex =
        baseMidiNote.value + degreeShift.value + scale.value.size * (equaveShift.value + 1)
      if (colorForIndex(firstIndex - 1) === black) {
        firstIndex--
      }
      ys.length = 0
      for (let i = firstIndex; i < firstIndex + 30; ++i) {
        ys.push(colorForIndex(i) === black ? 0 : 1)
      }
      const { indexByCode: qMap } = pianoMap(ys)
      for (const [code, index] of qMap) {
        indexByCode.set(code, index + firstIndex)
      }

      return indexByCode
    } else {
      const low = lowAccidentalColor.value.toLowerCase()
      const middle = middleAccidentalColor.value.toLowerCase()
      const high = highAccidentalColor.value.toLowerCase()
      const ys: number[] = []
      if (!hasLeftOfZ.value) {
        if ([low, middle, high].includes(colorForIndex(firstIndex - 1))) {
          firstIndex--
        }
        ys.push(3) // Dummy filler for the missing key
      }
      for (let i = firstIndex; i < firstIndex + 60; ++i) {
        const color = colorForIndex(i)
        if (color === low) {
          ys.push(2)
        } else if (color === middle) {
          ys.push(1)
        } else if (color === high) {
          ys.push(0)
        } else {
          ys.push(3)
        }
      }
      const { indexByCode } = pianoMap(ys)
      if (!hasLeftOfZ.value) {
        firstIndex-- // Correct for the dummy
      }
      for (const [code, index] of indexByCode) {
        indexByCode.set(code, index + firstIndex)
      }
      return indexByCode
    }
  })

  const splitAccidentals = computed(() => pianoMode.value === 'Zxc')

  // For midi mapping
  const whiteIndices = computed(() => computeWhiteIndices(baseMidiNote.value, colors.value))

  // State synchronization
  watch([baseMidiNote, accidentalPreference], () => {
    enharmonic.value = enharmonics.value[0]
  })

  // Sanity watchers
  watch(baseMidiNote, (newValue) => {
    if (isNaN(newValue)) {
      baseMidiNote.value = 60
    } else if (Math.round(newValue) != newValue) {
      baseMidiNote.value = Math.round(newValue)
    }
  })

  // Local storage watchers
  watch(accidentalPreference, (newValue) => localStorage.setItem('accidentalPreference', newValue))
  watch(hasLeftOfZ, (newValue) => window.localStorage.setItem('hasLeftOfZ', newValue.toString()))

  function latticeView(this: ExpressionVisitor) {
    const scale = this.getCurrentScale()
    for (let i = 0; i < scale.length; ++i) {
      scale[i] = scale[i].shallowClone()
      // XXX: Abuses the fact that SonicWeave tracking ids are positive.
      scale[i].trackingIds.add(-i)
    }
    const rel = relative.bind(this)
    latticeIntervals.value = scale.map((i) => rel(i))
  }
  latticeView.__doc__ = 'Store the current scale to be displayed in the lattice tab.'
  latticeView.__node__ = builtinNode(latticeView)

  // Local helpers
  function getGlobalVisitor() {
    // Inject global variables
    const _ = Interval.fromInteger(baseMidiNote.value)
    const baseFreq = new Interval(TimeMonzo.fromArbitraryFrequency(baseFrequency.value), 'linear')
    const extraBuiltins: Record<string, SonicWeaveValue> = {
      scaleName: name.value,
      _,
      baseMidiNote: _,
      baseFrequency: baseFreq,
      latticeView
    }
    const visitor = getSourceVisitor(true, extraBuiltins)
    // TODO: Make this a user preference.
    visitor.rootContext.gas = 10000

    // Declare base nominal and unison frequency
    const prefixAst = parseAST(sourcePrefix.value)
    for (const statement of prefixAst.body) {
      visitor.visit(statement)
    }

    return visitor
  }

  // Methods
  function getVisitors() {
    const globalVisitor = getGlobalVisitor()
    const visitor = new StatementVisitor(globalVisitor.rootContext, globalVisitor)
    const defaults = visitor.clone()
    defaults.rootContext = defaults.rootContext.clone()

    const ast = parseAST(sourceText.value)
    for (const statement of ast.body) {
      const interupt = visitor.visit(statement)
      if (interupt) {
        throw new Error('Illegal statement.')
      }
    }
    return {
      defaults,
      visitor
    }
  }

  function computeScale() {
    try {
      latticeIntervals.value = []
      const globalVisitor = getGlobalVisitor()
      const visitor = new StatementVisitor(globalVisitor.rootContext, globalVisitor)
      const ast = parseAST(sourceText.value)
      for (const statement of ast.body) {
        const interupt = visitor.visit(statement)
        if (interupt) {
          throw new Error('Illegal statement.')
        }
      }

      const intervals = visitor.getCurrentScale()
      const ev = visitor.createExpressionVisitor()
      const rel = relative.bind(ev)
      relativeIntervals.value = intervals.map((i) => rel(i))
      if (!latticeIntervals.value.length) {
        latticeIntervals.value = relativeIntervals.value
      }
      const ratios = relativeIntervals.value.map((i) => i.value.valueOf())
      let visitorBaseFrequency = mtof(baseMidiNote.value)
      if (visitor.rootContext.unisonFrequency) {
        visitorBaseFrequency = visitor.rootContext.unisonFrequency.valueOf()
      }
      if (ratios.length) {
        const name = str.bind(ev)
        scale.value = new Scale(ratios, visitorBaseFrequency, baseMidiNote.value)
        if (autoColors.value === 'silver') {
          colors.value = intervals.map(
            (interval, i) =>
              interval.color?.value ?? (i === intervals.length - 1 ? 'gray' : 'silver')
          )
        } else if (autoColors.value === 'cents') {
          colors.value = intervals.map(
            (interval) => interval.color?.value ?? centsColor(interval).value
          )
        } else {
          colors.value = intervals.map(
            (interval) => interval.color?.value ?? factorColor(interval).value
          )
        }
        labels.value = intervals.map((interval) => interval.label || name(interval))
        error.value = ''
      } else {
        scale.value = new Scale(TET12, visitorBaseFrequency, baseMidiNote.value)
        colors.value = defaultColors(baseMidiNote.value)
        labels.value = defaultLabels(baseMidiNote.value, accidentalPreference.value)
        error.value = 'Empty scale defaults to 12-tone equal temperament.'
      }
    } catch (e) {
      if (e instanceof Error) {
        error.value = e.message
      } else if (typeof e === 'string') {
        error.value = e
      }
    }
  }

  function getFrequency(index: number) {
    if (index >= 0 && index < frequencies.value.length) {
      return frequencies.value[index]
    } else {
      // Support more than 128 notes with some additional computational cost
      return scale.value.getFrequency(index)
    }
  }

  return {
    // Live state
    name,
    baseMidiNote,
    enharmonics,
    enharmonic,
    userBaseFrequency,
    autoFrequency,
    autoColors,
    baseFrequency,
    sourcePrefix,
    sourceText,
    scale,
    relativeIntervals,
    colors,
    labels,
    latticePermutation,
    inverseLatticePermutation,
    latticeIntervals,
    latticeColors,
    latticeLabels,
    error,
    keyboardMode,
    equaveShift,
    degreeShift,
    pianoMode,
    accidentalColor,
    lowAccidentalColor,
    middleAccidentalColor,
    highAccidentalColor,
    // Presistent state
    accidentalPreference,
    hasLeftOfZ,
    // Computed state
    frequencies,
    qwertyMapping,
    splitAccidentals,
    whiteIndices,
    // Methods
    getVisitors,
    computeScale,
    getFrequency,
    colorForIndex,
    labelForIndex
  }
})
