<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import strictVarietyThreeHierarchy from '@/assets/strict-variety-3-hierarchy.json'
import Modal from '@/components/ModalDialog.vue'
import NumericSlider from '@/components/NumericSlider.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { OCTAVE } from '@/constants'
import { useScaleStore } from '@/stores/scale'
import { useModalStore } from '@/stores/modal'
import { centString } from '@/utils'

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

type TierCounts = {
  L: number
  M: number
  s: number
}

const hierarchy = strictVarietyThreeHierarchy as Record<string, StrictVarietyThreeEntry>

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

defineProps<{
  show: boolean
}>()

const scale = useScaleStore()
const modal = useModalStore()

type Tier = 'L' | 'M' | 's'

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
const isConditional = computed(() => Boolean(selectedScale.value?.condition))
const orientedWord = computed(() => {
  const steps = selectedScale.value?.steps ?? ''
  return modal.strictVarietyThreeInvert && isChiral.value ? [...steps].reverse().join('') : steps
})
const modes = computed(() => uniqueRotations(orientedWord.value).sort(compareModesByBrightness))
const selectedMode = computed(() => modal.strictVarietyThreeMode || modes.value[0] || '')
const selectedCounts = computed(() => countTiers(selectedScale.value?.steps ?? ''))
const intervalSizes = computed(() => {
  const counts = selectedCounts.value
  let sWeight = 1
  let mWeight = Math.max(1, modal.strictVarietyThreeHardnessMS) * sWeight
  let lWeight = Math.max(1, modal.strictVarietyThreeHardnessLM) * mWeight

  if (isConditional.value) {
    sWeight = 1
    lWeight = Math.max(1, modal.strictVarietyThreeHardnessLS)
    mWeight = deriveConditionalM(lWeight, sWeight, selectedScale.value?.condition)
  }

  const totalWeight = counts.L * lWeight + counts.M * mWeight + counts.s * sWeight
  const centsPerWeight = modal.equave.value.totalCents() / totalWeight
  return {
    L: centString(lWeight * centsPerWeight, scale.centsFractionDigits),
    M: centString(mWeight * centsPerWeight, scale.centsFractionDigits),
    s: centString(sWeight * centsPerWeight, scale.centsFractionDigits)
  }
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

function deriveConditionalM(lWeight: number, sWeight: number, condition?: string) {
  // Strict-variety data does not currently encode a numeric condition; use the neutral geometric
  // mean when a future conditional entry asks the dialog to collapse to one L:s control.
  if (!condition) {
    return Math.sqrt(lWeight * sWeight)
  }
  return Math.sqrt(lWeight * sWeight)
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
          <label for="strict-variety-3-tier">Tiers</label>
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
        <div class="control">
          <label for="strict-variety-3-invert" :class="{ disabled: !isChiral }">
            Invert chiral scale
          </label>
          <input
            id="strict-variety-3-invert"
            type="checkbox"
            v-model="modal.strictVarietyThreeInvert"
            :disabled="!isChiral"
          />
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
        <div v-if="isConditional" class="control">
          <label for="strict-variety-3-hardness-ls">
            L:s hardness ({{ modal.strictVarietyThreeHardnessLS.toFixed(2) }})
          </label>
          <NumericSlider
            id="strict-variety-3-hardness-ls"
            class="wide-range"
            min="1"
            max="16"
            step="any"
            v-model="modal.strictVarietyThreeHardnessLS"
          />
        </div>
        <template v-else>
          <div class="control">
            <label for="strict-variety-3-hardness-lm">
              L:M hardness ({{ modal.strictVarietyThreeHardnessLM.toFixed(2) }})
            </label>
            <NumericSlider
              id="strict-variety-3-hardness-lm"
              class="wide-range"
              min="1"
              max="16"
              step="any"
              v-model="modal.strictVarietyThreeHardnessLM"
            />
          </div>
          <div class="control">
            <label for="strict-variety-3-hardness-ms">
              M:s hardness ({{ modal.strictVarietyThreeHardnessMS.toFixed(2) }})
            </label>
            <NumericSlider
              id="strict-variety-3-hardness-ms"
              class="wide-range"
              min="1"
              max="16"
              step="any"
              v-model="modal.strictVarietyThreeHardnessMS"
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
    </template>
  </Modal>
</template>
