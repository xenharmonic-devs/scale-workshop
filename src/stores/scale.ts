import { Scale } from '@/scale'
import {
  midiNoteNumberToEnharmonics,
  type AccidentalStyle,
  syncValues,
  isBlackMidiNote,
  midiNoteNumberToName,
  randomId,
  centString,
  decimalString,
  convertAccidentals
} from '@/utils'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { Fraction, mmod, mtof } from 'xen-dev-utils'
import {
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
  builtinNode,
  repr,
  getGlobalVisitor,
  TimeReal,
  upcastBool,
  unaryBroadcast
} from 'sonic-weave'
import {
  APP_TITLE,
  DEFAULT_NUMBER_OF_COMPONENTS,
  INTERVALS_12TET,
  MAX_NUMBER_OF_SHARED_INTERVALS,
  MIDI_NOTE_COLORS,
  MIDI_NOTE_NAMES,
  NUMBER_OF_NOTES,
  TET12
} from '@/constants'
import { pianoMap } from 'isomorphic-qwerty'
import { computeWhiteIndices } from '@/midi'
import { midiKeyInfo } from 'xen-midi'
import { undoHistory } from '@/undo'
import { useHarmonicEntropyStore } from './harmonic-entropy'

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

function harmonicEntropy(this: ExpressionVisitor, interval: SonicWeaveValue): SonicWeaveValue {
  if (typeof interval === 'boolean' || interval instanceof Interval) {
    const hes = useHarmonicEntropyStore()
    const he = hes.entropyPercentage(relative.bind(this)(upcastBool(interval)).totalCents())
    return Interval.fromValue(he)
  }
  const h = harmonicEntropy.bind(this)
  return unaryBroadcast.bind(this)(interval, h)
}
harmonicEntropy.__doc__ =
  'Compute the harmonic entropy as a percentage of the range of observed values.'
harmonicEntropy.__node__ = builtinNode(harmonicEntropy)

export const useScaleStore = defineStore('scale', () => {
  // The scale store should remain unit-test friendly so this state needs to be here as well
  const centsFractionDigits = ref(parseInt(localStorage.getItem('centsFractionDigits') ?? '3', 10))
  const decimalFractionDigits = ref(
    parseInt(localStorage.getItem('decimalFractionDigits') ?? '5', 10)
  )
  // Note that most of these values are debounce-computed due to being expensive.
  // The second party is responsible for debouncing `computeScale`.
  const accidentalPreference = ref<AccidentalStyle>(
    (localStorage.getItem('accidentalPreference') as AccidentalStyle) ?? 'double'
  )
  // Some keyboards like FI have a handy key left of 'Z'
  const hasLeftOfZ = ref(localStorage.getItem('hasLeftOfZ') === 'true')

  // Computational budget to prevent tab hanging.
  const gas = ref(parseInt(localStorage.getItem('gas') ?? '10000', 10))

  // The title the user inputs in the textarea. May be overridden in the source.
  const name = ref('')
  // For the v-model. Consider stores.scale.scale.baseMidiNote the source of truth.
  const baseMidiNote = ref(60)

  // The concept of base frequency is a little confusing so here's an explanation:
  // The user can either set the base frequency or have it be automatically calculated.
  // baseFrequencyDisplay reflects the initial value passed to the SonicWeave runtime.
  // However the runtime may assign a different unison frequency and that's what ends up in scale.value.baseFrequency.
  // Threrefore stores.scale.scale.baseFrequency is the source of truth, while stores.scale.baseFrequencyDisplay is the v-model.
  const userBaseFrequency = ref(261.63)
  const autoFrequency = ref(true)
  const baseFrequencyDisplay = computed({
    get() {
      return autoFrequency.value ? mtof(baseMidiNote.value) : userBaseFrequency.value
    },
    set(value: number) {
      userBaseFrequency.value = value
    }
  })
  // XXX: baseFrequencyDisplay is merely used for convenience here. This is the last time there's a direct connection.
  const scale = ref(new Scale(TET12, baseFrequencyDisplay.value, baseMidiNote.value, name.value))
  const autoColors = ref<'silver' | 'cents' | 'factors'>('silver')
  const sourceText = ref('')
  const relativeIntervals = ref(INTERVALS_12TET)
  const latticeIntervals = ref(INTERVALS_12TET)
  const latticeEquave = ref<Interval | undefined>(undefined)
  const colors = ref(defaultColors(baseMidiNote.value))
  const labels = ref(defaultLabels(baseMidiNote.value, accidentalPreference.value))
  const error = ref('')
  const warning = ref('')

  // Isomorphic offsets don't couple to anything else here, but they're part of the shareable live state.
  const isomorphicVertical = ref(5)
  const isomorphicHorizontal = ref(1)
  // Keyboard mode affects both physical qwerty and virtual keyboards
  const keyboardMode = ref<'isomorphic' | 'piano'>('isomorphic')
  // QWERTY mapping is coupled to equave and degree shifts
  const equaveShift = ref(0)
  const degreeShift = ref(0)
  // QWERTY physical layout mimics a piano layout
  // Asdf: Non-black keys on ASDF-row black keys on QWERTY row
  // QweZxc: Two octaves similar to 'Asdf'
  // Zxc: Generic keys on ZXCV-row, maroon keys on ASDF, navy keys on QWERTY, indigo keys on digits row
  const pianoMode = ref<'Asdf' | 'QweZxc' | 'Zxc'>('Asdf')
  const accidentalColor = ref('black')
  const lowAccidentalColor = ref('maroon')
  const middleAccidentalColor = ref('navy')
  const highAccidentalColor = ref('indigo')

  const id = ref('000000000')
  const uploadedId = ref('000000000')

  // === Computed state ===
  const sourcePrefix = computed(() => {
    const base = `numComponents(${DEFAULT_NUMBER_OF_COMPONENTS})\n`
    const rootPitch = midiNoteNumberToName(baseMidiNote.value)
    if (autoFrequency.value) {
      return `${base}${rootPitch} = mtof(_) = 1/1`
    }
    return `${base}${rootPitch} = baseFrequency = 1/1`
  })

  const frequencies = computed(() => scale.value.getFrequencyRange(0, NUMBER_OF_NOTES))
  const centss = computed(() => scale.value.getCentsRange(0, NUMBER_OF_NOTES))

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
    } else if (pianoMode.value === 'Zxc') {
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
    } else {
      pianoMode.value satisfies never
      throw new Error(`Unknown piano mode ${pianoMode.value}`)
    }
  })

  const splitAccidentals = computed(() => pianoMode.value === 'Zxc')

  // For midi mapping
  const whiteIndices = computed(() => computeWhiteIndices(baseMidiNote.value, colors.value))

  // Offset such that base MIDI note doesn't move in "simple" white mode.
  const whiteModeOffset = computed(() => {
    const baseInfo = midiKeyInfo(baseMidiNote.value)
    if (baseInfo.whiteNumber === undefined) {
      return baseMidiNote.value - baseInfo.sharpOf - 1
    }
    return baseMidiNote.value - baseInfo.whiteNumber
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
  syncValues({
    centsFractionDigits,
    decimalFractionDigits,
    accidentalPreference,
    hasLeftOfZ,
    gas
  })

  // Extra builtins
  function latticeView(this: ExpressionVisitor, equave?: Interval) {
    const scale = this.currentScale
    for (let i = 0; i < scale.length; ++i) {
      scale[i] = scale[i].shallowClone()
      // XXX: Abuses the fact that SonicWeave tracking ids are positive.
      scale[i].trackingIds.add(-i)
    }
    const rel = relative.bind(this)
    latticeIntervals.value = scale.map((i) => rel(i))

    latticeEquave.value = equave
  }
  latticeView.__doc__ =
    'Store the current scale to be displayed in the lattice tab. Optionally with an explicit equave.'
  latticeView.__node__ = builtinNode(latticeView)

  function warn(this: ExpressionVisitor, ...args: any[]) {
    const s = repr.bind(this)
    const message = args.map((a) => (typeof a === 'string' ? a : s(a))).join(', ')
    warning.value = message
  }
  warn.__doc__ = 'Issue a warning to the user and continue execution.'
  warn.__node__ = builtinNode(warn)

  // Local helpers
  function getGlobalScaleWorkshopVisitor() {
    // Inject global variables
    const _ = Interval.fromInteger(baseMidiNote.value)
    const baseFreq = new Interval(
      TimeMonzo.fromFractionalFrequency(new Fraction(baseFrequencyDisplay.value).simplify(1e-8)),
      'linear'
    )
    const extraBuiltins: Record<string, SonicWeaveValue> = {
      APP_TITLE,
      scaleName: name.value,
      _,
      baseMidiNote: _,
      baseFrequency: baseFreq,
      latticeView,
      warn,
      harmonicEntropy
    }
    const visitor = getGlobalVisitor(true, extraBuiltins)
    visitor.rootContext!.gas = gas.value

    // Declare base nominal and unison frequency
    const prefixAst = parseAST(sourcePrefix.value)
    visitor.executeProgram(prefixAst)

    return visitor
  }

  // Methods
  function rerollId() {
    id.value = randomId()
  }

  function getUserScopeVisitor() {
    const globalVisitor = getGlobalScaleWorkshopVisitor()
    const visitor = new StatementVisitor(globalVisitor)
    visitor.isUserRoot = true
    const defaults = visitor.rootContext!.clone()
    defaults.gas = gas.value

    const ast = parseAST(sourceText.value)
    visitor.executeProgram(ast)
    return {
      defaults,
      visitor
    }
  }

  function computeScale(pushUndo = true) {
    try {
      error.value = ''
      warning.value = ''
      latticeIntervals.value = []
      latticeEquave.value = undefined
      const globalVisitor = getGlobalScaleWorkshopVisitor()
      const visitor = new StatementVisitor(globalVisitor)
      visitor.isUserRoot = true
      const ast = parseAST(sourceText.value)
      visitor.executeProgram(ast)
      let userDeclaredPitch = false
      for (const statement of ast.body) {
        if (statement.type === 'PitchDeclaration') {
          userDeclaredPitch = true
          break
        }
      }

      const intervals = visitor.currentScale
      const ev = visitor.createExpressionVisitor()
      const rel = relative.bind(ev)
      relativeIntervals.value = intervals.map((i) => rel(i))
      if (!latticeIntervals.value.length) {
        latticeIntervals.value = relativeIntervals.value
      }
      const ratios = relativeIntervals.value.map((i) => i.value.valueOf())
      let visitorBaseFrequency = mtof(baseMidiNote.value)
      if (visitor.rootContext!.unisonFrequency) {
        visitorBaseFrequency = visitor.rootContext!.unisonFrequency.valueOf()
      }
      if (ratios.length) {
        const evStr = str.bind(ev)
        // eslint-disable-next-line no-inner-declarations
        function autoLabel(interval: Interval) {
          if (interval.label.length) {
            return convertAccidentals(interval.label, accidentalPreference.value)
          }
          const node = interval.node
          if (node) {
            if (
              node.type === 'DecimalLiteral' &&
              node.fractional.length > decimalFractionDigits.value
            ) {
              return decimalString(
                interval.valueOf(),
                decimalFractionDigits.value,
                interval.value instanceof TimeReal
              )
            } else if (
              node.type === 'CentsLiteral' &&
              node.fractional.length > centsFractionDigits.value
            ) {
              return centString(
                interval.totalCents(),
                centsFractionDigits.value,
                interval.value instanceof TimeReal
              )
            }
            return convertAccidentals(evStr(interval), accidentalPreference.value)
          }
          if (interval.domain === 'linear') {
            if (interval.value.isFractional()) {
              return evStr(interval)
            }
            return decimalString(
              interval.valueOf(),
              decimalFractionDigits.value,
              interval.value instanceof TimeReal
            )
          }
          return centString(
            interval.totalCents(),
            centsFractionDigits.value,
            interval.value instanceof TimeReal
          )
        }
        scale.value = new Scale(
          ratios,
          visitorBaseFrequency,
          baseMidiNote.value,
          ev.rootContext!.title || name.value
        )
        if (autoColors.value === 'silver') {
          colors.value = intervals.map(
            (interval, i) =>
              interval.color?.value ?? (i === intervals.length - 1 ? 'gray' : 'silver')
          )
        } else if (autoColors.value === 'cents') {
          colors.value = intervals.map(
            (interval) => interval.color?.value ?? centsColor.bind(ev)(interval).value
          )
        } else {
          colors.value = intervals.map(
            (interval) => interval.color?.value ?? factorColor.bind(ev)(interval).value
          )
        }
        labels.value = intervals.map(autoLabel)
      } else {
        relativeIntervals.value = INTERVALS_12TET
        latticeIntervals.value = INTERVALS_12TET
        scale.value = new Scale(TET12, visitorBaseFrequency, baseMidiNote.value, name.value)
        if (autoColors.value === 'silver') {
          colors.value = defaultColors(baseMidiNote.value)
        } else if (autoColors.value === 'cents') {
          colors.value = INTERVALS_12TET.map(
            (interval) => interval.color?.value ?? centsColor.bind(ev)(interval).value
          )
        } else {
          // XXX: This is just black, but whatever.
          colors.value = INTERVALS_12TET.map(
            (interval) => interval.color?.value ?? factorColor.bind(ev)(interval).value
          )
        }
        labels.value = defaultLabels(baseMidiNote.value, accidentalPreference.value)
        if (!warning.value) {
          warning.value = 'Empty scale defaults to 12-tone equal temperament.'
        }
      }
      const noteNumber = baseMidiNote.value
      if (!warning.value && isBlackMidiNote(noteNumber) && !userDeclaredPitch) {
        const midiName = midiNoteNumberToName(noteNumber)
        const enharmonics = midiNoteNumberToEnharmonics(noteNumber)
        const rootFrequency = autoFrequency.value ? 'mtof(_)' : 'baseFrequency'
        warning.value = `Base MIDI note ${noteNumber} defaults to ${midiName}. Use an explicit ${enharmonics[0]} = ${rootFrequency} or ${enharmonics[1]} = ${rootFrequency} to get rid of this warning.`
      }
      // It's better to use a truthy value for this in case an event is passed to computeScale by accident.
      if (pushUndo) {
        history.pushState()
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

  const LIVE_STATE = {
    name,
    baseMidiNote,
    userBaseFrequency,
    autoFrequency,
    autoColors,
    sourceText,
    scale,
    relativeIntervals,
    latticeIntervals,
    latticeEquave,
    colors,
    labels,
    error,
    warning,
    isomorphicVertical,
    isomorphicHorizontal,
    keyboardMode,
    equaveShift,
    degreeShift,
    pianoMode,
    accidentalColor,
    lowAccidentalColor,
    middleAccidentalColor,
    highAccidentalColor
  }

  let skipNextRerollWatch = false
  watch(Object.values(LIVE_STATE), () => {
    if (skipNextRerollWatch) {
      skipNextRerollWatch = false
      return
    }
    if (uploadedId.value === id.value) {
      rerollId()
    }
  })

  /**
   * Convert live state to a format suitable for storing on the server.
   */
  function toJSON() {
    let slicedScale = scale.value
    let slicedIntervals = relativeIntervals.value
    let slicedColors = colors.value
    let slicedLabels = labels.value
    if (slicedScale.intervalRatios.length > MAX_NUMBER_OF_SHARED_INTERVALS) {
      slicedScale = slicedScale.clone()
      slicedIntervals = [...slicedIntervals]
      slicedColors = [...slicedColors]
      slicedLabels = [...slicedLabels]
      const equave = slicedScale.intervalRatios.pop()!
      const equaveInterval = slicedIntervals.pop()!
      const equaveColor = slicedColors.pop()!
      const equaveLabel = slicedLabels.pop()!
      slicedScale.intervalRatios = slicedScale.intervalRatios.slice(
        0,
        MAX_NUMBER_OF_SHARED_INTERVALS - 1
      )
      slicedScale.intervalRatios.push(equave)
      slicedIntervals = slicedIntervals.slice(0, MAX_NUMBER_OF_SHARED_INTERVALS - 1)
      slicedIntervals.push(equaveInterval)
      slicedColors = slicedColors.slice(0, MAX_NUMBER_OF_SHARED_INTERVALS - 1)
      slicedColors.push(equaveColor)
      slicedLabels = slicedLabels.slice(0, MAX_NUMBER_OF_SHARED_INTERVALS - 1)
      slicedLabels.push(equaveLabel)
    }
    const result: any = {
      scale: slicedScale.toJSON(),
      relativeIntervals: slicedIntervals.map((i) => i.toJSON()),
      colors: slicedColors,
      labels: slicedLabels
    }
    if (result.colors.length) {
      result.colors[result.colors.length - 1] = colors.value[colors.value.length - 1]
    }
    if (result.labels.length) {
      result.labels[result.labels.length - 1] = labels.value[labels.value.length - 1]
    }
    if (relativeIntervals.value === latticeIntervals.value) {
      result.latticeIntervals = null
    } else {
      if (latticeIntervals.value.length <= MAX_NUMBER_OF_SHARED_INTERVALS) {
        result.latticeIntervals = latticeIntervals.value.map((i) => i.toJSON())
      } else {
        // Give up. The lattice would be incomprehensible anyway.
        result.latticeIntervals = null
      }
    }
    for (const [key, value] of Object.entries(LIVE_STATE)) {
      if (key in result) {
        continue
      }
      result[key] = value.value
    }
    return result
  }

  /**
   * Apply revived state to current state.
   * @param data JSON revived through {@link Scale.reviver} and {@link Interval.reviver}.
   */
  function fromJSON(data: any) {
    skipNextRerollWatch = true
    for (const key in LIVE_STATE) {
      if (key === 'latticeIntervals' && !data[key]) {
        latticeIntervals.value = data['relativeIntervals']
      } else {
        LIVE_STATE[key as keyof typeof LIVE_STATE].value = data[key]
      }
    }
    id.value = data['id']
    uploadedId.value = data['id']
  }

  function serialize() {
    // We could store the whole state using toJSON() here, but lets see if sourceText is enough...
    return sourceText.value
  }

  function restore(body: string) {
    // We could restore the whole state using something like this:
    // const data = JSON.parse(body, (key, value) => Interval.reviver(key, Scale.reviver(key, value)))

    sourceText.value = body
    computeScale(false)
  }

  const history = undoHistory(serialize, restore)

  return {
    // Live state
    ...LIVE_STATE,
    id,
    uploadedId,
    // Presistent state
    centsFractionDigits,
    decimalFractionDigits,
    accidentalPreference,
    hasLeftOfZ,
    gas,
    // Computed state
    // With setters
    baseFrequencyDisplay,
    // Get only
    sourcePrefix,
    latticePermutation,
    inverseLatticePermutation,
    latticeColors,
    latticeLabels,
    frequencies,
    centss,
    qwertyMapping,
    splitAccidentals,
    whiteIndices,
    whiteModeOffset,
    // Methods
    rerollId,
    getUserScopeVisitor,
    computeScale,
    getFrequency,
    colorForIndex,
    labelForIndex,
    toJSON,
    fromJSON,
    // Mini-stores
    history
  }
})
