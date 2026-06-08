<script setup lang="ts">
import { Fraction, lcm } from 'xen-dev-utils/fraction'
import { computed, defineAsyncComponent, useTemplateRef, watchEffect } from 'vue'
import strictVarietyThreeHierarchy from '@/assets/strict-variety-3-hierarchy.json'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { OCTAVE } from '@/constants'
import { useModalStore } from '@/stores/modal'
import { expandCode, nameOfEd } from '@/utils'

type StrictVarietyThreeScale = {
  steps: string
  chiral: boolean
  condition?: string
}

type StrictVarietyThreeBranch =
  | StrictVarietyThreeScale[]
  | Record<string, StrictVarietyThreeScale[]>
type StrictVarietyThreeEntry = StrictVarietyThreeScale[] | Record<string, StrictVarietyThreeBranch>

type StepSymbol = 'L' | 'M' | 's'

type StepCounts = Record<StepSymbol, number>

type ScaleOption = StrictVarietyThreeScale & {
  label: string
  counts: StepCounts
}

type ParsedCondition = {
  negated: boolean
  lhs: string
  rhs: string
  lhsCounts: StepCounts
  rhsCounts: StepCounts
}

const hierarchy = strictVarietyThreeHierarchy as Record<string, StrictVarietyThreeEntry>

type StrictVarietyThreeJustIntonationComponent = {
  generate: (expand?: boolean) => void
}

const StrictVarietyThreeJustIntonation = defineAsyncComponent(
  () => import('@/components/modals/generation/StrictVarietyThreeJustIntonation.vue')
)
const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

defineProps<{
  show: boolean
}>()

const modal = useModalStore()
const justIntonationTab =
  useTemplateRef<StrictVarietyThreeJustIntonationComponent>('justIntonationTab')

const sizeKeys = computed(() => Object.keys(hierarchy).sort(compareSizeKeys))
const selectedSizeEntry = computed(() => hierarchy[modal.strictVarietyThreeSize])
const selectedSizeEntryIsArray = computed(() => Array.isArray(selectedSizeEntry.value))
const patternKeys = computed(() => {
  const entry = selectedSizeEntry.value
  if (!entry || Array.isArray(entry)) {
    return []
  }
  return Object.keys(entry).sort(comparePatternKeys)
})
const selectedPatternEntry = computed<StrictVarietyThreeBranch | undefined>(() => {
  const entry = selectedSizeEntry.value
  if (!entry || Array.isArray(entry)) {
    return undefined
  }
  return entry[modal.strictVarietyThreePattern]
})
const selectedPatternEntryIsArray = computed(() => Array.isArray(selectedPatternEntry.value))
const runKeys = computed(() => {
  const patternEntry = selectedPatternEntry.value
  if (!patternEntry || Array.isArray(patternEntry)) {
    return []
  }
  return Object.keys(patternEntry).sort(compareRunKeys)
})
const selectedScales = computed<StrictVarietyThreeScale[]>(() => {
  const entry = selectedSizeEntry.value
  if (!entry) {
    return []
  }
  if (Array.isArray(entry)) {
    return entry
  }
  const patternEntry = entry[modal.strictVarietyThreePattern]
  if (!patternEntry) {
    return []
  }
  if (Array.isArray(patternEntry)) {
    return patternEntry
  }
  return patternEntry[modal.strictVarietyThreeRun] ?? []
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
const selectedCounts = computed(() => countSteps(selectedScale.value?.steps ?? ''))

const sizeOfLargeStep = computed(() => positiveInteger(modal.strictVarietyThreeSizeOfLargeStep, 3))
const sizeOfSmallStep = computed(() => positiveInteger(modal.strictVarietyThreeSizeOfSmallStep, 1))
const sizeOfMediumStep = computed<Fraction>(() => {
  const condition = parsedCondition.value
  if (condition && derivesMediumFromCondition.value) {
    return deriveMediumStepSize(condition, sizeOfLargeStep.value, sizeOfSmallStep.value)
  }
  return new Fraction(positiveInteger(modal.strictVarietyThreeSizeOfMediumStep, 2))
})
const hostDivisions = computed(() =>
  sizeOfMediumStep.value
    .mul(selectedCounts.value.M)
    .add(selectedCounts.value.L * sizeOfLargeStep.value)
    .add(selectedCounts.value.s * sizeOfSmallStep.value)
)
const projector = computed(() =>
  modal.equave.compare(OCTAVE) ? `<${modal.equave.toString()}>` : ''
)
const intervalFractions = computed(() => {
  const L = new Fraction(sizeOfLargeStep.value).div(hostDivisions.value)
  const M = sizeOfMediumStep.value.div(hostDivisions.value)
  const s = new Fraction(sizeOfSmallStep.value).div(hostDivisions.value)

  const hostEd = lcm(lcm(L.d, M.d), s.d)

  return { L, M, s, hostEd }
})
const hostEd = computed(() => intervalFractions.value['hostEd'])
const intervalSizes = computed(() => {
  const { L, M, s, hostEd } = intervalFractions.value
  return {
    L: `${L.s * L.n * (hostEd / L.d)}\\${hostEd}${projector.value}`,
    M: `${M.s * M.n * (hostEd / M.d)}\\${hostEd}${projector.value}`,
    s: `${s.s * s.n * (hostEd / s.d)}\\${hostEd}${projector.value}`
  }
})

const stepOrderingWarning = computed(() =>
  sizeOfMediumStep.value.compare(sizeOfLargeStep.value) >= 0 ||
  sizeOfMediumStep.value.compare(sizeOfSmallStep.value) <= 0
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
  if (patternKeys.value.length && !patternKeys.value.includes(modal.strictVarietyThreePattern)) {
    modal.strictVarietyThreePattern = patternKeys.value[0]
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

function generate(expand = true) {
  if (modal.strictVarietyThreeType === 'justIntonation') {
    justIntonationTab.value?.generate(expand)
    return
  }
  const intervals = intervalSizes.value
  const source = `realizeWord('${selectedMode.value}', #{L: ${intervals.L}, M: ${intervals.M}, s: ${intervals.s}})`
  emit('update:scaleName', `SV3: ${formatCounts(selectedCounts.value)}`)
  emit('update:source', expand ? expandCode(source) : source)
}

function toOption(entry: StrictVarietyThreeScale): ScaleOption {
  const counts = countSteps(entry.steps)
  return {
    ...entry,
    counts,
    label: selectedSizeEntryIsArray.value ? `${formatCounts(counts)}: ${entry.steps}` : entry.steps
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

function compareCounts(a: StepCounts, b: StepCounts) {
  return a.L - b.L || a.M - b.M || a.s - b.s
}

function compareSizeKeys(a: string, b: string) {
  return firstNumber(a) - firstNumber(b) || a.localeCompare(b, undefined, { numeric: true })
}

function comparePatternKeys(a: string, b: string) {
  return compareCounts(parsePatternCountsLabel(a), parsePatternCountsLabel(b)) || a.localeCompare(b)
}

function compareRunKeys(a: string, b: string) {
  return firstNumber(a) - firstNumber(b) || a.localeCompare(b, undefined, { numeric: true })
}

function firstNumber(value: string) {
  return parseInt(value.match(/\d+/)?.[0] ?? '0', 10)
}

function parsePatternCountsLabel(label: string): StepCounts {
  return {
    L: parseInt(label.match(/(\d+)L/)?.[1] ?? '0', 10),
    M: parseInt(label.match(/(\d+)M/)?.[1] ?? '0', 10),
    s: parseInt(label.match(/(\d+)s/)?.[1] ?? '0', 10)
  }
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

function positiveInteger(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }
  return Math.round(value)
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
    lhsCounts: countSteps(lhs),
    rhsCounts: countSteps(rhs)
  }
}

function mediumCoefficient(condition: ParsedCondition) {
  return condition.lhsCounts.M - condition.rhsCounts.M
}

function deriveMediumStepSize(condition: ParsedCondition, largeStep: number, smallStep: number) {
  const lhsKnown = condition.lhsCounts.L * largeStep + condition.lhsCounts.s * smallStep
  const rhsKnown = condition.rhsCounts.L * largeStep + condition.rhsCounts.s * smallStep
  return new Fraction(rhsKnown - lhsKnown, mediumCoefficient(condition))
}

function conditionEqualityHolds(condition: ParsedCondition) {
  const lhs = conditionWeight(condition.lhsCounts)
  const rhs = conditionWeight(condition.rhsCounts)
  return lhs.equals(rhs)
}

function conditionWeight(counts: StepCounts) {
  return sizeOfMediumStep.value
    .mul(counts.M)
    .add(counts.L * sizeOfLargeStep.value)
    .add(counts.s * sizeOfSmallStep.value)
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
          <label>Type</label>
          <span>
            <input
              id="strict-variety-3-tab-equal-temperament"
              type="radio"
              value="equalTemperament"
              v-model="modal.strictVarietyThreeType"
            />
            <label for="strict-variety-3-tab-equal-temperament">Equal temperament</label>
          </span>
          <span>
            <input
              id="strict-variety-3-tab-just-intonation"
              type="radio"
              value="justIntonation"
              v-model="modal.strictVarietyThreeType"
            />
            <label for="strict-variety-3-tab-just-intonation">Just intonation</label>
          </span>
        </div>
      </div>

      <template v-if="modal.strictVarietyThreeType === 'equalTemperament'">
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

        <div v-if="!selectedSizeEntryIsArray" class="control-group">
          <div class="control">
            <label for="strict-variety-3-pattern">Pattern</label>
            <select id="strict-variety-3-pattern" v-model="modal.strictVarietyThreePattern">
              <option v-for="patternKey of patternKeys" :key="patternKey" :value="patternKey">
                {{ patternKey }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="!selectedPatternEntryIsArray && runKeys.length" class="control-group">
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
          <div v-if="!derivesMediumFromCondition" class="control">
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
          <p v-if="derivesMediumFromCondition">
            Derived size of medium step: {{ sizeOfMediumStep.toFraction() }}
          </p>
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

      <StrictVarietyThreeJustIntonation
        v-else
        ref="justIntonationTab"
        @update:source="$emit('update:source', $event)"
        @update:scaleName="$emit('update:scaleName', $event)"
      />
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="() => generate(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="() => generate(false)">Raw</button>
        <i v-if="modal.strictVarietyThreeType === 'equalTemperament'">
          {{ hostEd }}{{ nameOfEd(modal.equave, modal.equaveString) }}
        </i>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
/* Content layout (medium) */
@media screen and (min-width: 600px) {
  .modal-mask :deep(.modal-container) {
    min-width: 35rem;
    max-width: 36rem;
  }
}
</style>
