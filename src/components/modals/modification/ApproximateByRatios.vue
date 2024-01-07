<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import {
  approximateOddLimitWithErrors,
  approximatePrimeLimitWithErrors,
  Fraction,
  getConvergents,
  PRIMES,
  valueToCents
} from 'xen-dev-utils'
import { useApproximateByRatiosStore } from '@/stores/approximate-by-ratios'
import { setAndReportValidity } from '@/utils'
import { useScaleStore } from '@/stores/scale'

const MAX_LENGTH = 128

const emit = defineEmits(['done', 'cancel'])

const approx = useApproximateByRatiosStore()
const scale = useScaleStore()

const approximationSelect = ref<HTMLSelectElement | null>(null)

type Approximation = {
  fraction: Fraction
  error: number
  limit: string
}

const approximationsWithErrorsAndLimits = computed<Approximation[]>(() => {
  const selected = Math.abs(scale.scale.getRatio(scale.baseMidiNote + approx.degree))
  const selectedCents = valueToCents(selected)
  if (approx.method === 'convergents') {
    const approximations = getConvergents(
      selected,
      undefined,
      2 * MAX_LENGTH, // Extra length buffer
      approx.includeSemiconvergents,
      approx.includeNonMonotonic
    )
    const result: Approximation[] = []
    approximations.forEach((fraction) => {
      const error = Math.abs(selectedCents - valueToCents(fraction.valueOf()))
      if (error <= approx.maxError) {
        const limit = approx.primeLimitString(fraction)
        result.push({ fraction, error, limit })
      }
    })
    return result.slice(0, MAX_LENGTH)
  } else if (approx.method === 'odd') {
    const approximationsAndErrors = approximateOddLimitWithErrors(
      selectedCents,
      approx.safeOddLimit
    )
    const result: Approximation[] = []
    approximationsAndErrors.forEach(([fraction, error]) => {
      if (error <= approx.maxError) {
        const limit = approx.primeLimitString(fraction)
        result.push({ fraction, error, limit })
      }
    })
    if (!result.length) {
      const [fraction, error] = approximationsAndErrors[0]
      return [{ fraction, error, limit: approx.primeLimitString(fraction) }]
    }
    return result.slice(0, MAX_LENGTH)
  }
  const approximationsAndErrors = approximatePrimeLimitWithErrors(
    selectedCents,
    PRIMES.indexOf(approx.safePrimeLimit),
    approx.safeMaxExponent,
    Math.min(600, approx.maxError),
    MAX_LENGTH
  )
  if (!approximationsAndErrors.length) {
    const [fraction, error] = approximatePrimeLimitWithErrors(
      selectedCents,
      PRIMES.indexOf(approx.safePrimeLimit),
      approx.safeMaxExponent,
      undefined,
      1
    )[0]
    return [{ fraction, error, limit: approx.primeLimitString(fraction) }]
  }
  return approximationsAndErrors.map(([fraction, error]) => ({
    fraction,
    error,
    limit: approx.primeLimitString(fraction)
  }))
})

watch(approximationsWithErrorsAndLimits, (newValue) => {
  if (approximationSelect.value !== null) {
    if (!newValue.length || newValue[0].error > approx.maxError) {
      setAndReportValidity(approximationSelect.value, 'Error exceeds the maximum value.')
    } else {
      setAndReportValidity(approximationSelect.value, '')
    }
  }
  approx.approximationIndex = Math.min(approx.approximationIndex, newValue.length - 1)
})

function modifyAndAdvance() {
  if (!approximationsWithErrorsAndLimits.value.length) {
    alert('No approximation satisfying criteria found!')
  } else {
    const fraction = approximationsWithErrorsAndLimits.value[approx.approximationIndex].fraction
    const i = approx.degree - 1;
    scale.sourceText += `\n$[${i}] = ${fraction.toFraction()} colorOf($[${i}]) labelOf($[${i}])`
  }
  approx.degree = Math.min(scale.scale.size, approx.degree + 1)
  approx.approximationIndex = 0
}

function modify(expand = true) {
  if (expand) {
    const {visitor, defaults} = scale.getVisitors()
    scale.sourceText = visitor.expand(defaults)
  }
  scale.computeScale();
  emit('done')
}
</script>

<template>
  <Modal @confirm="modify(true)" @cancel="modify(false)">
    <template #header>
      <h2>Approximate by ratios</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Select scale degrees and apply rational replacements one by one.</p>
        <div class="control">
          <label for="degree">Scale Degree</label>
          <input type="number" id="degree" min="1" :max="scale.scale.size" v-model="approx.degree" />
        </div>
        <div class="control">
          <label for="interval">Interval</label>
          <input type="text" id="interval" disabled :value="scale.labels[approx.degree - 1]" />
        </div>
        <div class="control">
          <label for="approximation">Approximation</label>
          <select
            ref="approximationSelect"
            id="approximation"
            class="control"
            v-model="approx.approximationIndex"
          >
            <option
              v-for="(approximation, i) of approximationsWithErrorsAndLimits"
              :key="i"
              :value="i"
            >
              {{ approximation.fraction.toFraction() }} |
              {{ approximation.error.toFixed(5) }} |
              {{ approximation.limit }}
            </option>
          </select>
        </div>
        <div class="control">
          <label for="max-error">Maximum error</label>
          <input
            type="number"
            id="max-error"
            min="0.1"
            max="600"
            step="0.1"
            v-model="approx.maxError"
          />
        </div>
        <div class="control radio-group">
          <span>
            <input
              type="radio"
              id="method-convergents"
              value="convergents"
              v-model="approx.method"
            />
            <label for="method-convergents"> Convergents </label>
          </span>

          <span>
            <input type="radio" id="method-odd" value="odd" v-model="approx.method" />
            <label for="method-odd"> Odd limit </label>
          </span>

          <span>
            <input type="radio" id="method-prime" value="prime" v-model="approx.method" />
            <label for="method-prime"> Prime limit </label>
          </span>
        </div>

        <div class="control checkbox-container" v-if="approx.method === 'convergents'">
          <input type="checkbox" id="semiconvergents" v-model="approx.includeSemiconvergents" />
          <label for="semiconvergents">Include semiconvergents</label>
        </div>
        <div class="control checkbox-container" v-if="approx.method === 'convergents'">
          <input
            type="checkbox"
            :disabled="!approx.includeSemiconvergents"
            id="non-monotonic"
            v-model="approx.includeNonMonotonic"
          />
          <label for="non-monotonic">Include non-monotonic approximations</label>
        </div>

        <div class="control" v-if="approx.method === 'odd'">
          <label for="odd-limit">Odd limit</label>
          <input type="number" min="3" max="101" step="2" v-model="approx.oddLimit" />
        </div>

        <div class="control" v-if="approx.method === 'prime'">
          <label for="prime-limit">Prime limit</label>
          <input
            type="number"
            min="3"
            max="29"
            step="2"
            :value="approx.primeLimit"
            @input="approx.modifyPrimeLimit"
          />
          <label for="max-exponent">Maximum exponent</label>
          <input type="number" min="1" max="8" v-model="approx.maxExponent" />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="modifyAndAdvance">Apply</button>
        <button @click="modify(true)">Close</button>
        <button @click="modify(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>
