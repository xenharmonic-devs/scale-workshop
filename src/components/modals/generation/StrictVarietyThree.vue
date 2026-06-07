<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import strictVarietyThreeHierarchy from '@/assets/strict-variety-3-hierarchy.json'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { OCTAVE } from '@/constants'
import { useModalStore } from '@/stores/modal'

const CONDITION_EPSILON = 1e-9

type StrictVarietyThreeScale = {
  steps: string
  chiral: boolean
  condition?: string
}

type StrictVarietyThreeBranch = StrictVarietyThreeScale[] | Record<string, StrictVarietyThreeScale[]>
type StrictVarietyThreeEntry = StrictVarietyThreeScale[] | Record<string, StrictVarietyThreeBranch>

type ScaleOption = StrictVarietyThreeScale & {
  label: string
  counts: TierCounts
}

type Tier = 'L' | 'M' | 's'

type TierCounts = Record<Tier, number>

type ParsedCondition = {
  negated: boolean
  lhs: string
  rhs: string
  lhsCounts: TierCounts
  rhsCounts: TierCounts
}

const hierarchy = strictVarietyThreeHierarchy as Record<string, StrictVarietyThreeEntry>

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

defineProps<{
  show: boolean
}>()

const modal = useModalStore()

const sizeKeys = computed(() => Object.keys(hierarchy).sort(compareSizeKeys))
const selectedEntry = computed(() => hierarchy[modal.strictVarietyThreeSize])
const selectedEntryIsArray = computed(() => Array.isArray(selectedEntry.value))
const tierKeys = computed(() => {
  const entry = selectedEntry.value
  if (!entry || Array.isArray(entry)) {
    return []
  }
  return Object.keys(entry).sort(compareTierKeys)
})
const selectedSubEntry = computed<StrictVarietyThreeBranch | undefined>(() => {
  const entry = selectedEntry.value
  if (!entry || Array.isArray(entry)) {
    return undefined
  }
  return entry[modal.strictVarietyThreeTier]
})
const selectedSubEntryIsArray = computed(() => Array.isArray(selectedSubEntry.value))
const runKeys = computed(() => {
  const subEntry = selectedSubEntry.value
  if (!subEntry || Array.isArray(subEntry)) {
    return []
  }
  return Object.keys(subEntry).sort(compareRunKeys)
})
const selectedScales = computed<StrictVarietyThreeScale[]>(() => {
  const entry = selectedEntry.value
  if (!entry) {
    return []
  }
  if (Array.isArray(entry)) {
    return entry
  }
  const subEntry = entry[modal.strictVarietyThreeTier]
  if (!subEntry) {
    return []
  }
  if (Array.isArray(subEntry)) {
    return subEntry
  }
  return subEntry[modal.strictVarietyThreeRun] ?? []
})
const scaleOptions = computed<ScaleOption[]>(() =>
  selectedScales.value.map(toOption).sort(compareScaleOptions)
)
const selectedScale = computed<StrictVarietyThreeScale | undefined>(() =>
  scaleOptions.value.find((option) => option.steps === modal.strictVarietyThreeSteps)
)
const isChiral = computed(() => selectedScale.value?.chiral ?? false)
const parsedCondition = computed(() => parseCondition(selectedScale.value?.condition))
const derivesMediumFromCondition = computed(() => {
  const condition = parsedCondition.value
  return Boolean(condition && !condition.negated && mediumCoefficient(condition))
})
const orientedWord = computed(() => {
  const steps = selectedScale.value?.steps ?? ''
  return modal.strictVarietyThreeInvert && isChiral.value ? [...steps].reverse().join('') : steps
})
const modes = computed(() => uniqueRotations(orientedWord.value).sort(compareModesByBrightness))
const selectedMode = computed(() => modal.strictVarietyThreeMode || modes.value[0] || '')
const selectedCounts = computed(() => countTiers(selectedScale.value?.steps ?? ''))

const sizeOfLargeStep = computed(() => positiveNumber(modal.strictVarietyThreeSizeOfLargeStep, 4))
const sizeOfSmallStep = computed(() => positiveNumber(modal.strictVarietyThreeSizeOfSmallStep, 1))
const sizeOfMediumStep = computed(() => {
  const condition = parsedCondition.value
  if (condition && derivesMediumFromCondition.value) {
    return deriveMediumStepSize(condition, sizeOfLargeStep.value, sizeOfSmallStep.value)
  }
  return positiveNumber(modal.strictVarietyThreeSizeOfMediumStep, 2)
})
const hostDivisions = computed(
  () =>
    selectedCounts.value.L * sizeOfLargeStep.value +
    selectedCounts.value.M * sizeOfMediumStep.value +
    selectedCounts.value.s * sizeOfSmallStep.value
)
const projector = computed(() => (modal.equave.compare(OCTAVE) ? `<${modal.equave.toString()}>` : ''))
const intervalSizes = computed(() => ({
  L: formatEtInterval(sizeOfLargeStep.value),
  M: formatEtInterval(sizeOfMediumStep.value),
  s: formatEtInterval(sizeOfSmallStep.value)
}))
const stepOrderingWarning = computed(() =>
  sizeOfLargeStep.value <= sizeOfMediumStep.value || sizeOfMediumStep.value <= sizeOfSmallStep.value
    ? 'Warning: Strict Variety 3 scales require L > M > s.'
    : ''
)
const conditionWarning = computed(() => {
  const condition = parsedCondition.value
  if (!condition) {
    return ''
  }
  if (condition.negated) {
    if (conditionEqualityHolds(condition)) {
      return `Warning: condition “Not ${condition.lhs}=${condition.rhs}” applies; the current step sizes satisfy ${condition.lhs}=${condition.rhs}.`
    }
    return ''
  }
  if (derivesMediumFromCondition.value) {
    return `Condition ${condition.lhs}=${condition.rhs} applies; M is derived from L and s.`
  }
  return `Warning: condition ${condition.lhs}=${condition.rhs} cannot derive M from the current equation.`
})

watchEffect(() => {
  if (!sizeKeys.value.includes(modal.strictVarietyThreeSize)) {
    modal.strictVarietyThreeSize = sizeKeys.value[0] ?? ''
  }
  if (tierKeys.value.length && !tierKeys.value.includes(modal.strictVarietyThreeTier)) {
    modal.strictVarietyThreeTier = tierKeys.value[0]
  }
  if (runKeys.value.length && !runKeys.value.includes(modal.strictVarietyThreeRun)) {
    modal.strictVarietyThreeRun = runKeys.value[0]
  }
  if (!scaleOptions.value.some((option) => option.steps === modal.strictVarietyThreeSteps)) {
    modal.strictVarietyThreeSteps = scaleOptions.value[0]?.steps ?? ''
  }
  if (!isChiral.value) {
    modal.strictVarietyThreeInvert = false
  }
  if (!modes.value.includes(modal.strictVarietyThreeMode)) {
    modal.strictVarietyThreeMode = modes.value[0] ?? ''
  }
})

function generate() {
  const intervals = intervalSizes.value
  emit('update:scaleName', `Strict Variety 3 ${formatCounts(selectedCounts.value)}`)
  emit(
    'update:source',
    `realizeWord('${selectedMode.value}', #{L: ${intervals.L}, M: ${intervals.M}, s: ${intervals.s}})`
  )
}

function toOption(entry: StrictVarietyThreeScale): ScaleOption {
  const counts = countTiers(entry.steps)
  return {
    ...entry,
    counts,
    label: selectedEntryIsArray.value ? `${formatCounts(counts)}: ${entry.steps}` : entry.steps
  }
}

function compareScaleOptions(a: ScaleOption, b: ScaleOption) {
  return compareCounts(a.counts, b.counts) || a.steps.localeCompare(b.steps)
}

function compareCounts(a: TierCounts, b: TierCounts) {
  return a.L - b.L || a.M - b.M || a.s - b.s
}

function compareSizeKeys(a: string, b: string) {
  return firstNumber(a) - firstNumber(b) || a.localeCompare(b, undefined, { numeric: true })
}

function compareTierKeys(a: string, b: string) {
  return compareCounts(parseCountsLabel(a), parseCountsLabel(b)) || a.localeCompare(b)
}

function compareRunKeys(a: string, b: string) {
  return firstNumber(a) - firstNumber(b) || a.localeCompare(b, undefined, { numeric: true })
}

function firstNumber(value: string) {
  return parseInt(value.match(/\d+/)?.[0] ?? '0', 10)
}

function parseCountsLabel(label: string): TierCounts {
  return {
    L: parseInt(label.match(/(\d+)L/)?.[1] ?? '0', 10),
    M: parseInt(label.match(/(\d+)M/)?.[1] ?? '0', 10),
    s: parseInt(label.match(/(\d+)s/)?.[1] ?? '0', 10)
  }
}

function countTiers(steps: string): TierCounts {
  return {
    L: countStep(steps, 'L'),
    M: countStep(steps, 'M'),
    s: countStep(steps, 's')
  }
}

function countStep(steps: string, step: Tier) {
  return [...steps].filter((char) => char === step).length
}

function formatCounts(counts: TierCounts) {
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

function compareModesByBrightness(a: string, b: string) {
  const aValues = [...a].map(brightnessValue)
  const bValues = [...b].map(brightnessValue)
  for (let i = 0; i < Math.min(aValues.length, bValues.length); ++i) {
    const difference = bValues[i] - aValues[i]
    if (difference) {
      return difference
    }
  }
  return a.localeCompare(b)
}

function brightnessValue(step: string) {
  if (step === 'L') {
    return 2
  }
  if (step === 'M') {
    return 1
  }
  return 0
}

function positiveNumber(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }
  return value
}

function parseCondition(condition?: string): ParsedCondition | undefined {
  if (!condition) {
    return undefined
  }
  let normalized = condition.trim()
  let negated = false
  const notMatch = normalized.match(/^not\s+/i)
  if (notMatch) {
    negated = true
    normalized = normalized.slice(notMatch[0].length).trim()
  }
  const [lhs, rhs, ...extra] = normalized.split('=')
  if (!lhs || !rhs || extra.length) {
    return undefined
  }
  return {
    negated,
    lhs,
    rhs,
    lhsCounts: countTiers(lhs),
    rhsCounts: countTiers(rhs)
  }
}

function mediumCoefficient(condition: ParsedCondition) {
  return condition.lhsCounts.M - condition.rhsCounts.M
}

function deriveMediumStepSize(condition: ParsedCondition, largeStep: number, smallStep: number) {
  const lhsKnown = condition.lhsCounts.L * largeStep + condition.lhsCounts.s * smallStep
  const rhsKnown = condition.rhsCounts.L * largeStep + condition.rhsCounts.s * smallStep
  const derived = (rhsKnown - lhsKnown) / mediumCoefficient(condition)
  return Number.isFinite(derived) && derived > 0 ? derived : positiveNumber(modal.strictVarietyThreeSizeOfMediumStep, 2)
}

function conditionEqualityHolds(condition: ParsedCondition) {
  const lhs = conditionWeight(condition.lhsCounts)
  const rhs = conditionWeight(condition.rhsCounts)
  return Math.abs(lhs - rhs) < CONDITION_EPSILON
}

function conditionWeight(counts: TierCounts) {
  return counts.L * sizeOfLargeStep.value + counts.M * sizeOfMediumStep.value + counts.s * sizeOfSmallStep.value
}

function formatEtInterval(steps: number) {
  return `${formatNumber(steps)}\\${formatNumber(hostDivisions.value)}${projector.value}`
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(6).replace(/\.?0+$/, '')
}
</script>

<template>
  <Modal :show="show" @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate Strict Variety 3 scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control radio-group">
          <label>Scale size</label>
          <span v-for="sizeKey of sizeKeys" :key="sizeKey">
            <input
              :id="`strict-variety-3-size-${sizeKey}`"
              type="radio"
              :value="sizeKey"
              v-model="modal.strictVarietyThreeSize"
            />
            <label :for="`strict-variety-3-size-${sizeKey}`">{{ sizeKey }}</label>
          </span>
        </div>
      </div>

      <div v-if="!selectedEntryIsArray" class="control-group">
        <div class="control">
          <label for="strict-variety-3-tier">Pattern</label>
          <select id="strict-variety-3-tier" v-model="modal.strictVarietyThreeTier">
            <option v-for="tierKey of tierKeys" :key="tierKey" :value="tierKey">
              {{ tierKey }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="!selectedSubEntryIsArray && runKeys.length" class="control-group">
        <div class="control">
          <label for="strict-variety-3-run">Runs of M</label>
          <select id="strict-variety-3-run" v-model="modal.strictVarietyThreeRun">
            <option v-for="runKey of runKeys" :key="runKey" :value="runKey">
              {{ runKey }}
            </option>
          </select>
        </div>
      </div>

      <div class="control-group">
        <div class="control">
          <label for="strict-variety-3-steps">Steps</label>
          <select id="strict-variety-3-steps" v-model="modal.strictVarietyThreeSteps">
            <option v-for="option of scaleOptions" :key="option.steps" :value="option.steps">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="control checkbox-container">
          <input
            id="strict-variety-3-invert"
            type="checkbox"
            v-model="modal.strictVarietyThreeInvert"
            :disabled="!isChiral"
          />
          <label for="strict-variety-3-invert" :class="{ disabled: !isChiral }">
            Invert chiral scale
          </label>
        </div>
        <div class="control">
          <label for="strict-variety-3-mode">Mode</label>
          <select id="strict-variety-3-mode" v-model="modal.strictVarietyThreeMode">
            <option v-for="(mode, index) of modes" :key="mode" :value="mode">
              {{ index + 1 }}: {{ mode }}
            </option>
          </select>
        </div>
      </div>

      <div class="control-group">
        <template v-if="derivesMediumFromCondition">
          <div class="control">
            <label for="strict-variety-3-size-of-large-step">Size of large step</label>
            <input
              id="strict-variety-3-size-of-large-step"
              type="number"
              min="1"
              step="any"
              v-model.number="modal.strictVarietyThreeSizeOfLargeStep"
            />
          </div>
          <div class="control">
            <label for="strict-variety-3-size-of-small-step">Size of small step</label>
            <input
              id="strict-variety-3-size-of-small-step"
              type="number"
              min="1"
              step="any"
              v-model.number="modal.strictVarietyThreeSizeOfSmallStep"
            />
          </div>
          <p>Derived size of medium step: {{ formatNumber(sizeOfMediumStep) }}</p>
        </template>
        <template v-else>
          <div class="control">
            <label for="strict-variety-3-size-of-large-step">Size of large step</label>
            <input
              id="strict-variety-3-size-of-large-step"
              type="number"
              min="1"
              step="any"
              v-model.number="modal.strictVarietyThreeSizeOfLargeStep"
            />
          </div>
          <div class="control">
            <label for="strict-variety-3-size-of-medium-step">Size of medium step</label>
            <input
              id="strict-variety-3-size-of-medium-step"
              type="number"
              min="1"
              step="any"
              v-model.number="modal.strictVarietyThreeSizeOfMediumStep"
            />
          </div>
          <div class="control">
            <label for="strict-variety-3-size-of-small-step">Size of small step</label>
            <input
              id="strict-variety-3-size-of-small-step"
              type="number"
              min="1"
              step="any"
              v-model.number="modal.strictVarietyThreeSizeOfSmallStep"
            />
          </div>
        </template>
        <div class="control">
          <label for="strict-variety-3-equave">Equave</label>
          <ScaleLineInput
            id="strict-variety-3-equave"
            v-model="modal.equaveString"
            :defaultValue="OCTAVE"
            @update:value="modal.equave = $event"
          />
        </div>
      </div>
      <p v-if="conditionWarning" class="warning">{{ conditionWarning }}</p>
      <p v-if="stepOrderingWarning" class="warning">{{ stepOrderingWarning }}</p>
    </template>
  </Modal>
</template>

<style scoped>
/* Content layout (medium) */
@media screen and (min-width: 600px) {
  .modal-mask :deep(.modal-container) {
    min-width: 40rem;
    max-width: 41rem;
  }
}
</style>
