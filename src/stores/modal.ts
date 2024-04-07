import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { CS_EDO, CS_VAL, FIFTH, FIFTH_12TET, OCTAVE } from '@/constants'
import { computedAndError, splitText } from '@/utils'
import { Fraction, clamp, falsifyConstantStructure, gcd, mmod } from 'xen-dev-utils'
import {
  anyForEdo,
  makeEdoMap,
  tamnamsInfo,
  modeInfo,
  getHardness,
  allForEdo
} from 'moment-of-symmetry'
import { TimeMonzo, evaluateExpression, hasConstantStructure, parseChord } from 'sonic-weave'
import { freeVAOs, vao } from '@/analysis'

function scaleGet(monzos: TimeMonzo[], index: number) {
  const equave = monzos[monzos.length - 1]
  const numEquaves = Math.floor(index / monzos.length)
  return monzos[mmod(index, monzos.length)].mul(equave.pow(numEquaves))
}

export const useModalStore = defineStore('modal', () => {
  // Generic
  const equaveString = ref('2/1')
  const equave = ref(OCTAVE)

  // CPS
  const factorsString = ref('')
  const addUnity = ref(false)
  const [factors, factorsError] = computedAndError(() => {
    return parseChord(factorsString.value)
  }, [])
  const numElements = ref(2)
  const maxElements = computed(() => Math.max(1, factors.value.length))

  // Harmonics / Subharmonics
  const lowInteger = ref(8)
  const highInteger = ref(16)

  // Enumerate chord
  const chord = ref('')
  const retrovertChord = ref(false)
  const chordIntervals = computed(() => parseChord(chord.value))

  // Equal temperament
  const divisions = ref(5)
  const simpleEd = ref(true)
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
      simpleEd.value = true
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
    simpleEd.value = false
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
    simpleEd.value = false
    divisions.value = previous
    jumpsString.value = jumps_.join(' ')
  }

  // Euler genus
  const integerEquave = ref(2)
  const guideTone = ref(45)
  const rootTone = ref(3)

  watch(rootTone, (newValue, oldValue) => {
    let redo = newValue < 1 || newValue > guideTone.value
    newValue = clamp(1, guideTone.value, newValue)
    const step = oldValue < newValue ? 1 : -1
    while (guideTone.value % newValue) {
      newValue += step
      redo = true
    }
    if (redo) {
      rootTone.value = newValue
    }
  })

  watch(guideTone, (newValue) => {
    if (newValue % rootTone.value) {
      rootTone.value = rootTone.value - 1
    }
  })

  // Generator sequence
  const periodString = ref('2/1')
  const period = ref(OCTAVE)
  const numPeriods = ref(1)
  const size = ref(5)
  const generatorsString = ref('')
  const [generators, generatorsError] = computedAndError(() => {
    let source = generatorsString.value
    // Enumerated chords mean something different in the context of GS
    if (source.includes(':')) {
      source = 'geodiff(' + source + ')'
    }
    return parseChord(source)
  }, [])
  const constantStructureSizes = reactive<number[]>([])
  // These sizes are per period.
  const maxSizeComputed = ref(2)
  function computeConstantStructureSizes(maxSize: number) {
    if (isNaN(numPeriods.value)) {
      return
    }
    if (maxSize <= maxSizeComputed.value) {
      return
    }
    const p = period.value.value
    if (p.timeExponent.n) {
      return
    }
    const monzos = generators.value.map((g) => g.value)
    if (!monzos.length) {
      return
    }
    let usePrecheck = p.equals(OCTAVE.value)
    for (const monzo of monzos) {
      if (monzo.timeExponent.n) {
        return
      }
      if (!monzo.isFractional()) {
        usePrecheck = false
      }
    }
    const scale: TimeMonzo[] = [p]
    let accumulator = new TimeMonzo(new Fraction(0), [])
    for (let j = 0; j < maxSizeComputed.value; ++j) {
      accumulator = accumulator.mul(monzos[mmod(j, monzos.length)])
      scale.push(accumulator.reduce(p, true))
    }
    // A JI scale has CS if a tempered version has it. (but not vice versa)
    if (usePrecheck) {
      const gens = monzos.map((m) => m.dot(CS_VAL).valueOf())
      const steps: number[] = [CS_EDO]
      let stepAccumulator = 0
      for (let j = 0; j < maxSizeComputed.value; ++j) {
        stepAccumulator += gens[mmod(j, gens.length)]
        steps.push(mmod(stepAccumulator, CS_EDO) || CS_EDO)
      }
      for (let i = maxSizeComputed.value; i < maxSize; ++i) {
        accumulator = accumulator.mul(monzos[mmod(i, monzos.length)])
        scale.push(accumulator.reduce(p, true))
        stepAccumulator += gens[mmod(i, gens.length)]
        steps.push(mmod(stepAccumulator, CS_EDO) || CS_EDO)
        steps.sort((a, b) => a - b)
        const indices = falsifyConstantStructure(steps)
        if (indices) {
          scale.sort((a, b) => a.compare(b))
          const [[i1, i2], [j1, j2]] = indices
          // Check the given counter-example. Do the full check if it wasn't valid in JI.
          if (
            !scaleGet(scale, i2)
              .div(scaleGet(scale, i1))
              .equals(scaleGet(scale, j2).div(scaleGet(scale, j1))) &&
            hasConstantStructure(scale)
          ) {
            constantStructureSizes.push(scale.length * numPeriods.value)
          }
        } else {
          constantStructureSizes.push(scale.length * numPeriods.value)
        }
      }
    } else {
      for (let i = maxSizeComputed.value; i < maxSize; ++i) {
        accumulator = accumulator.mul(monzos[mmod(i, monzos.length)])
        scale.push(accumulator.reduce(p, true))
        scale.sort((a, b) => a.compare(b))
        if (hasConstantStructure(scale)) {
          // These sizes are for the full scale.
          constantStructureSizes.push(scale.length * numPeriods.value)
        }
      }
    }
    maxSizeComputed.value = maxSize
  }
  watch([generators, period, numPeriods], () => {
    maxSizeComputed.value = 2
    constantStructureSizes.length = 0
  })
  watch(size, (newValue) => {
    newValue = parseInt(newValue as unknown as string, 10)
    if (isNaN(newValue) || isNaN(numPeriods.value)) {
      return
    }
    if (newValue % numPeriods.value) {
      size.value = Math.ceil(newValue / numPeriods.value) * numPeriods.value
    }
    if (newValue < 1) {
      size.value = 1
    }
  })
  watch(numPeriods, (newValue) => {
    newValue = parseInt(newValue as unknown as string, 10)
    if (isNaN(newValue) || isNaN(size.value)) {
      return
    }
    size.value = Math.ceil(size.value / newValue) * newValue
  })

  // === MOS ===
  // State required to generate MOS
  const numberOfLargeSteps = ref(5)
  const numberOfSmallSteps = ref(2)
  const sizeOfLargeStep = ref(2)
  const sizeOfSmallStep = ref(1)
  const up = ref(5)
  // State for key colors
  const colorMethod = ref<'none' | 'parent' | 'daughter'>('none')
  const parentColorAccidentals = ref<'flat' | 'sharp'>('sharp')
  const daughterColorAccidentals = ref<'flat' | 'sharp' | 'both' | 'all'>('sharp')
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
  const edoMap = reactive(makeEdoMap())
  const minSize = ref(5)
  const maxSize = ref(12)
  const maxHardness = ref(5)
  const edoList = computed(() => {
    const edo_ = boundedEdo.value
    if (edoMap.has(edo_)) {
      return edoMap.get(edo_)!
    }
    return [anyForEdo(edo_)]
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
    modeInfo(safeNumLarge.value, safeNumSmall.value, { up: safeUp.value, extraNames: true })
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
  watch(minSize, (newValue) => {
    maxSize.value = Math.max(maxSize.value, newValue)
  })
  // Methods
  function sortByHardness() {
    const edo_ = boundedEdo.value
    const patterns = edoMap.get(edo_) ?? [anyForEdo(edo_)]
    patterns.sort(
      (a, b) =>
        a.sizeOfLargeStep * b.sizeOfSmallStep - b.sizeOfLargeStep * a.sizeOfSmallStep ||
        a.numberOfLargeSteps - b.numberOfLargeSteps
    )
    edoMap.set(edo_, patterns)
  }
  function sortBySize() {
    const edo_ = boundedEdo.value
    const patterns = edoMap.get(edo_) ?? [anyForEdo(edo_)]
    patterns.sort(
      (a, b) =>
        a.numberOfLargeSteps + a.numberOfSmallSteps - b.numberOfLargeSteps - b.numberOfSmallSteps ||
        a.numberOfLargeSteps - b.numberOfLargeSteps
    )
    edoMap.set(edo_, patterns)
  }
  function moreForEdo() {
    const edo_ = boundedEdo.value
    edoMap.set(
      edo_,
      allForEdo(edo_, minSize.value, Math.min(edo_, maxSize.value), maxHardness.value)
    )
  }

  // Approximate by harmonics/subharmonics
  const largeInteger = ref(128)

  // Convert type
  const type = ref<
    'decimal' | 'fraction' | 'radical' | 'cents' | 'FJS' | 'absoluteFJS' | 'nedji' | 'monzo'
  >('cents')
  const fractionTolerance = ref<number>(0)
  const preferredNumerator = ref<number>(0)
  const preferredDenominator = ref<number>(0)
  const preferredEtNumerator = ref<number>(0)
  const preferredEtDenominator = ref<number>(0)
  const preferredEtEquaveNumerator = ref<number>(0)
  const preferredEtEquaveDenominator = ref<number>(0)

  // Equalize
  const largeDivisions = ref(22)

  // Merge offset
  const overflowType = ref<'keep' | 'drop' | 'wrap'>('drop')
  const offsetsString = ref('')
  const [offsets, offsetsError] = computedAndError(() => {
    const source = offsetsString.value
    // Enumerated chords are literal in the context of polyoffsets
    if (source.includes(':')) {
      return evaluateExpression(source)
    }
    return parseChord(source)
  }, [])

  // Random variance
  const varianceAmount = ref(10)
  const varyEquave = ref(false)

  // Repeat scale
  const numRepeats = ref(2)

  // Rotate scale
  const newUnison = ref(0)

  // Stretch
  const stretchAmount = ref(1.005)

  const referenceString = ref('')
  const reference = ref(FIFTH_12TET)

  const targetString = ref('')
  const target = ref(FIFTH)

  function calculateStretchAmount() {
    const calculated = target.value.value.totalCents() / reference.value.value.totalCents()
    if (calculated >= 0.001 && calculated <= 999.999) {
      stretchAmount.value = calculated
    }
  }

  // Subset
  const selected = reactive<Set<number>>(new Set())

  function toggleSelected(index: number) {
    if (selected.has(index)) {
      selected.delete(index)
    } else {
      selected.add(index)
    }
  }

  function initialize(size: number) {
    newUnison.value = clamp(0, size - 1, newUnison.value)
    selected.clear()
    selected.add(0)
    for (let i = 1; i < size; ++i) {
      selected.add(i)
    }
  }

  // Coalesce
  const tolerance = ref(3.5)
  const coalescingAction = ref<'avg' | 'havg' | 'geoavg' | 'lowest' | 'highest' | 'simplest'>(
    'simplest'
  )

  // Concordance shell
  const mediumInteger = ref(32)
  const errorModel = ref<'rooted' | 'free'>('rooted')
  const vaoIndex = ref(0)
  const vaos = computed(() => {
    if (errorModel.value === 'rooted') {
      return [
        vao(
          mediumInteger.value,
          largeInteger.value,
          largeDivisions.value,
          tolerance.value,
          equave.value.totalCents()
        )
      ]
    }
    return freeVAOs(
      mediumInteger.value,
      largeInteger.value,
      largeDivisions.value,
      tolerance.value,
      equave.value.totalCents()
    )
  })

  watch([mediumInteger, largeInteger, largeDivisions, tolerance, equave, errorModel], () => {
    vaoIndex.value = 0
  })

  // Expand
  const simplify = ref(false)
  const bleach = ref(false)

  return {
    // Generic
    equaveString,
    equave,

    // CPS
    factorsString,
    addUnity,
    factors,
    factorsError,
    numElements,
    maxElements,

    // Euler genus
    integerEquave,

    // Harmonics / Subharmonics
    lowInteger,
    highInteger,

    // Enumerate chord
    chord,
    retrovertChord,
    chordIntervals,

    // Equal temperament
    divisions,
    jumpsString,
    degreesString,
    singleStepOnly,
    safeScaleSize,
    jumps,
    degrees,
    simpleEd,
    updateFromDivisions,
    updateFromJumps,
    updateFromDegrees,

    // Euler genus
    guideTone,
    rootTone,

    // Generator sequence
    periodString,
    period,
    numPeriods,
    size,
    generatorsString,
    generators,
    generatorsError,
    constantStructureSizes,
    maxSizeComputed,
    computeConstantStructureSizes,

    // MOS
    numberOfLargeSteps,
    numberOfSmallSteps,
    sizeOfLargeStep,
    sizeOfSmallStep,
    up,
    colorMethod,
    parentColorAccidentals,
    daughterColorAccidentals,
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
    minSize,
    maxSize,
    maxHardness,
    edoList,
    tamnamsName,
    mosModeInfo,
    hardness,
    hostEd,
    ed,
    previewName,
    sortByHardness,
    sortBySize,
    moreForEdo,

    // Concordance shell
    mediumInteger,
    vaoIndex,
    vaos,
    errorModel,

    // Approximate by harmonics/subharmonics
    largeInteger,

    // Convert type
    type,
    fractionTolerance,
    preferredNumerator,
    preferredDenominator,
    preferredEtNumerator,
    preferredEtDenominator,
    preferredEtEquaveNumerator,
    preferredEtEquaveDenominator,

    // Equalize
    largeDivisions,

    // Merge offset
    offsets,
    offsetsString,
    offsetsError,
    overflowType,

    // Random variance
    varianceAmount,
    varyEquave,

    // Repeat
    numRepeats,

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
    initialize,

    // Coalesce
    tolerance,
    coalescingAction,

    // Expand
    simplify,
    bleach
  }
})
