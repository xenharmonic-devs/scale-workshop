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
import { computed, reactive, ref, watch } from 'vue'
import { Fraction, mmod, mtof } from 'xen-dev-utils'
import {
  parseAST,
  relative,
  Interval,
  TimeMonzo,
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
  unaryBroadcast,
  lstr,
  RootContext,
  intervalValueAs
} from 'sonic-weave'
import { version } from '../../package.json'
import {
  APP_TITLE,
  DEFAULT_NUMBER_OF_COMPONENTS,
  INTERVALS_12TET,
  MAX_NUMBER_OF_SHARED_INTERVALS,
  MIDI_NOTE_COLORS,
  MIDI_NOTE_NAMES,
  NUMBER_OF_NOTES
} from '@/constants'
import { pianoMap } from 'isomorphic-qwerty'
import { computeWhiteIndices } from '@/midi'
import { midiKeyInfo } from 'xen-midi'
import { undoHistory } from '@/undo'
import { useHarmonicEntropyStore } from './harmonic-entropy'

const AUTO_LABEL_MAX_LENGTH = 20
const MAX_ERROR_LENGTH = 10000
const EPSILON = 1e-6

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
    const he = hes.entropyPercentage(relative.bind(this.rootContext)(upcastBool(interval)).totalCents())
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
  // Therefore stores.scale.scale.baseFrequency is the source of truth, while stores.scale.baseFrequencyDisplay is the v-model.
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
  // == Label mode ==
  // * periodic: Classic behavior where labels are repeated like colors are.
  // * computed: Labels are computed by adding equaves to the original intervals as appropriate.
  // * EasyScore: Compute VexFlow compatible source code for staff notation. (yet to be implemented)
  const labelMode = ref<'periodic' | 'computed' | 'EasyScore'>('computed')  // TODO: add UI components
  const simplifyLabels = ref(true)
  const labelCache = reactive(new Map<number, string>())

  // Maintaining and serializing the root context allows us to manipulate the scale intervals without expensive re-evaluation of the source text.
  const context = ref(new RootContext())
  // Evaluating the source text results in an array of Interval instances. Empty array triggers 12-TET defaults.
  const intervals = ref<Interval[]>([])

  const autoColors = ref<'silver' | 'cents' | 'factors'>('silver')
  const sourceText = ref('')
  const latticeIntervals = ref(INTERVALS_12TET)
  const latticeEquave = ref<Interval | undefined>(undefined)
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

  const relativeIntervals = computed(() => {
    if (!intervals.value.length) {
      return INTERVALS_12TET
    }
    // XXX: VSCode has some serious issues with Vue's TypeScript here
    const rel = relative.bind(context.value as RootContext)
    return intervals.value.map((i) => rel(i))
  })

  const scale = computed(() => {
    let visitorBaseFrequency = mtof(baseMidiNote.value)
    if (context.value.unisonFrequency) {
      visitorBaseFrequency = context.value.unisonFrequency.valueOf()
    }
    const ratios = relativeIntervals.value.map((i) => i.value.valueOf())
    return new Scale(
      ratios,
      visitorBaseFrequency,
      baseMidiNote.value,
      context.value.title || name.value
    )
  })

  const frequencies = computed(() => scale.value.getFrequencyRange(0, NUMBER_OF_NOTES))
  const centss = computed(() => scale.value.getCentsRange(0, NUMBER_OF_NOTES))

  const colors = computed(() => {
    const ctx = context.value as RootContext
    const ints = intervals.value
    if (autoColors.value === 'silver') {
      if (!ints.length) {
        return defaultColors(baseMidiNote.value)
      }
      return ints.map(
        (interval, i) =>
          interval.color?.value ?? (i === intervals.value.length - 1 ? 'gray' : 'silver')
      )
    } else if (autoColors.value === 'cents') {
      if (!ints.length) {
        return relativeIntervals.value.map((interval) => centsColor.bind(ctx)(interval).value)
      }
      return intervals.value.map(
        (interval) => interval.color?.value ?? centsColor.bind(ctx)(interval).value
      )
    } else {
      if (!ints.length) {
        // XXX: This is just black, but whatever.
        return relativeIntervals.value.map((interval) => factorColor.bind(ctx)(interval).value)
      }
      return intervals.value.map(
        (interval) => interval.color?.value ?? factorColor.bind(ctx)(interval).value
      )
    }
  })

  function autoLabel(interval: Interval) {
    if (interval.label.length) {
      return convertAccidentals(interval.label, accidentalPreference.value)
    }
    interval = interval.shallowClone()
    interval.node = interval.realizeNode(context.value as RootContext)
    if (
      !interval.node &&
      interval.value instanceof TimeReal &&
      !interval.value.timeExponent
    ) {
      let result = ''
      if (interval.domain === 'linear') {
        result = decimalString(interval.valueOf(), decimalFractionDigits.value, true)
      } else {
        result = centString(interval.totalCents(), centsFractionDigits.value, true)
      }
      if (result.length <= AUTO_LABEL_MAX_LENGTH) {
        return result
      }
    }
    return convertAccidentals(
      lstr.bind(context.value as RootContext)(interval, AUTO_LABEL_MAX_LENGTH),
      accidentalPreference.value
    )
  }

  const labels = computed(() => {
    if (!intervals.value.length) {
      return defaultLabels(baseMidiNote.value, accidentalPreference.value)
    }
    return intervals.value.map(autoLabel)
  })

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
    if (labelMode.value === 'periodic' || !intervals.value.length) {
      return labels.value[mmod(index - baseMidiNote.value - 1, labels.value.length)]
    } else if (labelMode.value === 'computed') {
      if (labelCache.has(index)) {
        return labelCache.get(index)!
      }
      const len = intervals.value.length
      let idx = index - baseMidiNote.value - 1
      const numEquaves = Math.floor(idx / len)
      idx -= numEquaves * len
      const equave = relative.bind(context.value as RootContext)(intervals.value[len - 1]).value
      const interval = intervals.value[idx]
      const monzo = interval.value.mul(equave.pow(numEquaves))
      const node = intervalValueAs(monzo, interval.node, simplifyLabels.value)
      const label = autoLabel(new Interval(monzo, interval.domain, interval.steps, node, interval))
      labelCache.set(index, label)
      return label
    } else {
      throw new Error('Unimplemented label mode')
    }
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

  const nameOfEquave = computed(() => {
    const ratio = scale.value.equaveRatio
    // Biased compared to cents, but who cares.
    if (Math.abs(ratio - 2) < EPSILON) {
      return 'octave'
    } else if (Math.abs(ratio - 3) < EPSILON) {
      return 'tritave'
    } else if (Math.abs(ratio - 4) < EPSILON) {
      return 'tetrave'
    } else if (Math.abs(ratio - 5) < EPSILON) {
      return 'pentave'
    }
    return 'equave'
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
    const rel = relative.bind(this.rootContext)
    latticeIntervals.value = scale.map((i) => rel(i))

    latticeEquave.value = equave
  }
  latticeView.__doc__ =
    'Store the current scale to be displayed in the lattice tab. Optionally with an explicit equave.'
  latticeView.__node__ = builtinNode(latticeView)

  function warn(this: ExpressionVisitor, ...args: any[]) {
    const s = repr.bind(this.rootContext)
    const message = args.map((a) => (typeof a === 'string' ? a : s(a))).join(', ')
    warning.value = message.slice(0, MAX_ERROR_LENGTH)
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
      labelCache.clear()
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

      intervals.value = visitor.currentScale
      if (!visitor.rootContext) {
        throw new Error('Missing root context')
      }
      context.value = visitor.rootContext
      if (!latticeIntervals.value.length) {
        latticeIntervals.value = relativeIntervals.value
      }
      if (!intervals.value.length) {
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
        error.value = e.message.slice(0, MAX_ERROR_LENGTH)
      } else if (typeof e === 'string') {
        error.value = e.slice(0, MAX_ERROR_LENGTH)
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
    context: (context as any),  // XXX: VSCode chokes on the actual type
    intervals,
    name,
    baseMidiNote,
    userBaseFrequency,
    autoFrequency,
    autoColors,
    sourceText,
    latticeIntervals,
    latticeEquave,
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
    let slicedIntervals = intervals.value
    if (slicedIntervals.length > MAX_NUMBER_OF_SHARED_INTERVALS) {
      slicedIntervals = [...slicedIntervals]
      const equaveInterval = slicedIntervals.pop()!
      slicedIntervals = slicedIntervals.slice(0, MAX_NUMBER_OF_SHARED_INTERVALS - 1)
      slicedIntervals.push(equaveInterval)
    }
    const result: any = {
      intervals: slicedIntervals.map((i) => i.toJSON()),
      version,  // Version tag is new with dynamic labels
    }
    let latticeUntouched = true
    for (let i = 0; i < relativeIntervals.value.length; ++i) {
      if (!latticeIntervals.value[i].strictEquals(relativeIntervals.value[i])) {
        latticeUntouched = false
        break
      }
    }
    if (latticeUntouched) {
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
   * @param data JSON revived through {@link RootContext.reviver} and {@link Interval.reviver}.
   */
  function fromJSON(data: any) {
    skipNextRerollWatch = true
    if (data.version) {
      // Context available
      for (const key in LIVE_STATE) {
        if (key === 'latticeIntervals' && !data[key]) {
          latticeIntervals.value = data['intervals'].map(relative.bind(data['context']))
        } else {
          LIVE_STATE[key as keyof typeof LIVE_STATE].value = data[key]
        }
      }
    } else {
      // Context not available. Do a "best effort" recovery without re-evaluation.
      // XXX: The need for this branch could be eliminated with a data migration on the server.
      for (const key in LIVE_STATE) {
        if (key === 'context') {
          context.value = new RootContext()
          continue
        } else if (key === 'intervals') {
          // TODO: Trigger recomputation if labelMode is changed
          intervals.value = data['relativeIntervals']
          continue
        }

        if (key === 'latticeIntervals' && !data[key]) {
          latticeIntervals.value = data['relativeIntervals']
        } else {
          LIVE_STATE[key as keyof typeof LIVE_STATE].value = data[key]
        }
      }
    }
    id.value = data['id']
    uploadedId.value = data['id']
    history.pushState()
    history.truncate()
  }

  function serialize() {
    // We could store the whole state using toJSON() here, but lets see if sourceText is enough...
    return sourceText.value
  }

  function restore(body: string) {
    // We could restore the whole state using something like this:
    // const data = JSON.parse(body, (key, value) => Interval.reviver(key, RootContext.reviver(key, value)))

    sourceText.value = body
    computeScale(false)
  }

  const history = undoHistory(serialize, restore)

  // Only one exporter makes use of this so we don't maintain it in active memory.
  function computeRawScale() {
    const globalVisitor = getGlobalScaleWorkshopVisitor()
    const visitor = new StatementVisitor(globalVisitor)
    visitor.isUserRoot = true
    const ast = parseAST(sourceText.value)
    visitor.executeProgram(ast)
    return {
      rawIntervals: visitor.currentScale,
      unisonFrequency: visitor.rootContext!.unisonFrequency
    }
  }

  return {
    // Live state
    ...LIVE_STATE,
    id,
    uploadedId,
    // Persistent state
    centsFractionDigits,
    decimalFractionDigits,
    accidentalPreference,
    hasLeftOfZ,
    gas,
    // Computed state
    // With setters
    baseFrequencyDisplay,
    // Get only
    relativeIntervals,
    scale,
    colors,
    labels,
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
    nameOfEquave,
    // Methods
    rerollId,
    getUserScopeVisitor,
    computeScale,
    getFrequency,
    colorForIndex,
    labelForIndex,
    toJSON,
    fromJSON,
    computeRawScale,
    // Mini-stores
    history,
    // Internals (don't access)
    labelCache
  }
})
