<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { mos } from 'moment-of-symmetry/core'
import { OCTAVE } from '@/constants'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { gcd, lcm } from 'xen-dev-utils/fraction'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

interface MosFactor {
  id: number
  name: string
  numberOfLargeSteps: number
  numberOfSmallSteps: number
  sizeOfLargeStep: number
  sizeOfSmallStep: number
  up: number
  rotation: number
}

interface ProductStep {
  letters: string
  numerator: number
  denominator: number
}

const STEP_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

let nextFactorId = 3

const factors = reactive<MosFactor[]>([
  {
    id: 1,
    name: 'MOS 1',
    numberOfLargeSteps: 4,
    numberOfSmallSteps: 3,
    sizeOfLargeStep: 1,
    sizeOfSmallStep: 1,
    up: 4,
    rotation: 0
  },
  {
    id: 2,
    name: 'MOS 2',
    numberOfLargeSteps: 5,
    numberOfSmallSteps: 2,
    sizeOfLargeStep: 1,
    sizeOfSmallStep: 1,
    up: 5,
    rotation: 0
  }
])

const equaveString = ref('2/1')
const equave = ref(OCTAVE)

function safeInteger(value: number, fallback: number, min = 0, max = 1000) {
  if (!Number.isFinite(value)) {
    return fallback
  }
  return Math.max(min, Math.min(max, Math.round(value)))
}

function rotate<T>(items: T[], amount: number) {
  if (!items.length) {
    return []
  }
  const shift = ((Math.round(amount) % items.length) + items.length) % items.length
  return items.slice(shift).concat(items.slice(0, shift))
}

function factorCardinality(factor: MosFactor) {
  return safeInteger(factor.numberOfLargeSteps, 1, 1) + safeInteger(factor.numberOfSmallSteps, 1, 1)
}

function factorWord(factor: MosFactor) {
  const large = safeInteger(factor.numberOfLargeSteps, 1, 1)
  const small = safeInteger(factor.numberOfSmallSteps, 1, 1)
  const cardinality = large + small
  const periods = Math.abs(gcd(large, small))
  const upMax = cardinality - periods
  const up = Math.floor(safeInteger(factor.up, 0, 0, upMax) / periods) * periods
  const steps = mos(large, small, {
    sizeOfLargeStep: 2,
    sizeOfSmallStep: 1,
    up
  })
  const degrees = [0, ...steps]
  const sizes = steps.map((step, index) => step - degrees[index])
  return rotate(
    sizes.map((size) => (size === 2 ? 'L' : 's')),
    factor.rotation
  )
}

function factorStepFractions(factor: MosFactor) {
  const large = safeInteger(factor.numberOfLargeSteps, 1, 1)
  const small = safeInteger(factor.numberOfSmallSteps, 1, 1)
  const largeSize = safeInteger(factor.sizeOfLargeStep, 1, 1)
  const smallSize = safeInteger(factor.sizeOfSmallStep, 1, 1)
  const total = large * largeSize + small * smallSize
  const sizes = factorWord(factor).map((letter) => (letter === 'L' ? largeSize : smallSize))
  return sizes.map((size) => ({ numerator: size, denominator: total }))
}

const cardinalities = computed(() => factors.map(factorCardinality))
const cardinality = computed(() => cardinalities.value[0] ?? 0)
const hasMatchingCardinalities = computed(() =>
  cardinalities.value.every((value) => value === cardinality.value)
)
const canGenerate = computed(() => factors.length >= 2 && hasMatchingCardinalities.value)
const rank = computed(() => factors.length + 1)

const productSteps = computed<ProductStep[]>(() => {
  if (!canGenerate.value) {
    return []
  }
  const stepFractions = factors.map(factorStepFractions)
  const commonDenominator = stepFractions
    .flat()
    .reduce((accumulator, fraction) => lcm(accumulator, fraction.denominator), 1)
  const denominator = commonDenominator * factors.length

  return Array.from({ length: cardinality.value }, (_, index) => {
    const numerator = stepFractions.reduce(
      (sum, factor) =>
        sum + factor[index].numerator * (commonDenominator / factor[index].denominator),
      0
    )
    const divisor = Math.abs(gcd(numerator, denominator))
    return {
      letters: factors.map((factor) => factorWord(factor)[index]).join(''),
      numerator: numerator / divisor,
      denominator: denominator / divisor
    }
  })
})

const productWord = computed(() => {
  const symbols = new Map<string, string>()
  return productSteps.value
    .map((step) => {
      if (!symbols.has(step.letters)) {
        symbols.set(step.letters, STEP_LETTERS[symbols.size] ?? `x${symbols.size + 1}`)
      }
      return symbols.get(step.letters)
    })
    .join('')
})

const preview = computed(() =>
  productSteps.value
    .map((step) => `${step.letters}: ${step.numerator}/${step.denominator}`)
    .join(', ')
)

function addFactor() {
  const previous = factors[factors.length - 1]
  factors.push({
    ...previous,
    id: nextFactorId,
    name: `MOS ${nextFactorId}`,
    rotation: 0
  })
  nextFactorId += 1
}

function removeFactor(index: number) {
  if (factors.length <= 2) {
    return
  }
  factors.splice(index, 1)
}

function generate() {
  if (!canGenerate.value) {
    return
  }
  const sourceLines: string[] = []
  let numerator = 0
  let denominator = 1
  const projector = equave.value.compare(OCTAVE) ? `<${equave.value.toString()}>` : ''

  productSteps.value.forEach((step) => {
    const nextDenominator = lcm(denominator, step.denominator)
    numerator =
      numerator * (nextDenominator / denominator) +
      step.numerator * (nextDenominator / step.denominator)
    denominator = nextDenominator
    const divisor = Math.abs(gcd(numerator, denominator))
    numerator /= divisor
    denominator /= divisor
    sourceLines.push(`${numerator}\\${denominator}${projector}`)
  })

  emit('update:scaleName', `Rank-${rank.value} Fokker block ${productWord.value}`)
  emit('update:source', `${sourceLines.join('\n')}\n`)
}
</script>

<template>
  <Modal :show="show" @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate Fokker block</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>
          Build a rank-n Fokker block as a step-pattern product: choose two or more MOS scales with
          the same number of steps, rotate each mode or dome, then average the matching steps.
        </p>
        <div class="control">
          <label for="fokker-equave">Equave</label>
          <ScaleLineInput
            id="fokker-equave"
            v-model="equaveString"
            :defaultValue="OCTAVE"
            @update:value="equave = $event"
          />
        </div>
      </div>

      <div class="control-group" v-for="(factor, index) in factors" :key="factor.id">
        <h3>{{ factor.name }}</h3>
        <div class="control">
          <label :for="`fokker-large-${factor.id}`">Large steps</label>
          <input
            :id="`fokker-large-${factor.id}`"
            type="number"
            min="1"
            v-model="factor.numberOfLargeSteps"
          />
        </div>
        <div class="control">
          <label :for="`fokker-small-${factor.id}`">Small steps</label>
          <input
            :id="`fokker-small-${factor.id}`"
            type="number"
            min="1"
            v-model="factor.numberOfSmallSteps"
          />
        </div>
        <div class="control">
          <label :for="`fokker-large-size-${factor.id}`">Large step size</label>
          <input
            :id="`fokker-large-size-${factor.id}`"
            type="number"
            min="1"
            v-model="factor.sizeOfLargeStep"
          />
        </div>
        <div class="control">
          <label :for="`fokker-small-size-${factor.id}`">Small step size</label>
          <input
            :id="`fokker-small-size-${factor.id}`"
            type="number"
            min="1"
            v-model="factor.sizeOfSmallStep"
          />
        </div>
        <div class="control">
          <label :for="`fokker-up-${factor.id}`">Bright generators up</label>
          <input
            :id="`fokker-up-${factor.id}`"
            type="number"
            min="0"
            :max="
              factorCardinality(factor) -
              Math.abs(
                gcd(
                  safeInteger(factor.numberOfLargeSteps, 1, 1),
                  safeInteger(factor.numberOfSmallSteps, 1, 1)
                )
              )
            "
            v-model="factor.up"
          />
        </div>
        <div class="control">
          <label :for="`fokker-rotation-${factor.id}`">Mode / dome rotation</label>
          <input
            :id="`fokker-rotation-${factor.id}`"
            type="number"
            min="0"
            :max="Math.max(0, factorCardinality(factor) - 1)"
            v-model="factor.rotation"
          />
        </div>
        <div class="control">
          <label>Word: {{ factorWord(factor).join('') }}</label>
        </div>
        <button v-if="factors.length > 2" @click="removeFactor(index)">Remove MOS</button>
      </div>

      <div class="control-group">
        <button @click="addFactor">Add MOS factor</button>
        <p v-if="!hasMatchingCardinalities">
          All MOS factors must have the same number of steps. Current sizes:
          {{ cardinalities.join(', ') }}.
        </p>
        <p v-else>
          Product word: <strong>{{ productWord }}</strong>
        </p>
        <p v-if="preview">Averaged steps: {{ preview }}</p>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button :disabled="!canGenerate" @click="generate">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
      </div>
    </template>
  </Modal>
</template>
