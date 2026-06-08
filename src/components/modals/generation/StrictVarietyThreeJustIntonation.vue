<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import strictVarietyThreeJustIntonation from '@/assets/strict-variety-3-ji.json'
import { useModalStore } from '@/stores/modal'
import { expandCode } from '@/utils'

type StepSymbol = 'L' | 'M' | 's'

type StepCounts = Record<StepSymbol, number>

type JustIntonationStepSizes = Record<StepSymbol, string>

type ScaleOption = {
  steps: string
  chiral: boolean
  label: string
  counts: StepCounts
}

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

const equaveKeys = computed(() => Object.keys(justIntonationHierarchy))
const selectedEquaveEntry = computed(
  () => justIntonationHierarchy[modal.strictVarietyThreeJustIntonationEquave]
)
const stepOptions = computed<ScaleOption[]>(() =>
  Object.keys(selectedEquaveEntry.value ?? {})
    .map((steps) => toScaleOption(steps))
    .sort(compareScaleOptions)
)
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
const modes = computed(() => uniqueRotations(orientedWord.value).sort(compareModesByBrightness))
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

watchEffect(() => {
  if (!equaveKeys.value.includes(modal.strictVarietyThreeJustIntonationEquave)) {
    modal.strictVarietyThreeJustIntonationEquave = equaveKeys.value[0] ?? ''
  }
  if (
    !stepOptions.value.some(
      (option) => option.steps === modal.strictVarietyThreeJustIntonationSteps
    )
  ) {
    modal.strictVarietyThreeJustIntonationSteps = stepOptions.value[0]?.steps ?? ''
  }
  if (!isChiral.value) {
    modal.strictVarietyThreeJustIntonationInvert = false
  }
  if (!modes.value.includes(modal.strictVarietyThreeJustIntonationMode)) {
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

function compareScaleOptions(a: ScaleOption, b: ScaleOption) {
  return (
    a.steps.length - b.steps.length ||
    a.counts.L - b.counts.L ||
    a.counts.M - b.counts.M ||
    a.steps.localeCompare(b.steps)
  )
}

function countSteps(steps: string): StepCounts {
  return {
    L: countStep(steps, 'L'),
    M: countStep(steps, 'M'),
    s: countStep(steps, 's')
  }
}

function countStep(steps: string, step: StepSymbol) {
  return [...steps].filter((char) => char === step).length
}

function formatCounts(counts: StepCounts) {
  return `${counts.L}L ${counts.M}M ${counts.s}s`
}

function uniqueRotations(steps: string) {
  const result: string[] = []
  for (let i = 0; i < steps.length; ++i) {
    const rotation = steps.slice(i) + steps.slice(0, i)
    if (!result.includes(rotation)) {
      result.push(rotation)
    }
  }
  return result
}

function isChiralWord(steps: string) {
  const reversed = [...steps].reverse().join('')
  return !uniqueRotations(steps).includes(reversed)
}

function compareModesByBrightness(a: string, b: string) {
  const aValues = [...a].map(brightnessValue)
  const bValues = [...b].map(brightnessValue)
  for (let i = 0; i < Math.min(aValues.length, bValues.length); ++i) {
    const difference = bValues[i] - aValues[i]
    if (difference) {
      return difference
    }
  }
  return 0
}

function brightnessValue(step: string) {
  if (step === 'L') {
    return 3
  }
  if (step === 'M') {
    return 2
  }
  return 1
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
