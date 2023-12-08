<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import {
  approximateOddLimitWithErrors,
  approximatePrimeLimitWithErrors,
  clamp,
  Fraction,
  getConvergents,
  primeLimit as getPrimeLimit,
  PRIMES,
  valueToCents
} from 'xen-dev-utils'
import { DEFAULT_NUMBER_OF_COMPONENTS } from '@/constants'
import { fractionToString, ExtendedMonzo, Interval, type Scale } from 'scale-workshop-core'

const MAX_LENGTH = 128

const props = defineProps<{
  show: boolean
  scale: Scale
}>()
const emit = defineEmits(['update:scale', 'cancel'])
const degree = ref(1)
const approximationIndex = ref(0)
const approximationSelect = ref<HTMLSelectElement | null>(null)
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
  const limit = getPrimeLimit(fraction, 97)
  if (limit < Infinity) {
    return `${limit}-limit`
  }
  return '>97-limit'
}

type Approximation = {
  fraction: Fraction
  error: number
  limit: string
}

const approximationsWithErrorsAndLimits = computed<Approximation[]>(() => {
  // #185: Watched properties are evaluated when the component is loaded.
  // This guard prevents computing approximations on a hidden modal.
  if (!props.show) {
    return []
  }
  const selected = props.scale.getMonzo(degree.value)
  const selectedCents = selected.totalCents()
  if (method.value === 'convergents') {
    const approximations = getConvergents(
      selected.valueOf(),
      undefined,
      2 * MAX_LENGTH, // Extra length buffer
      includeSemiconvergents.value,
      includeNonMonotonic.value
    )
    const result: Approximation[] = []
    approximations.forEach((fraction) => {
      const error = Math.abs(selectedCents - valueToCents(fraction.valueOf()))
      if (error <= maxError.value) {
        const limit = primeLimitString(fraction)
        result.push({ fraction, error, limit })
      }
    })
    return result.slice(0, MAX_LENGTH)
  } else if (method.value === 'odd') {
    const approximationsAndErrors = approximateOddLimitWithErrors(selectedCents, safeOddLimit.value)
    const result: Approximation[] = []
    approximationsAndErrors.forEach(([fraction, error]) => {
      if (error <= maxError.value) {
        const limit = primeLimitString(fraction)
        result.push({ fraction, error, limit })
      }
    })
    if (!result.length) {
      const [fraction, error] = approximationsAndErrors[0]
      return [{ fraction, error, limit: primeLimitString(fraction) }]
    }
    return result.slice(0, MAX_LENGTH)
  }
  const approximationsAndErrors = approximatePrimeLimitWithErrors(
    selectedCents,
    PRIMES.indexOf(safePrimeLimit.value),
    safeMaxExponent.value,
    Math.min(600, maxError.value),
    MAX_LENGTH
  )
  if (!approximationsAndErrors.length) {
    const [fraction, error] = approximatePrimeLimitWithErrors(
      selectedCents,
      PRIMES.indexOf(safePrimeLimit.value),
      safeMaxExponent.value,
      undefined,
      1
    )[0]
    return [{ fraction, error, limit: primeLimitString(fraction) }]
  }
  return approximationsAndErrors.map(([fraction, error]) => ({
    fraction,
    error,
    limit: primeLimitString(fraction)
  }))
})

watch(approximationsWithErrorsAndLimits, (newValue) => {
  if (approximationSelect.value !== null) {
    if (!newValue.length || newValue[0].error > maxError.value) {
      approximationSelect.value.setCustomValidity('Error exceeds the maximum value.')
    } else {
      approximationSelect.value.setCustomValidity('')
    }
  }
  approximationIndex.value = Math.min(approximationIndex.value, newValue.length - 1)
})

function modifyAndAdvance() {
  if (!approximationsWithErrorsAndLimits.value.length) {
    alert('No approximation satisfying criteria found!')
  }
  const replacement = new Interval(
    ExtendedMonzo.fromFraction(
      approximationsWithErrorsAndLimits.value[approximationIndex.value].fraction,
      DEFAULT_NUMBER_OF_COMPONENTS
    ),
    'ratio'
  )
  emit('update:scale', props.scale.replaceDegree(degree.value, replacement))
  degree.value = Math.min(props.scale.size, degree.value + 1)
  approximationIndex.value = 0
}
</script>

<template>
  <Modal :show="show" @confirm="modifyAndAdvance" @cancel="$emit('cancel')">
    <template #header>
      <h2>Approximate by ratios</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Select scale degrees and apply rational replacements one by one.</p>
        <div class="control">
          <label for="degree">Scale Degree</label>
          <input type="number" id="degree" min="1" :max="scale.size" v-model="degree" />
        </div>
        <div class="control">
          <label for="interval">Interval</label>
          <input type="text" id="interval" disabled :value="scale.getName(degree)" />
        </div>
        <div class="control">
          <label for="approximation">Approximation</label>
          <select
            ref="approximationSelect"
            id="approximation"
            class="control"
            v-model="approximationIndex"
          >
            <option
              v-for="(approximation, i) of approximationsWithErrorsAndLimits"
              :key="i"
              :value="i"
            >
              {{ fractionToString(approximation.fraction) }} |
              {{ approximation.error.toFixed(5) }} |
              {{ approximation.limit }}
            </option>
          </select>
        </div>
        <div class="control">
          <label for="max-error">Maximum error</label>
          <input type="number" id="max-error" min="0.1" max="600" step="0.1" v-model="maxError" />
        </div>
        <div class="control radio-group">
          <span>
            <input type="radio" id="method-convergents" value="convergents" v-model="method" />
            <label for="method-convergents"> Convergents </label>
          </span>

          <span>
            <input type="radio" id="method-odd" value="odd" v-model="method" />
            <label for="method-odd"> Odd limit </label>
          </span>

          <span>
            <input type="radio" id="method-prime" value="prime" v-model="method" />
            <label for="method-prime"> Prime limit </label>
          </span>
        </div>

        <div class="control checkbox-container" v-if="method === 'convergents'">
          <input type="checkbox" id="semiconvergents" v-model="includeSemiconvergents" />
          <label for="semiconvergents">Include semiconvergents</label>
        </div>
        <div class="control checkbox-container" v-if="method === 'convergents'">
          <input
            type="checkbox"
            :disabled="!includeSemiconvergents"
            id="non-monotonic"
            v-model="includeNonMonotonic"
          />
          <label for="non-monotonic">Include non-monotonic approximations</label>
        </div>

        <div class="control" v-if="method === 'odd'">
          <label for="odd-limit">Odd limit</label>
          <input type="number" min="3" max="101" step="2" v-model="oddLimit" />
        </div>

        <div class="control" v-if="method === 'prime'">
          <label for="prime-limit">Prime limit</label>
          <input
            type="number"
            min="3"
            max="29"
            step="2"
            :value="primeLimit"
            @input="modifyPrimeLimit"
          />
          <label for="max-exponent">Maximum exponent</label>
          <input type="number" min="1" max="8" v-model="maxExponent" />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="modifyAndAdvance">Apply</button>
        <button @click="$emit('cancel')">Close</button>
      </div>
    </template>
  </Modal>
</template>
