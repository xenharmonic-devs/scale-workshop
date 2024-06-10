import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { mmod, modInv } from 'xen-dev-utils'
import { parseVal } from '@/utils'

export const useCyclesStore = defineStore('edo-cycles', () => {
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

  /**
   * Convert live state to a format suitable for storing on the server.
   */
  function toJSON() {
    const result: any = {}
    for (const [key, value] of Object.entries(LIVE_STATE)) {
      result[key] = value.value
    }
    return result
  }

  /**
   * Apply revived state to current state.
   * @param data JSON data as an Object instance.
   */
  function fromJSON(data: any) {
    for (const key in LIVE_STATE) {
      LIVE_STATE[key as keyof typeof LIVE_STATE].value = data[key]
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
