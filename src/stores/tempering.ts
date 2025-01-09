import { FIFTH, OCTAVE } from '@/constants'
// import { mosPatternsRank2FromCommas, mosPatternsRank2FromVals } from '@/tempering'
import { computedAndError, padEndOrTruncate, splitText } from '@/utils'
import { isBright, mosPatterns as getMosPatterns } from 'moment-of-symmetry'
import { defineStore } from 'pinia'
import {
  type OptimizationScheme,
  Temperament,
  parseChord,
  parseVals,
  rank2FromCommas,
  temperamentFromVals,
  temperamentFromCommas,
  parseBasis,
  Val
} from 'sonic-weave'
// import { Subgroup, resolveMonzo, type TuningOptions } from 'temperaments'
import { computed, ref, watch, reactive, type ComputedRef } from 'vue'

const CTE_MEANTONE = new Temperament(
  [
    [1, 0, -4],
    [0, 1, 4]
  ],
  undefined,
  [5000],
  true
)
const PATENT_12 = Val.fromArray([
  12, 19, 28, 34, 42, 44, 49, 51, 54, 58, 59, 63, 64, 65, 67, 69, 71, 71, 73, 74, 74, 76, 77, 78, 79
])

function makeState<T>(defaultMethod: T, rank2 = false) {
  const method = ref<T>(defaultMethod)
  // method: "vals", "commas"
  const subgroupString = ref('')
  const optimizationScheme = ref<OptimizationScheme>('CTE')
  const showAdvanced = ref(false)
  const weightsString = ref('')
  // method: "vals"
  const valsString = ref('')
  // method: "commas"
  const commasString = ref('')

  // === Computed state ===
  const subgroupWeights = computed(() =>
    splitText(weightsString.value)
      .map((w) => parseFloat(w))
      .filter((w) => !isNaN(w))
  )
  let valsTemperament: ComputedRef<Temperament>
  let valsError: ComputedRef<string>
  let commasTemperament: ComputedRef<Temperament>
  let commasError: ComputedRef<string>
  if (rank2) {
    ;[valsTemperament, valsError] = computedAndError(() => {
      const result = temperamentFromVals(
        valsString.value,
        subgroupString.value,
        optimizationScheme.value,
        subgroupWeights.value
      )
      if (result.rank !== 2) {
        throw new Error(`The given vals and subgroup define a rank ${result.rank} temperament`)
      }
      return result
    }, CTE_MEANTONE) as any
    ;[commasTemperament, commasError] = computedAndError(
      () =>
        rank2FromCommas(
          commasString.value,
          subgroupString.value,
          optimizationScheme.value,
          subgroupWeights.value
        ),
      CTE_MEANTONE
    ) as any
  } else {
    ;[valsTemperament, valsError] = computedAndError(
      () =>
        temperamentFromVals(
          valsString.value,
          subgroupString.value,
          optimizationScheme.value,
          subgroupWeights.value
        ),
      CTE_MEANTONE
    ) as any
    ;[commasTemperament, commasError] = computedAndError(
      () =>
        temperamentFromCommas(
          commasString.value,
          subgroupString.value,
          optimizationScheme.value,
          subgroupWeights.value
        ),
      CTE_MEANTONE
    ) as any
  }
  const temperament = computed(() =>
    method.value === 'vals' ? valsTemperament.value : commasTemperament.value
  )
  const subgroupLabel = computed(() => temperament.value.basis.toString().slice(1))
  const error = computed(() => (method.value === 'vals' ? valsError.value : commasError.value))
  return {
    method,
    subgroupString,
    optimizationScheme,
    showAdvanced,
    weightsString,
    valsString,
    commasString,
    subgroupWeights,
    valsTemperament,
    valsError,
    commasTemperament,
    commasError,
    temperament,
    subgroupLabel,
    error
  }
}

export const useRank2Store = defineStore('rank2', () => {
  const MAX_SIZE_UNIT = 100
  const MAX_LENGTH_UNIT = 10

  // === Component state ===
  const state = makeState<'generator' | 'vals' | 'commas' | 'circle'>('generator', true)
  const method = state.method
  // method: "generator"
  const generator = ref(FIFTH)
  const generatorString = ref('')
  const period = ref(OCTAVE)
  const periodString = ref('2/1')
  const size = ref(7)
  const up = ref(5)
  const numPeriods = ref(1)
  // method: "circle"
  const periodStretch = ref('0')
  const generatorFineCents = ref('0')
  // MOS pattern buttons / more
  const mosPatternAmount = ref(1)
  // Footer preview
  const previewMosPattern = ref('')
  // State for key colors
  const colorMethod = ref<'none' | 'gaps'>('none')
  const colorAccidentals = ref<'flat' | 'sharp'>('sharp')

  // === Computed state ===
  const generatorPerPeriod = computed(() => {
    const p = period.value.totalCents()
    if (!p) {
      return 0
    }
    return generator.value.totalCents() / p
  })
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
    const m = mosPatternAmount.value
    const maxSize = m * MAX_SIZE_UNIT
    const maxLength = m * MAX_LENGTH_UNIT
    if (method.value === 'generator') {
      // Don't show error in the default configuration
      if (!generatorString.value.length) {
        return []
      }
      return getMosPatterns(generatorPerPeriod.value, safeNumPeriods.value, maxSize, maxLength)
    } else if (method.value === 'vals') {
      // TODO: Interactivity guards using MAX_INTERACTIVE_SUBGROUP_SIZE.
      const temp = state.valsTemperament.value
      const [period, gen] = temp.generators
      return getMosPatterns(gen / period, Math.abs(temp.numberOfPeriods), maxSize, maxLength)
    } else if (method.value === 'commas') {
      // TODO: Interactivity guards using MAX_INTERACTIVE_SUBGROUP_SIZE.
      const temp = state.commasTemperament.value
      const [period, gen] = temp.generators
      return getMosPatterns(gen / period, Math.abs(temp.numberOfPeriods), maxSize, maxLength)
    } else {
      return []
    }
  }, [])

  const morePatterns = computed(() => {
    const m = mosPatternAmount.value
    const maxSize = m * MAX_SIZE_UNIT
    const maxLength = m * MAX_LENGTH_UNIT
    if (mosPatterns.value.length >= maxLength) {
      return mosPatterns.value[mosPatterns.value.length - 1].size + 1
    }
    return maxSize + 1
  })

  const error = computed(() => mosPatternsError.value || state.error.value)

  const circlePeriodCents = computed(() => {
    const p = period.value.totalCents()
    if (!p || isNaN(p)) {
      return 0.0001
    }
    const stretch = parseFloat(periodStretch.value)
    if (isNaN(stretch)) {
      return p
    }
    return p * Math.exp(stretch)
  })

  const circleGeneratorCents = computed(() => {
    const g = generator.value.totalCents()
    if (isNaN(g)) {
      return 0
    }
    const fine = parseFloat(generatorFineCents.value)
    if (isNaN(fine)) {
      return g
    }
    return g + fine
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

  watch([generatorPerPeriod, numPeriods, state.valsTemperament, state.commasTemperament], () => {
    mosPatternAmount.value = 1
  })

  return {
    ...state,
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
    mosPatternAmount,
    previewMosPattern,
    colorMethod,
    colorAccidentals,
    down,
    upMax,
    generatorPerPeriod,
    opposite,
    mosPatterns,
    mosPatternsError,
    morePatterns,
    circlePeriodCents,
    circleGeneratorCents,
    generatorsPerPeriod,
    safeSize,
    safeUp
  }
})

export const useLatticeStore = defineStore('lattice', () => {
  const state = makeState<'generators' | 'vals' | 'commas'>('generators')
  // method: "generators"
  const basisString = ref('')
  const ups = reactive<number[]>([])
  const downs = reactive<number[]>([])
  const equaveString = ref('2/1')
  const equave = ref(OCTAVE)
  // method: "vals", "commas"
  const comment = ref('vals = 12 & 19')

  const [basis, basisError] = computedAndError(() => {
    return parseChord(basisString.value)
  }, [])

  watch(basis, (newValue) => {
    padEndOrTruncate(ups, newValue.length, 1)
    padEndOrTruncate(downs, newValue.length, 0)
  })

  const dimensions = computed(() => {
    const result: number[] = []
    for (let i = 0; i < basis.value.length; ++i) {
      result.push(1 + ups[i] + downs[i])
    }
    return result
  })

  return {
    ...state,
    basisString,
    ups,
    downs,
    equaveString,
    equave,
    basis,
    basisError,
    dimensions,
    comment
  }
})

export const useTemperStore = defineStore('temper', () => {
  // === Component state ===
  const state = makeState<'mapping' | 'vals' | 'commas'>('mapping')
  const mappingString = ref('1200., 1897.2143, 2788.8573')
  const convertToEdoSteps = ref(false)
  const edoAvailable = computed(() => state.valsTemperament.value.rank === 1)
  const [vals] = computedAndError(
    () => parseVals(state.valsString.value, parseBasis(state.subgroupString.value)),
    [PATENT_12]
  )

  return {
    ...state,
    mappingString,
    convertToEdoSteps,
    edoAvailable,
    vals
  }
})
