import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import {
  Interval,
  Scale,
  parseLine,
  type IntervalOptions,
  reverseParseScale
} from 'scale-workshop-core'
import { DEFAULT_NUMBER_OF_COMPONENTS, NUMBER_OF_NOTES, UNIX_NEWLINE } from '@/constants'
import { computeWhiteIndices } from '@/midi'
import { mapWhiteAsdfBlackQwerty, mapWhiteQweZxcBlack123Asd } from '@/keyboard-mapping'
import { arraysEqual } from 'xen-dev-utils'
import { type AccidentalStyle, syncValues } from '@/utils'
import { midiKeyInfo } from 'xen-midi'

export const useStateStore = defineStore('state', () => {
  // Nonpersistent state of the application
  const scaleName = ref('')
  const scaleLines = ref<string[]>([])
  const scale = reactive(Scale.fromIntervalArray([parseLine('1/1', DEFAULT_NUMBER_OF_COMPONENTS)]))
  const baseMidiNote = ref(69)
  const keyColors = ref([
    'white',
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
    'black'
  ])
  const isomorphicVertical = ref(5)
  const isomorphicHorizontal = ref(1)
  // Keyboard mode affects both physical qwerty and virtual keyboards
  const keyboardMode = ref<'isomorphic' | 'piano'>('isomorphic')
  // Physical layout mimics a piano layout in one or two layers
  const pianoMode = ref<'Asdf' | 'QweZxc0' | 'QweZxc1'>('Asdf')
  const equaveShift = ref(0)
  const degreeShift = ref(0)
  const heldNotes = reactive(new Map<number, number>())
  const typingActive = ref(true)

  // These user preferences are fetched from local storage.
  const storage = window.localStorage
  const newline = ref(storage.getItem('newline') ?? UNIX_NEWLINE)

  const storedScheme = storage.getItem('colorScheme')
  const mediaScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const colorScheme = ref<'light' | 'dark'>(
    (storedScheme ?? mediaScheme) === 'dark' ? 'dark' : 'light'
  )
  const centsFractionDigits = ref(parseInt(storage.getItem('centsFractionDigits') ?? '3', 10))
  const decimalFractionDigits = ref(parseInt(storage.getItem('decimalFractionDigits') ?? '5', 10))
  const showVirtualQwerty = ref(storage.getItem('showVirtualQwerty') === 'true')
  const midiOctaveOffset = ref(parseInt(storage.getItem('midiOctaveOffset') ?? '-1', 10))
  const showKeyboardLabel = ref(storage.getItem('showKeyboardLabel') !== 'false')
  const showKeyboardCents = ref(storage.getItem('showKeyboardCents') !== 'false')
  const showKeyboardRatio = ref(storage.getItem('showKeyboardRatio') !== 'false')
  const showKeyboardFrequency = ref(storage.getItem('showKeyboardFrequency') !== 'false')

  // Analysis preferences
  const intervalMatrixIndexing = ref(parseInt(storage.getItem('intervalMatrixIndexing') ?? '0', 10))
  const accidentalPreference = ref<AccidentalStyle>(
    (localStorage.getItem('accidentalPreference') as AccidentalStyle) ?? 'double'
  )

  // Special keyboard codes also from local storage.
  const deactivationCode = ref(storage.getItem('deactivationCode') ?? 'Backquote')
  const equaveUpCode = ref(storage.getItem('equaveUpCode') ?? 'NumpadMultiply')
  const equaveDownCode = ref(storage.getItem('equaveDownCode') ?? 'NumpadDivide')
  const degreeUpCode = ref(storage.getItem('degreeUpCode') ?? 'NumpadAdd')
  const degreeDownCode = ref(storage.getItem('degreeDownCode') ?? 'NumpadSubtract')

  // Local storage watchers
  syncValues({
    newline,
    centsFractionDigits,
    decimalFractionDigits,
    showVirtualQwerty,
    showKeyboardLabel,
    showKeyboardCents,
    showKeyboardRatio,
    showKeyboardFrequency,
    intervalMatrixIndexing,
    deactivationCode,
    equaveUpCode,
    equaveDownCode,
    degreeUpCode,
    degreeDownCode
  })

  // === Computed state ===
  const frequencies = computed(() =>
    scale.getFrequencyRange(-baseMidiNote.value, NUMBER_OF_NOTES - baseMidiNote.value)
  )

  const baseIndex = computed(
    () => baseMidiNote.value + equaveShift.value * scale.size + degreeShift.value
  )

  // Offset such that base MIDI note doesn't move in "simple" white mode.
  const whiteModeOffset = computed(() => {
    const baseInfo = midiKeyInfo(baseMidiNote.value)
    if (baseInfo.whiteNumber === undefined) {
      return baseMidiNote.value - baseInfo.sharpOf - 1
    }
    return baseMidiNote.value - baseInfo.whiteNumber
  })

  // For midi mapping
  const whiteIndices = computed(() => computeWhiteIndices(baseMidiNote.value, keyColors.value))

  const keyboardMapping = computed<Map<string, number>>(() => {
    const size = scale.size
    const baseIndex = baseMidiNote.value + equaveShift.value * size + degreeShift.value
    if (pianoMode.value === 'Asdf') {
      return mapWhiteAsdfBlackQwerty(keyColors.value, baseMidiNote.value, baseIndex)
    } else if (pianoMode.value === 'QweZxc0') {
      return mapWhiteQweZxcBlack123Asd(keyColors.value, size, baseMidiNote.value, baseIndex, 0)
    } else {
      return mapWhiteQweZxcBlack123Asd(keyColors.value, size, baseMidiNote.value, baseIndex, 1)
    }
  })

  // === State updates ===
  function updateFromScaleLines(lines: string[]) {
    if (arraysEqual(lines, scaleLines.value)) {
      return
    }
    scaleLines.value = lines
    const intervals: Interval[] = []
    const options: IntervalOptions = {
      centsFractionDigits: centsFractionDigits.value,
      decimalFractionDigits: decimalFractionDigits.value
    }
    lines.forEach((line) => {
      try {
        const interval = parseLine(line, DEFAULT_NUMBER_OF_COMPONENTS, options)
        intervals.push(interval)
      } catch {
        /* empty */
      }
    })
    if (!intervals.length) {
      intervals.push(parseLine('1/1', DEFAULT_NUMBER_OF_COMPONENTS, options))
    }

    const surrogate = Scale.fromIntervalArray(intervals)
    scale.intervals = surrogate.intervals
    scale.equave = surrogate.equave
  }

  function updateFromScale(surrogate: Scale) {
    scale.intervals = surrogate.intervals
    scale.equave = surrogate.equave
    scaleLines.value = reverseParseScale(scale)
  }

  // Computed wrappers to avoid triggering a watcher loop.
  const scaleWrapper = computed({
    get() {
      return scale
    },
    set: updateFromScale
  })

  const scaleLinesWrapper = computed({
    get() {
      return scaleLines.value
    },
    set: updateFromScaleLines
  })

  // Local storage watchers
  watch(newline, (newValue) => window.localStorage.setItem('newline', newValue))
  watch(
    colorScheme,
    (newValue) => {
      window.localStorage.setItem('colorScheme', newValue)
      document.documentElement.setAttribute('data-theme', newValue)
    },
    { immediate: true }
  )
  watch(centsFractionDigits, (newValue) =>
    window.localStorage.setItem('centsFractionDigits', newValue.toString())
  )
  watch(decimalFractionDigits, (newValue) =>
    window.localStorage.setItem('decimalFractionDigits', newValue.toString())
  )
  watch(showVirtualQwerty, (newValue) =>
    window.localStorage.setItem('showVirtualQwerty', newValue.toString())
  )
  watch(midiOctaveOffset, (newValue) =>
    window.localStorage.setItem('midiOctaveOffset', newValue.toString())
  )
  watch(intervalMatrixIndexing, (newValue) =>
    window.localStorage.setItem('intervalMatrixIndexing', newValue.toString())
  )
  watch(accidentalPreference, (newValue) => localStorage.setItem('accidentalPreference', newValue))
  // Store keymaps
  watch(deactivationCode, (newValue) => window.localStorage.setItem('deactivationCode', newValue))
  watch(equaveUpCode, (newValue) => window.localStorage.setItem('equaveUpCode', newValue))
  watch(equaveDownCode, (newValue) => window.localStorage.setItem('equaveDownCode', newValue))
  watch(degreeUpCode, (newValue) => window.localStorage.setItem('degreeUpCode', newValue))
  watch(degreeDownCode, (newValue) => window.localStorage.setItem('degreeDownCode', newValue))

  // Sanity watchers
  watch(baseMidiNote, (newValue) => {
    if (isNaN(newValue)) {
      baseMidiNote.value = 69
    } else if (Math.round(newValue) != newValue) {
      baseMidiNote.value = Math.round(newValue)
    }
  })

  // Methods
  function getFrequency(index: number) {
    if (index >= 0 && index < frequencies.value.length) {
      return frequencies.value[index]
    } else {
      // Support more than 128 notes with some additional computational cost
      return scale.getFrequency(index - baseMidiNote.value)
    }
  }

  return {
    // Live state
    scaleName,
    scaleLinesRaw: scaleLines,
    scaleLines: scaleLinesWrapper,
    scaleRaw: scale,
    scale: scaleWrapper,
    baseMidiNote,
    keyColors,
    isomorphicVertical,
    isomorphicHorizontal,
    keyboardMode,
    pianoMode,
    equaveShift,
    degreeShift,
    heldNotes,
    typingActive,
    // Persistent state
    newline,
    colorScheme,
    centsFractionDigits,
    decimalFractionDigits,
    showVirtualQwerty,
    midiOctaveOffset,
    showKeyboardLabel,
    showKeyboardCents,
    showKeyboardRatio,
    showKeyboardFrequency,
    intervalMatrixIndexing,
    deactivationCode,
    equaveUpCode,
    equaveDownCode,
    degreeUpCode,
    degreeDownCode,
    accidentalPreference,
    // Computed state
    frequencies,
    baseIndex,
    whiteModeOffset,
    whiteIndices,
    keyboardMapping,
    // Methods
    getFrequency
  }
})
