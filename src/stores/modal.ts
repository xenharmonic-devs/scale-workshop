import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { FIFTH, FIFTH_12TET, OCTAVE, THIRD } from '@/constants'
import { computedAndError, parseChordInput, splitText } from '@/utils'
import { clamp, gcd } from 'xen-dev-utils'
import {
  anyForEdo,
  makeEdoMap,
  tamnamsInfo,
  type MosScaleInfo,
  modeInfo,
  getHardness,
  allForEdo
} from 'moment-of-symmetry'
import { type IntervalType } from 'scale-workshop-core'

export const useModalStore = defineStore('modal', () => {
  // Generic
  const equaveString = ref('2/1')
  const equave = ref(OCTAVE)

  // CPS / Cross-polytype
  const factorsString = ref('')
  const addUnity = ref(false)
  const [factors, factorsError] = computedAndError(() => {
    return parseChordInput(factorsString.value)
  }, [])

  // Dwarf / Euler genus
  const integerEquave = ref(2)

  // Harmonics / Subharmonics
  const lowInteger = ref(8)
  const highInteger = ref(16)

  // CPS
  const numElements = ref(2)
  const maxElements = computed(() => Math.max(1, factors.value.length))

  // Dwarf
  const val = ref(12)

  // Enumerate chord
  const chord = ref('')
  const invertChord = ref(false)

  // Equal temperament
  const divisions = ref(5)
  const jumpsString = ref('1 1 1 1 1')
  const degreesString = ref('1 2 3 4 5')
  const singleStepOnly = computed(
    () => divisions.value !== Math.round(divisions.value) || divisions.value < 1
  )
  const safeScaleSize = computed(() => Math.round(clamp(1, 1024, divisions.value)))
  const jumps = computed(() => splitText(jumpsString.value).map((token) => parseInt(token, 10)))
  const degrees = computed(() => splitText(degreesString.value).map((token) => parseInt(token, 10)))

  function updateFromDivisions() {
    if (singleStepOnly.value) {
      jumpsString.value = ''
      degreesString.value = ''
    } else {
      jumpsString.value = Array(safeScaleSize.value).fill('1').join(' ')
      degreesString.value = [...Array(safeScaleSize.value).keys()]
        .map((k) => (k + 1).toString())
        .join(' ')
    }
  }

  function updateFromJumps() {
    if (jumps.value.includes(NaN)) {
      return
    }
    const degrees_: string[] = []
    let degree = 0
    jumps.value.forEach((jump) => {
      degree += jump
      degrees_.push(degree.toString())
    })
    divisions.value = degree
    degreesString.value = degrees_.join(' ')
  }

  function updateFromDegrees() {
    if (degrees.value.includes(NaN)) {
      return
    }
    const jumps_: string[] = []
    let previous = 0
    degrees.value.forEach((degree) => {
      jumps_.push((degree - previous).toString())
      previous = degree
    })
    divisions.value = previous
    jumpsString.value = jumps_.join(' ')
  }

  // Euler genus
  const guideTone = ref(45)

  // === MOS ===
  // State required to generate MOS
  const numberOfLargeSteps = ref(5)
  const numberOfSmallSteps = ref(2)
  const sizeOfLargeStep = ref(2)
  const sizeOfSmallStep = ref(1)
  const up = ref(5)
  // State for key colors
  const colorMethod = ref<'none' | 'parent' | 'daughter'>('none')
  const colorAccidentals = ref<'flat' | 'sharp'>('sharp')
  // State to help select MOS parameters
  const method = ref<'direct' | 'pyramid' | 'edo'>('pyramid')
  const edo = ref(12)
  const previewL = ref(0)
  const previewS = ref(0)
  // == Computed state ==
  // Sanity enforcement
  const safeNumLarge = computed(() => clamp(1, 1000, Math.round(numberOfLargeSteps.value)))
  const safeNumSmall = computed(() => clamp(1, 1000, Math.round(numberOfSmallSteps.value)))
  const safeSizeLarge = computed(() => Math.round(sizeOfLargeStep.value))
  const safeSizeSmall = computed(() => Math.round(sizeOfSmallStep.value))
  const boundedEdo = computed(() => {
    const value = edo.value
    if (isNaN(value) || !isFinite(value)) {
      return 12
    }
    if (value < 2) {
      return 2
    }
    return Math.round(value)
  })
  // Derived sanity
  const numberOfPeriods = computed(() => Math.abs(gcd(safeNumLarge.value, safeNumSmall.value)))
  const upMax = computed(() => safeNumLarge.value + safeNumSmall.value - numberOfPeriods.value)
  const safeUp = computed(() =>
    Math.min(Math.floor(up.value / numberOfPeriods.value) * numberOfPeriods.value, upMax.value)
  )
  // Selections
  const edoMap = computed(() => makeEdoMap())
  const edoExtraMap = reactive<Map<number, MosScaleInfo[]>>(new Map())
  const edoList = computed(() => {
    const edo_ = boundedEdo.value
    if (!edoMap.value.has(edo_)) {
      return [anyForEdo(edo_)].concat(edoExtraMap.get(edo_) || [])
    }
    return edoMap.value.get(edo_)!.concat(edoExtraMap.get(edo_) || [])
  })
  // Additional information
  const tamnamsName = computed(() => {
    const info = tamnamsInfo(safeNumLarge.value, safeNumSmall.value)
    if (info?.name === undefined) {
      return ''
    }
    return info.name.split(';')[0]
  })
  const mosModeInfo = computed(() =>
    modeInfo(safeNumLarge.value, safeNumSmall.value, safeUp.value, true)
  )
  // Derived state
  const hardness = computed(() => getHardness(safeSizeLarge.value, safeSizeSmall.value))
  const hostEd = computed(
    () => safeNumLarge.value * safeSizeLarge.value + safeNumSmall.value * safeSizeSmall.value
  )
  const ed = computed(() => {
    if (equave.value.equals(OCTAVE)) {
      return `${hostEd.value}EDO`
    }
    return `${hostEd.value}ED${equaveString.value}`
  })
  const previewName = computed(() => {
    const info = tamnamsInfo(previewL.value, previewS.value)
    if (info?.name === undefined) {
      return ''
    }
    return info.name
  })
  // Watchers
  watch(numberOfPeriods, (newValue) => {
    up.value = Math.floor(up.value / newValue) * newValue
  })
  watch(upMax, (newValue) => {
    up.value = Math.min(up.value, newValue)
  })
  // Methods
  function moreForEdo() {
    const edo_ = boundedEdo.value
    const existing = edoList.value
    const extra = allForEdo(edo_, 5, 12, 5)
    const more = []
    for (const info of extra) {
      let novel = true
      for (const old of existing) {
        if (
          info.mosPattern === old.mosPattern &&
          info.sizeOfLargeStep === old.sizeOfLargeStep &&
          info.sizeOfSmallStep === old.sizeOfSmallStep
        ) {
          novel = false
          break
        }
      }
      if (novel) {
        more.push(info)
      }
    }
    edoExtraMap.set(edo_, more)
  }

  // Approximate by harmonics/subharmonics
  const largeInteger = ref(128)

  // Convert type
  const type = ref<IntervalType>('cents')
  const preferredNumerator = ref<number>(0)
  const preferredDenominator = ref<number>(0)
  const preferredEtDenominator = ref<number>(0)
  const preferredEtEquaveNumerator = ref<number>(0)
  const preferredEtEquaveDenominator = ref<number>(1)

  // Equalize
  const largeDivisions = ref(22)

  // Merge offset
  const offset = ref(THIRD)
  const offsetString = ref('')
  // Overflow = "none" is too similar to "reduce" to be included in the UI.
  const overflowType = ref<'none' | 'intuitive' | 'filter' | 'reduce'>('filter')

  // Random variance
  const varianceAmount = ref(10)
  const varyEquave = ref(false)

  // Rotate scale
  const newUnison = ref(1)

  // Stretch
  const stretchAmount = ref(1.005)

  const referenceString = ref('')
  const reference = ref(FIFTH_12TET)

  const targetString = ref('')
  const target = ref(FIFTH)

  function calculateStretchAmount() {
    const calculated = target.value.totalCents() / reference.value.totalCents()
    if (calculated >= 0.001 && calculated <= 999.999) {
      stretchAmount.value = calculated
    }
  }

  const selected = reactive<Set<number>>(new Set())

  function toggleSelected(index: number) {
    if (selected.has(index)) {
      selected.delete(index)
    } else {
      selected.add(index)
    }
  }

  function initialize(size: number) {
    newUnison.value = clamp(newUnison.value, 1, size - 1)
    selected.clear()
    selected.add(0)
    for (let i = 1; i < size; ++i) {
      selected.add(i)
    }
  }

  return {
    // Generic
    equaveString,
    equave,

    // CPS / Cross-polytype
    factorsString,
    addUnity,
    factors,
    factorsError,

    // Dwarf / Euler genus
    integerEquave,

    // Harmonics / Subharmonics
    lowInteger,
    highInteger,

    // CPS
    numElements,
    maxElements,

    // Dwarf
    val,

    // Enumerate chord
    chord,
    invertChord,

    // Equal temperament
    divisions,
    jumpsString,
    degreesString,
    singleStepOnly,
    safeScaleSize,
    jumps,
    degrees,
    updateFromDivisions,
    updateFromJumps,
    updateFromDegrees,

    // Euler genus
    guideTone,

    // MOS
    numberOfLargeSteps,
    numberOfSmallSteps,
    sizeOfLargeStep,
    sizeOfSmallStep,
    up,
    colorMethod,
    colorAccidentals,
    method,
    edo,
    previewL,
    previewS,
    safeNumLarge,
    safeNumSmall,
    safeSizeLarge,
    safeSizeSmall,
    boundedEdo,
    numberOfPeriods,
    upMax,
    safeUp,
    edoMap,
    edoExtraMap,
    edoList,
    tamnamsName,
    mosModeInfo,
    hardness,
    hostEd,
    ed,
    previewName,
    moreForEdo,

    // Approximate by harmonics/subharmonics
    largeInteger,

    // Convert type
    type,
    preferredNumerator,
    preferredDenominator,
    preferredEtDenominator,
    preferredEtEquaveNumerator,
    preferredEtEquaveDenominator,

    // Equalize
    largeDivisions,

    // Merge offset
    offset,
    offsetString,
    overflowType,

    // Random variance
    varianceAmount,
    varyEquave,

    // Rotate
    newUnison,

    // Stretch
    stretchAmount,
    reference,
    referenceString,
    target,
    targetString,
    calculateStretchAmount,

    // Subset
    selected,
    toggleSelected,
    initialize
  }
})
