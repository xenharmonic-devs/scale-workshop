import { modInv } from 'xen-dev-utils/core'
import { computed, ref, watch, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { mmod } from 'xen-dev-utils/fraction'
import { useSessionIdStore } from './session-id'
import { parseVal } from '@/utils'

/**
 * Store for EDO cycle diagram parameters and derived cycle math.
 */
export const useCyclesStore = defineStore('edo-cycles', () => {
  const { invalidateUploadedId } = useSessionIdStore()

  // View
  const size = ref(0.15)
  const labelOffset = ref(2)
  const showLabels = ref(true)

  // Elements
  const valString = ref('12p')
  const generator = ref(7)

  const val = computed(() => parseVal(valString.value))

  const modulus = computed(() => val.value.divisions.round().valueOf())
  const generatorPseudoInverse = computed(() => modInv(generator.value, modulus.value, false))
  const numCycles = computed(
    () => mmod(generator.value * generatorPseudoInverse.value, modulus.value) || 1
  )
  const cycleLength = computed(() => modulus.value / numCycles.value)

  const LIVE_STATE = {
    size,
    labelOffset,
    showLabels,
    valString,
    generator
  }
  type SerializedCyclesStore = {
    size: number
    labelOffset: number
    showLabels: boolean
    valString: string
    generator: number
  }

  watch(Object.values(LIVE_STATE), () => {
    invalidateUploadedId()
  })

  /**
   * Convert live state to a format suitable for storing on the server.
   */
  function toJSON(): SerializedCyclesStore {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(LIVE_STATE)) {
      result[key] = value.value
    }
    return result as SerializedCyclesStore
  }

  /**
   * Apply revived state to current state.
   * @param data JSON data as an Object instance.
   */
  function fromJSON(data: Partial<SerializedCyclesStore>) {
    for (const stateKey of Object.keys(LIVE_STATE)) {
      const value = data[stateKey as keyof SerializedCyclesStore]
      if (value !== undefined) {
        ;(LIVE_STATE as Record<string, Ref<unknown>>)[stateKey].value = value
      }
    }
  }

  return {
    // State
    ...LIVE_STATE,
    // Computed state
    val,
    modulus,
    generatorPseudoInverse,
    numCycles,
    cycleLength,
    // Methods
    toJSON,
    fromJSON
  }
})
