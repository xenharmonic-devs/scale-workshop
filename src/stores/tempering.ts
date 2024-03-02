import { FIFTH, MAX_GEO_SUBGROUP_SIZE, MAX_INTERACTIVE_SUBGROUP_SIZE, OCTAVE } from '@/constants'
import { mosPatternsRank2FromCommas, mosPatternsRank2FromVals } from '@/tempering'
import { computedAndError, splitText } from '@/utils'
import { isBright, mosPatterns as getMosPatterns, type MosInfo } from 'moment-of-symmetry'
import { defineStore } from 'pinia'
import { parseChord, parseVals, type TimeMonzo } from 'sonic-weave'
import { Subgroup, resolveMonzo, type TuningOptions } from 'temperaments'
import { computed, ref, watch, type Ref, reactive } from 'vue'
import { add } from 'xen-dev-utils'

// Split text into (non-time) monzos
function splitCommas(text: string) {
  return parseChord(text).map((interval) =>
    interval.value.toIntegerMonzo()
  )
}

// The modals have subtly different semantics so we make copies of this state for each
function makeState(method: Ref, subgroupStringDefault = '') {
  // === Component state ===
  // method: "vals"
  const valsString = ref('')
  // medhod: "commas"
  const commasString = ref('')
  // Generic
  const subgroupString = ref(subgroupStringDefault)
  // Advanced
  const weightsString = ref('')
  const tempering = ref<'TE' | 'POTE' | 'CTE'>('CTE')
  const constraintsString = ref('')

  // === Computed state ===

  const [vals, valsError] = computedAndError(() => parseVals(valsString.value, subgroupString.value), [])

  const [commas, commasError] = computedAndError(() => splitCommas(commasString.value), [])

  const subgroupDefault = new Subgroup(subgroupStringDefault || [])
  const [subgroup, subgroupError] = computedAndError(() => {
    const value = subgroupString.value.trim()

    if (!value.length) {
      if (method.value === 'commas') {
        return Subgroup.inferPrimeSubgroup(commas.value)
      }
      return new Subgroup([])
    }

    if (value.includes('.')) {
      return new Subgroup(value)
    }
    return new Subgroup(parseInt(value))
  }, subgroupDefault)

  const weights = computed(() => {
    const value = splitText(weightsString.value).map((weight) => parseFloat(weight))
    if (value.length) {
      return value
    }
    return undefined
  })

  const constraints = computed(() => splitText(constraintsString.value))

  const baseOptions: TuningOptions = {
    primeMapping: true,
    units: 'cents',
  };

  const options = computed<TuningOptions>(() => {
    if (tempering.value === 'CTE') {
      return {
        ...baseOptions,
        temperEquaves: true,
        constraints: constraints.value,
        weights: weights.value
      }
    } else if (tempering.value === 'TE') {
      return {
        ...baseOptions,
        temperEquaves: true,
        weights: weights.value
      }
    } else {
      return {
        ...baseOptions,
        weights: weights.value
      }
    }
  })

  // === Watchers ===
  // Enforce CTE pure equaves unless the user interferes
  watch(subgroup, (newValue, oldValue) => {
    if (
      !constraintsString.value.length ||
      (oldValue.basis.length && constraintsString.value === oldValue.basis[0].toFraction())
    ) {
      if (!newValue.basis.length) {
        constraintsString.value = ''
      } else {
        constraintsString.value = newValue.basis[0].toFraction()
      }
    }
  })

  return {
    valsString,
    commasString,
    subgroupString,
    subgroupError,
    weightsString,
    tempering,
    constraintsString,
    vals,
    valsError,
    commas,
    commasError,
    subgroup,
    weights,
    options
  }
}

export const useRank2Store = defineStore('rank2', () => {
  const MAX_SIZE = 128
  const MAX_LENGTH = 12

  // === Component state ===
  const method = ref<'generator' | 'vals' | 'commas' | 'circle'>('generator')
  const error = ref('')
  const state = makeState(method)
  // method: "generator"
  const generator = ref(FIFTH)
  const generatorString = ref('')
  const period = ref(OCTAVE)
  const periodString = ref('2/1')
  // method: "generator"
  const size = ref(7)
  const up = ref(5)
  const numPeriods = ref(1)
  // method: "circle"
  const periodStretch = ref('0')
  const generatorFineCents = ref('0')
  // Advanced
  const showAdvanced = ref(false)
  // Footer preview
  const previewMosPattern = ref('')
  // Values that are expensive to compute
  const expensiveMosPatterns = ref<MosInfo[]>([])
  // State for key colors
  const colorMethod = ref<'none' | 'gaps'>('none')
  const colorAccidentals = ref<'flat' | 'sharp'>('sharp')

  const vals = state.vals
  const commas = state.commas
  const subgroup = state.subgroup
  const options = state.options
  const subgroupString = state.subgroupString

  // === Computed state ===
  const generatorPerPeriod = computed(
    () => generator.value.totalCents() / period.value.totalCents()
  )
  const safeNumPeriods = computed(() => {
    const value = Math.abs(parseInt(numPeriods.value as unknown as string, 10))
    if (isNaN(value)) {
      return 1
    }
    return value || 1
  })
  const opposite = computed(() =>
    isBright(generatorPerPeriod.value, safeSize.value / safeNumPeriods.value) ? 'dark' : 'bright'
  )

  const [mosPatterns, mosPatternsError] = computedAndError(() => {
    if (method.value === 'generator') {
      // Don't show error in the default configuration
      if (!generatorString.value.length) {
        return []
      }
      return getMosPatterns(generatorPerPeriod.value, safeNumPeriods.value, MAX_SIZE, MAX_LENGTH)
    } else if (method.value === 'vals') {
      // Don't show error in the default configuration
      if (!vals.value.length || !subgroupString.value.length) {
        return []
      }
      // Huge subgroups get too expensive to evaluate interactively
      if (subgroup.value.basis.length > MAX_INTERACTIVE_SUBGROUP_SIZE) {
        return expensiveMosPatterns.value
      }
      return mosPatternsRank2FromVals(
        vals.value,
        subgroup.value,
        MAX_SIZE,
        MAX_LENGTH,
        options.value
      )
    } else if (method.value === 'commas') {
      // Don't show error in the default configuration
      if (!commas.value.length) {
        return []
      }
      // Huge subgroups get too expensive to evaluate interactively
      if (subgroup.value.basis.length > MAX_INTERACTIVE_SUBGROUP_SIZE) {
        return expensiveMosPatterns.value
      }
      return mosPatternsRank2FromCommas(
        commas.value,
        subgroup.value,
        MAX_SIZE,
        MAX_LENGTH,
        options.value
      )
    } else {
      return expensiveMosPatterns.value
    }
  }, [])

  const circlePeriodCents = computed(() => {
    const stretch = parseFloat(periodStretch.value)
    if (isNaN(stretch)) {
      return period.value.totalCents()
    }
    return period.value.totalCents() * Math.exp(stretch)
  })

  const circleGeneratorCents = computed(() => {
    const fine = parseFloat(generatorFineCents.value)
    if (isNaN(fine)) {
      return generator.value.totalCents()
    }
    return generator.value.totalCents() + fine
  })

  const safeSize = computed(
    () => Math.round(size.value / safeNumPeriods.value) * safeNumPeriods.value
  )
  const safeUp = computed(() => Math.round(up.value / safeNumPeriods.value) * safeNumPeriods.value)
  const upMax = computed(() => safeSize.value - safeNumPeriods.value)
  const down = computed(() => upMax.value - safeUp.value)

  const generatorsPerPeriod = computed({
    get: () => safeSize.value / safeNumPeriods.value,
    set: (newValue) => {
      const oldDown = down.value
      size.value = newValue * safeNumPeriods.value
      // Attempt to preserve "down" rather than "up".
      // It makes more sense that circle generators are appended in the positive direction.
      up.value = Math.max(0, upMax.value - oldDown)
    }
  })

  // === Watchers ===

  // Force scale size and generator stack to align with the multi-MOS
  watch(numPeriods, (newValue) => {
    newValue = Math.round(newValue)
    if (newValue > 1) {
      size.value = Math.round(size.value / newValue) * newValue
      up.value = Math.round(up.value / newValue) * newValue
    }
  })

  watch(upMax, (newValue) => {
    up.value = Math.min(up.value, newValue)
  })

  watch(generator, () => (error.value = ''))
  watch(period, () => (error.value = ''))

  watch([vals, commas, subgroup, options], () => (expensiveMosPatterns.value = []))

  watch([periodStretch, generatorFineCents], () => (expensiveMosPatterns.value = []))

  // === Methods ===

  function calculateExpensiveMosPattern() {
    try {
      if (method.value === 'generator') {
        expensiveMosPatterns.value = getMosPatterns(
          generator.value.totalCents() / period.value.totalCents(),
          safeNumPeriods.value,
          MAX_SIZE,
          MAX_LENGTH
        )
      } else if (method.value === 'vals') {
        if (!subgroupString.value.length) {
          throw new Error('A subgroup must be given with vals')
        }
        expensiveMosPatterns.value = mosPatternsRank2FromVals(
          vals.value,
          subgroup.value,
          MAX_SIZE,
          MAX_LENGTH,
          options.value
        )
      } else if (method.value === 'commas') {
        expensiveMosPatterns.value = mosPatternsRank2FromCommas(
          commas.value,
          subgroup.value,
          MAX_SIZE,
          MAX_LENGTH,
          options.value
        )
      } else {
        // Please note that the button to initiate this calculation is not included in the UI due to lack of screen space.
        // The functionality is retained in case we ever tweak the UI.
        expensiveMosPatterns.value = getMosPatterns(
          circleGeneratorCents.value / circlePeriodCents.value,
          safeNumPeriods.value,
          MAX_SIZE,
          MAX_LENGTH
        )
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
        return
      }
      alert(error)
    }
  }

  return {
    ...state,
    method,
    error,
    generator,
    generatorString,
    period,
    periodString,
    size,
    up,
    numPeriods,
    safeNumPeriods,
    periodStretch,
    generatorFineCents,
    showAdvanced,
    previewMosPattern,
    expensiveMosPatterns,
    colorMethod,
    colorAccidentals,
    down,
    upMax,
    generatorPerPeriod,
    opposite,
    mosPatterns,
    mosPatternsError,
    circlePeriodCents,
    circleGeneratorCents,
    generatorsPerPeriod,
    safeSize,
    safeUp,
    calculateExpensiveMosPattern
  }
})

export const useLatticeStore = defineStore('lattice', () => {
  const method = ref<'generators' | 'vals' | 'commas'>('generators')
  const state = makeState(method)
  // method: "generators"
  const basisString = ref('')
  const ups = reactive<number[]>([])
  const downs = reactive<number[]>([])
  const equaveString = ref('2/1')
  const equave = ref(OCTAVE)
  const showAdvanced = ref(false)

  const [basis, basisError] = computedAndError(() => {
    return parseChord(basisString.value)
  }, [])

  watch(basis, () => {
    while (ups.length < basis.value.length) {
      ups.push(1)
    }
    while (downs.length < basis.value.length) {
      downs.push(0)
    }
  })

  const dimensions = computed(() => {
    const result: number[] = [];
    for (let i = 0; i < basis.value.length; ++i) {
      result.push(1 + ups[i] + downs[i]);
    }
    return result;
  })

  return {
    ...state,
    method,
    basisString,
    ups,
    downs,
    equaveString,
    equave,
    showAdvanced,
    basis,
    basisError,
    dimensions,
  }
})

export const useTemperStore = defineStore('temper', () => {
  // === Component state ===
  const method = ref<'mapping' | 'vals' | 'commas'>('mapping')
  const error = ref('')
  const state = makeState(method)
  // method: "mapping"
  const mappingString = ref('1200., 1897.2143, 2788.8573')
  // method: "vals"
  const convertToEdoSteps = ref(false)
  // Advanced
  const showAdvanced = ref(false)

  // === Computed state ===
  const vals = state.vals
  const subgroup = state.subgroup
  const edoAvailable = computed(() => vals.value.length === 1)

  const constraintsAvailable = computed(() => subgroup.value.basis.length <= MAX_GEO_SUBGROUP_SIZE)

  // === Methods ===

  // Expand out the residual in the `ExtendedMonzo` and ignore cents offsets
  function toLongMonzo(monzo: TimeMonzo) {
    const base = resolveMonzo(monzo.residual)
    return add(
      base,
      monzo.toIntegerMonzo()
    )
  }

  return {
    ...state,
    method,
    error,
    mappingString,
    convertToEdoSteps,
    showAdvanced,
    edoAvailable,
    constraintsAvailable,
    toLongMonzo
  }
})
