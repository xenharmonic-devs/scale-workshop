<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import strictVarietyThreeJustIntonation from '@/assets/strict-variety-3-ji.json'
import {
  compareScaleOptions,
  countSteps,
  formatCounts,
  isChiralWord,
  type ScaleOption,
  type StepSymbol,
  uniqueModes
} from '@/components/modals/generation/sv3-common'
import { useModalStore } from '@/stores/modal'
import { expandCode } from '@/utils'

type JustIntonationStepSizes = Record<StepSymbol, string>

type JustIntonationStepSizeOption = JustIntonationStepSizes & {
  index: number
  label: string
}

const justIntonationHierarchy = strictVarietyThreeJustIntonation as Record<
  string,
  Record<string, JustIntonationStepSizes[]>
>

const emit = defineEmits(['update:source', 'update:scaleName'])

const modal = useModalStore()

const equaveKeys = computed(() => Object.keys(justIntonationHierarchy).sort(compareEquaves))
const equaveKeySet = computed(() => new Set(equaveKeys.value))
const selectedEquaveEntry = computed(
  () => justIntonationHierarchy[modal.strictVarietyThreeJustIntonationEquave]
)
const stepOptions = computed<ScaleOption[]>(() =>
  Object.keys(selectedEquaveEntry.value ?? {})
    .map((steps) => toScaleOption(steps))
    .sort(compareScaleOptions)
)
const stepOptionSet = computed(() => new Set(stepOptions.value.map((option) => option.steps)))
const selectedScale = computed<ScaleOption | undefined>(() =>
  stepOptions.value.find((option) => option.steps === modal.strictVarietyThreeJustIntonationSteps)
)
const isChiral = computed(() =>
  Boolean(selectedScale.value && isChiralWord(selectedScale.value.steps))
)
const orientedWord = computed(() => {
  const steps = selectedScale.value?.steps ?? ''
  return modal.strictVarietyThreeJustIntonationInvert && isChiral.value
    ? [...steps].reverse().join('')
    : steps
})
const modes = computed(() => uniqueModes(orientedWord.value))
const modeSet = computed(() => new Set(modes.value))
const selectedMode = computed(
  () => modal.strictVarietyThreeJustIntonationMode || modes.value[0] || ''
)
const stepSizeOptions = computed<JustIntonationStepSizeOption[]>(() =>
  (selectedEquaveEntry.value?.[modal.strictVarietyThreeJustIntonationSteps] ?? []).map(
    (stepSizes, index) => ({
      ...stepSizes,
      index,
      label: `L=${stepSizes.L}, M=${stepSizes.M}, s=${stepSizes.s}`
    })
  )
)
const selectedStepSizes = computed<JustIntonationStepSizeOption | undefined>(
  () => stepSizeOptions.value[modal.strictVarietyThreeJustIntonationStepSizesIndex]
)
function compareEquaves(a: string, b: string) {
  if (a.includes('/')) {
    if (b.includes('/')) {
      const [an, ad] = a.split('/').map((x) => parseInt(x, 10))
      const [bn, bd] = b.split('/').map((x) => parseInt(x, 10))
      return ad - bd || an - bn
    }
    return 1
  }
  if (b.includes('/')) {
    return -1
  }
  return parseInt(a, 10) - parseInt(b, 10)
}

watchEffect(() => {
  if (!equaveKeySet.value.has(modal.strictVarietyThreeJustIntonationEquave)) {
    modal.strictVarietyThreeJustIntonationEquave = equaveKeys.value[0] ?? ''
  }
  if (!stepOptionSet.value.has(modal.strictVarietyThreeJustIntonationSteps)) {
    modal.strictVarietyThreeJustIntonationSteps = stepOptions.value[0]?.steps ?? ''
  }
  if (!isChiral.value) {
    modal.strictVarietyThreeJustIntonationInvert = false
  }
  if (!modeSet.value.has(modal.strictVarietyThreeJustIntonationMode)) {
    modal.strictVarietyThreeJustIntonationMode = modes.value[0] ?? ''
  }
  if (!stepSizeOptions.value[modal.strictVarietyThreeJustIntonationStepSizesIndex]) {
    modal.strictVarietyThreeJustIntonationStepSizesIndex = 0
  }
})

function generate(expand = true) {
  const intervals = selectedStepSizes.value
  if (!intervals) {
    return
  }
  const source = `realizeWord('${selectedMode.value}', #{L: ${intervals.L}, M: ${intervals.M}, s: ${intervals.s}})`
  const counts = countSteps(modal.strictVarietyThreeJustIntonationSteps)
  emit(
    'update:scaleName',
    `SV3 JI ${modal.strictVarietyThreeJustIntonationEquave}: ${formatCounts(counts)}`
  )
  emit('update:source', expand ? expandCode(source) : source)
}

function toScaleOption(steps: string): ScaleOption {
  const counts = countSteps(steps)
  return {
    steps,
    chiral: isChiralWord(steps),
    counts,
    label: `${formatCounts(counts)}: ${steps}`
  }
}

defineExpose({ generate })
</script>

<template>
  <div class="control-group">
    <div class="control radio-group">
      <label>Equave</label>
      <span v-for="equaveKey of equaveKeys" :key="equaveKey">
        <input
          :id="`strict-variety-3-ji-equave-${equaveKey}`"
          type="radio"
          :value="equaveKey"
          v-model="modal.strictVarietyThreeJustIntonationEquave"
        />
        <label :for="`strict-variety-3-ji-equave-${equaveKey}`">{{ equaveKey }}</label>
      </span>
    </div>
  </div>

  <div class="control-group">
    <div class="control">
      <label for="strict-variety-3-ji-steps">Steps</label>
      <select id="strict-variety-3-ji-steps" v-model="modal.strictVarietyThreeJustIntonationSteps">
        <option v-for="option of stepOptions" :key="option.steps" :value="option.steps">
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>

  <div class="control-group">
    <div class="control checkbox-container">
      <input
        id="strict-variety-3-ji-invert"
        type="checkbox"
        v-model="modal.strictVarietyThreeJustIntonationInvert"
        :disabled="!isChiral"
      />
      <label for="strict-variety-3-ji-invert" :class="{ disabled: !isChiral }">
        Invert chiral scale
      </label>
    </div>
    <div class="control">
      <label for="strict-variety-3-ji-mode">Mode</label>
      <select id="strict-variety-3-ji-mode" v-model="modal.strictVarietyThreeJustIntonationMode">
        <option v-for="(mode, index) of modes" :key="mode" :value="mode">
          {{ index + 1 }}: {{ mode }}
        </option>
      </select>
    </div>
  </div>

  <div class="control-group">
    <div class="control">
      <label for="strict-variety-3-ji-step-sizes">Step sizes</label>
      <select
        id="strict-variety-3-ji-step-sizes"
        v-model.number="modal.strictVarietyThreeJustIntonationStepSizesIndex"
      >
        <option v-for="option of stepSizeOptions" :key="option.index" :value="option.index">
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>
