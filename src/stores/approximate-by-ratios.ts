import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { Fraction, PRIMES, clamp, primeLimit as getPrimeLimit } from 'xen-dev-utils'

export const useApproximateByRatiosStore = defineStore('approximate-by-ratios', () => {
  const degree = ref(1)
  const approximationIndex = ref(0)
  const maxError = ref(20)
  const method = ref<'convergents' | 'odd' | 'prime'>('convergents')
  const includeSemiconvergents = ref(true)
  const includeNonMonotonic = ref(false)
  const oddLimit = ref(9)
  const primeLimit = ref(7)
  const maxExponent = ref(2)

  const safeOddLimit = computed(() => clamp(3, 101, 2 * Math.floor(oddLimit.value / 2) + 1))
  const safePrimeLimit = computed(() => {
    const value = primeLimit.value
    if (value < 3) {
      return 3
    }
    if (value < 5) {
      return 3
    }
    if (value < 7) {
      return 5
    }
    if (value < 11) {
      return 7
    }
    if (value < 13) {
      return 11
    }
    if (value < 17) {
      return 13
    }
    if (value < 19) {
      return 17
    }
    if (value < 23) {
      return 19
    }
    if (value < 29) {
      return 23
    }
    if (value > 29) {
      return 29
    }
    return 3
  })
  const safeMaxExponent = computed(() => {
    let maxSafe = 8
    if (safePrimeLimit.value > 7) {
      maxSafe = 6
    }
    if (safePrimeLimit.value > 13) {
      maxSafe = 3
    }
    if (safePrimeLimit.value >= 29) {
      maxSafe = 2
    }
    return clamp(1, maxSafe, maxExponent.value)
  })

  // Make the number input skip to the next prime when incremented
  function modifyPrimeLimit(event: Event) {
    const oldValue = primeLimit.value
    const newValue = parseInt((event.target as HTMLInputElement).value)
    if (isNaN(newValue)) {
      return
    }
    if (PRIMES.includes(newValue)) {
      primeLimit.value = newValue
      return
    }
    const index = PRIMES.indexOf(primeLimit.value)
    if (newValue < oldValue && index > 1) {
      primeLimit.value = PRIMES[index - 1]
      return
    }
    if (newValue > oldValue && index < PRIMES.length - 1) {
      primeLimit.value = PRIMES[index + 1]
      return
    }
  }

  function primeLimitString(fraction: Fraction) {
    const limit = getPrimeLimit(fraction, false, 97)
    if (limit < Infinity) {
      return `${limit}-limit`
    }
    return '>97-limit'
  }

  function initialize() {
    degree.value = 1
    approximationIndex.value = 0
  }

  return {
    degree,
    approximationIndex,
    maxError,
    method,
    includeSemiconvergents,
    includeNonMonotonic,
    oddLimit,
    primeLimit,
    maxExponent,
    safeOddLimit,
    safePrimeLimit,
    safeMaxExponent,
    modifyPrimeLimit,
    primeLimitString,
    initialize
  }
})
