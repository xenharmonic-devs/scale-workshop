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

  return {
    // State
    size,
    labelOffset,
    showLabels,
    valString,
    generator,
    // Computed state
    val,
    modulus,
    generatorPseudoInverse,
    numCycles,
    cycleLength
  }
})
