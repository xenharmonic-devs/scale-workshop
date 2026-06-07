<script setup lang="ts">
import { computed } from 'vue'
import { mos } from 'moment-of-symmetry/core'
import { OCTAVE } from '@/constants'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { useModalStore } from '@/stores/modal'
import { gcd, lcm } from 'xen-dev-utils/fraction'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

interface FokkerBlockFactor {
  id: number
  numberOfLargeSteps: number
  sizeOfLargeStep: number
  sizeOfSmallStep: number
  rotation: number
}

interface ProductStep {
  letters: string
  numerator: number
  denominator: number
}

const STEP_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const modal = useModalStore()

function safeInteger(value: number, fallback: number, min = 0, max = 1000) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return fallback
  }
  return Math.max(min, Math.min(max, Math.round(numericValue)))
}

const scaleSize = computed(() => safeInteger(modal.fokkerBlockScaleSize, 7, 2))
const rank = computed(() => modal.fokkerBlockFactors.length + 1)
const activeFactor = computed(() => modal.fokkerBlockFactors[modal.fokkerBlockActiveFactorIndex])

function factorName(index: number) {
  return `MOS ${index + 1}`
}

function safeLargeSteps(factor: FokkerBlockFactor) {
  return safeInteger(factor.numberOfLargeSteps, 1, 1, scaleSize.value - 1)
}

function inferredSmallSteps(factor: FokkerBlockFactor) {
  return scaleSize.value - safeLargeSteps(factor)
}

function safeRotation(factor: FokkerBlockFactor) {
  const large = safeLargeSteps(factor)
  const small = inferredSmallSteps(factor)
  const periods = Math.abs(gcd(large, small))
  const upMax = scaleSize.value - periods
  return Math.floor(safeInteger(factor.rotation, 0, 0, upMax) / periods) * periods
}

function factorWord(factor: FokkerBlockFactor) {
  const steps = mos(safeLargeSteps(factor), inferredSmallSteps(factor), {
    sizeOfLargeStep: 2,
    sizeOfSmallStep: 1,
    up: safeRotation(factor)
  })
  const degrees = [0, ...steps]
  return steps.map((step, index) => (step - degrees[index] === 2 ? 'L' : 's'))
}

function factorStepFractions(factor: FokkerBlockFactor) {
  const large = safeLargeSteps(factor)
  const small = inferredSmallSteps(factor)
  const largeSize = safeInteger(factor.sizeOfLargeStep, 1, 1)
  const smallSize = safeInteger(factor.sizeOfSmallStep, 1, 1)
  const total = large * largeSize + small * smallSize
  const sizes = factorWord(factor).map((letter) => (letter === 'L' ? largeSize : smallSize))
  return sizes.map((size) => ({ numerator: size, denominator: total }))
}

const productSteps = computed<ProductStep[]>(() => {
  const stepFractions = modal.fokkerBlockFactors.map(factorStepFractions)
  const commonDenominator = stepFractions
    .flat()
    .reduce((accumulator, fraction) => lcm(accumulator, fraction.denominator), 1)
  const denominator = commonDenominator * modal.fokkerBlockFactors.length

  return Array.from({ length: scaleSize.value }, (_, index) => {
    const numerator = stepFractions.reduce(
      (sum, factor) =>
        sum + factor[index].numerator * (commonDenominator / factor[index].denominator),
      0
    )
    const divisor = Math.abs(gcd(numerator, denominator))
    return {
      letters: modal.fokkerBlockFactors.map((factor) => factorWord(factor)[index]).join(''),
      numerator: numerator / divisor,
      denominator: denominator / divisor
    }
  })
})

const productSymbols = computed(() => {
  const symbols = new Map<string, string>()
  return productSteps.value.map((step) => {
    if (!symbols.has(step.letters)) {
      symbols.set(step.letters, STEP_LETTERS[symbols.size] ?? `x${symbols.size + 1}`)
    }
    return symbols.get(step.letters)!
  })
})

const productWord = computed(() => productSymbols.value.join(''))

const hostEdo = computed(() =>
  productSteps.value.reduce((accumulator, step) => lcm(accumulator, step.denominator), 1)
)

const symbolStepMap = computed(() => {
  const result = new Map<string, number>()
  productSymbols.value.forEach((symbol, index) => {
    const step = productSteps.value[index]
    result.set(symbol, step.numerator * (hostEdo.value / step.denominator))
  })
  return result
})

const preview = computed(() =>
  [...symbolStepMap.value.entries()]
    .map(([symbol, steps]) => `${symbol}: ${steps}/${hostEdo.value}`)
    .join(', ')
)

function selectFactor(index: number) {
  modal.fokkerBlockActiveFactorIndex = index
}

function removeFactor(index: number) {
  modal.removeFokkerBlockFactor(index)
}

function projectorString() {
  return modal.equave.compare(OCTAVE) ? `<${modal.equave.toString()}>` : ''
}

function generate(expand = true) {
  const projector = projectorString()
  let source: string

  if (expand) {
    const sourceLines: string[] = []
    let degree = 0
    productSymbols.value.forEach((symbol) => {
      degree += symbolStepMap.value.get(symbol) ?? 0
      sourceLines.push(`${degree}\\${hostEdo.value}${projector}`)
    })
    source = `${sourceLines.join('\n')}\n`
  } else {
    const steps = [...symbolStepMap.value.entries()]
      .map(([symbol, step]) => `${symbol}: ${step}\\${hostEdo.value}${projector}`)
      .join(', ')
    source = `realizeWord("${productWord.value}", #{${steps}})`
  }

  emit('update:scaleName', `Rank-${rank.value} Fokker block ${productWord.value}`)
  emit('update:source', source)
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
          Build a rank-{{ rank }} Fokker block as a step-pattern product: choose a shared scale
          size, configure two or more MOS factors, rotate each mode or dome, then average matching
          steps.
        </p>
        <div class="control">
          <label for="fokker-scale-size">Scale size</label>
          <input
            id="fokker-scale-size"
            type="number"
            min="2"
            max="1000"
            v-model.number="modal.fokkerBlockScaleSize"
          />
        </div>
        <div class="control">
          <label for="fokker-equave">Equave</label>
          <ScaleLineInput
            id="fokker-equave"
            v-model="modal.equaveString"
            :defaultValue="OCTAVE"
            @update:value="modal.equave = $event"
          />
        </div>
      </div>

      <div class="factor-tabs">
        <button
          v-for="(factor, index) in modal.fokkerBlockFactors"
          :key="factor.id"
          :class="{ active: index === modal.fokkerBlockActiveFactorIndex }"
          @click="selectFactor(index)"
        >
          {{ factorName(index) }}
        </button>
        <button @click="modal.addFokkerBlockFactor">+</button>
      </div>

      <div v-if="activeFactor" class="control-group factor-panel">
        <h3>{{ factorName(modal.fokkerBlockActiveFactorIndex) }}</h3>
        <div class="control">
          <label :for="`fokker-large-${activeFactor.id}`">
            Large steps ({{ inferredSmallSteps(activeFactor) }} small)
          </label>
          <input
            :id="`fokker-large-${activeFactor.id}`"
            type="number"
            min="1"
            :max="scaleSize - 1"
            v-model.number="activeFactor.numberOfLargeSteps"
          />
        </div>
        <div class="control">
          <label :for="`fokker-large-size-${activeFactor.id}`">Large step size</label>
          <input
            :id="`fokker-large-size-${activeFactor.id}`"
            type="number"
            min="1"
            v-model.number="activeFactor.sizeOfLargeStep"
          />
        </div>
        <div class="control">
          <label :for="`fokker-small-size-${activeFactor.id}`">Small step size</label>
          <input
            :id="`fokker-small-size-${activeFactor.id}`"
            type="number"
            min="1"
            v-model.number="activeFactor.sizeOfSmallStep"
          />
        </div>
        <div class="control">
          <label :for="`fokker-rotation-${activeFactor.id}`">Mode / dome rotation</label>
          <input
            :id="`fokker-rotation-${activeFactor.id}`"
            type="number"
            min="0"
            :max="Math.max(0, scaleSize - 1)"
            v-model.number="activeFactor.rotation"
          />
        </div>
        <div class="control">
          <label>Word</label>
          <output>{{ factorWord(activeFactor).join('') }}</output>
        </div>
        <button
          v-if="modal.fokkerBlockFactors.length > 2"
          @click="removeFactor(modal.fokkerBlockActiveFactorIndex)"
        >
          Remove {{ factorName(modal.fokkerBlockActiveFactorIndex) }}
        </button>
      </div>

      <div class="control-group">
        <p>
          Product word: <strong>{{ productWord }}</strong>
        </p>
        <p>Host EDO: {{ hostEdo }}</p>
        <p v-if="preview">Averaged steps: {{ preview }}</p>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="() => generate(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="() => generate(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.factor-tabs {
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.factor-tabs button {
  flex: 0 0 auto;
}

.factor-tabs button.active {
  color: var(--color-background);
  background-color: var(--color-text);
}

.factor-panel h3 {
  margin-top: 0;
}

output {
  align-self: center;
}

@media screen and (min-width: 600px) {
  .modal-mask :deep(.modal-container) {
    min-width: 40rem;
    max-width: 41rem;
  }
}
</style>
