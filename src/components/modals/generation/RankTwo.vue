<script setup lang="ts">
import {
  DEFAULT_NUMBER_OF_COMPONENTS,
  MAX_INTERACTIVE_SUBGROUP_SIZE,
  FIFTH,
  OCTAVE
} from '@/constants'
import {
  makeRank2FromVals,
  makeRank2FromCommas,
  mosPatternsRank2FromVals,
  mosPatternsRank2FromCommas,
  type Rank2Params
} from '@/tempering'
import { isBright, mosPatterns as getMosPatterns, type MosInfo } from 'moment-of-symmetry'
import { computed, ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import PeriodCircle from '@/components/PeriodCircle.vue'
import { makeState } from '@/components/modals/tempering-state'
import { computedAndError, gapKeyColors } from '@/utils'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { ExtendedMonzo, Interval, Scale } from 'scale-workshop-core'

const props = defineProps<{
  centsFractionDigits: number
  scale: Scale
}>()

const MAX_SIZE = 128
const MAX_LENGTH = 12

const emit = defineEmits(['update:scaleName', 'update:scale', 'update:keyColors', 'cancel'])

// === Component state ===
const method = ref<'generator' | 'vals' | 'commas' | 'circle'>('generator')
const error = ref('')
const state = makeState(method)
// method: "generator"
const generator = ref(FIFTH)
const generatorString = ref('')
const period = ref(OCTAVE)
const periodString = ref('2/1')
// method: "vals"
const valsString = state.valsString
// medhod: "commas"
const commasString = state.commasString
// method: "generator"
const size = ref(7)
const up = ref(5)
const numPeriods = ref(1)
// method: "circle"
const periodStretch = ref('0')
const generatorFineCents = ref('0')
// Generic
const subgroupString = state.subgroupString
const subgroupError = state.subgroupError
const subgroupInput = ref<HTMLInputElement | null>(null)
// Advanced
const showAdvanced = ref(false)
const weightsString = state.weightsString
const tempering = state.tempering
const constraintsString = state.constraintsString
// Footer preview
const previewMosPattern = ref('')
// Values that are expensive to compute
const expensiveMosPatterns = ref<MosInfo[]>([])
// State for key colors
const colorMethod = ref<'none' | 'gaps'>('none')
const colorAccidentals = ref<'flat' | 'sharp'>('sharp')

// === Computed state ===
const vals = state.vals
const commas = state.commas
const subgroup = state.subgroup
const options = state.options

const generatorPerPeriod = computed(() => generator.value.totalCents() / period.value.totalCents())
const opposite = computed(() =>
  isBright(generatorPerPeriod.value, size.value / numPeriods.value) ? 'dark' : 'bright'
)

const [mosPatterns, mosPatternsError] = computedAndError(() => {
  if (method.value === 'generator') {
    // Don't show error in the default configuration
    if (!generatorString.value.length) {
      return []
    }
    return getMosPatterns(generatorPerPeriod.value, numPeriods.value, MAX_SIZE, MAX_LENGTH)
  } else if (method.value === 'vals') {
    // Don't show error in the default configuration
    if (!vals.value.length || !subgroupString.value.length) {
      return []
    }
    // Huge subgroups get too expensive to evaluate interactively
    if (subgroup.value.basis.length > MAX_INTERACTIVE_SUBGROUP_SIZE) {
      return expensiveMosPatterns.value
    }
    return mosPatternsRank2FromVals(vals.value, subgroup.value, MAX_SIZE, MAX_LENGTH, options.value)
  } else if (method.value === 'commas') {
    // Don't show error in the default configuration
    if (!commas.value.length) {
      return []
    }
    // Huge subgroups get too expensive to evaluate interactively
    if (subgroup.value.basis.length > MAX_INTERACTIVE_SUBGROUP_SIZE) {
      return expensiveMosPatterns.value
    }
    return mosPatternsRank2FromCommas(
      commas.value,
      subgroup.value,
      MAX_SIZE,
      MAX_LENGTH,
      options.value
    )
  } else {
    return expensiveMosPatterns.value
  }
}, [])

const circlePeriodCents = computed(() => {
  const stretch = parseFloat(periodStretch.value)
  if (isNaN(stretch)) {
    return period.value.totalCents()
  }
  return period.value.totalCents() * Math.exp(stretch)
})

const circleGeneratorCents = computed(() => {
  const fine = parseFloat(generatorFineCents.value)
  if (isNaN(fine)) {
    return generator.value.totalCents()
  }
  return generator.value.totalCents() + fine
})

const generatorsPerPeriod = computed({
  get: () => size.value / numPeriods.value,
  set: (newValue) => {
    const oldDown = down.value
    size.value = newValue * numPeriods.value
    // Attempt to preserve "down" rather than "up".
    // It makes more sense that circle generators are appended in the positive direction.
    up.value = Math.max(0, upMax.value - oldDown)
  }
})

// === Watchers ===

// Consolidate circle method's fine tuning to hard values when changing "tabs"
function consolidateCircle() {
  const options = { centsFractionDigits: props.centsFractionDigits }
  period.value = new Interval(
    ExtendedMonzo.fromCents(circlePeriodCents.value, DEFAULT_NUMBER_OF_COMPONENTS),
    'cents'
  ).mergeOptions(options)
  periodString.value = period.value.toString()
  generator.value = new Interval(
    ExtendedMonzo.fromCents(circleGeneratorCents.value, DEFAULT_NUMBER_OF_COMPONENTS),
    'cents'
  ).mergeOptions(options)
  generatorString.value = generator.value.toString()
  periodStretch.value = '0'
  generatorFineCents.value = '0'
}

watch(method, (_, oldValue) => {
  if (oldValue === 'circle') {
    consolidateCircle()
  }
})

// Force scale size and generator stack to align with the multi-MOS
watch(numPeriods, (newValue) => {
  if (newValue > 1) {
    size.value = Math.round(size.value / newValue) * newValue
    up.value = Math.round(up.value / newValue) * newValue
  }
})

const upMax = computed(() => {
  return size.value - numPeriods.value
})

const down = computed(() => {
  return upMax.value - up.value
})

watch(upMax, (newValue) => {
  up.value = Math.min(up.value, newValue)
})

watch(generator, () => (error.value = ''))
watch(period, () => (error.value = ''))

watch(subgroupError, (newValue) => subgroupInput.value!.setCustomValidity(newValue))

watch([vals, commas, subgroup, options], () => (expensiveMosPatterns.value = []))

watch([periodStretch, generatorFineCents], () => (expensiveMosPatterns.value = []))

// === Methods ===

function flipGenerator() {
  generator.value = generator.value.neg().mmod(
    period.value.mergeOptions({
      centsFractionDigits: props.centsFractionDigits
    })
  )
  generatorString.value = generator.value.toString()
}

function calculateExpensiveMosPattern() {
  try {
    if (method.value === 'generator') {
      expensiveMosPatterns.value = getMosPatterns(
        generator.value.totalCents() / period.value.totalCents(),
        numPeriods.value,
        MAX_SIZE,
        MAX_LENGTH
      )
    } else if (method.value === 'vals') {
      if (!subgroupString.value.length) {
        throw new Error('A subgroup must be given with vals')
      }
      expensiveMosPatterns.value = mosPatternsRank2FromVals(
        vals.value,
        subgroup.value,
        MAX_SIZE,
        MAX_LENGTH,
        options.value
      )
    } else if (method.value === 'commas') {
      expensiveMosPatterns.value = mosPatternsRank2FromCommas(
        commas.value,
        subgroup.value,
        MAX_SIZE,
        MAX_LENGTH,
        options.value
      )
    } else {
      // Please note that the button to initiate this calculation is not included in the UI due to lack of screen space.
      // The functionality is retained in case we ever tweak the UI.
      expensiveMosPatterns.value = getMosPatterns(
        circleGeneratorCents.value / circlePeriodCents.value,
        numPeriods.value,
        MAX_SIZE,
        MAX_LENGTH
      )
    }
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message)
      return
    }
    alert(error)
  }
}

function selectMosSize(mosSize: number) {
  size.value = mosSize
  if (method.value === 'vals' || method.value === 'commas') {
    let params: Rank2Params
    if (method.value === 'vals') {
      params = makeRank2FromVals(vals.value, mosSize, subgroup.value, options.value)
    } else {
      params = makeRank2FromCommas(commas.value, mosSize, subgroup.value, options.value)
    }
    const lineOptions = { centsFractionDigits: props.centsFractionDigits }
    generator.value = new Interval(
      ExtendedMonzo.fromCents(params.generator, DEFAULT_NUMBER_OF_COMPONENTS),
      'cents',
      undefined,
      lineOptions
    )
    generatorString.value = generator.value.name
    period.value = new Interval(
      ExtendedMonzo.fromCents(params.period, DEFAULT_NUMBER_OF_COMPONENTS),
      'cents',
      undefined,
      lineOptions
    )
    periodString.value = period.value.name
    numPeriods.value = params.numPeriods
    method.value = 'generator'
  }
}

function updateCircleGenerator(value: number) {
  generator.value = new Interval(
    ExtendedMonzo.fromCents(value, DEFAULT_NUMBER_OF_COMPONENTS),
    'cents'
  ).mergeOptions({ centsFractionDigits: props.centsFractionDigits })
  generatorString.value = generator.value.toString()
  generatorFineCents.value = '0'
  expensiveMosPatterns.value = []
}

function generate() {
  // Clear error for the next time the modal is opened
  error.value = ''
  try {
    if (method.value === 'circle') {
      consolidateCircle()
    }
    const lineOptions = { centsFractionDigits: props.centsFractionDigits }
    let size_ = size.value
    let down_ = down.value
    const n = numPeriods.value
    // The option to fill in colors is not shown in circle UI so it's ignored here.
    if (colorMethod.value === 'gaps' && method.value !== 'circle') {
      const colors = Array(n)
        .fill(
          gapKeyColors(
            generator.value.totalCents() / period.value.totalCents(),
            size_ / n,
            down_ / n,
            colorAccidentals.value === 'flat'
          )
        )
        .flat()
      size_ = colors.length
      if (colorAccidentals.value === 'flat') {
        down_ = size_ - n - up.value
      }
      emit('update:keyColors', colors)
    }
    const scale = Scale.fromRank2(
      generator.value.mergeOptions(lineOptions),
      period.value.mergeOptions(lineOptions),
      size_,
      down_,
      n
    )
    emit('update:scaleName', `Rank 2 temperament (${generatorString.value}, ${periodString.value})`)
    emit('update:scale', scale)
  } catch (error_) {
    console.error(error_)
    if (error_ instanceof Error) {
      error.value = error_.message
    } else {
      error.value = '' + error_
    }
  }
}
</script>

<template>
  <Modal extraStyle="width: 30rem" @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate rank 2 temperament</h2>
    </template>
    <template #body>
      <div>
        <div class="control-group">
          <div class="control radio-group">
            <label>Method</label>
            <span>
              <input type="radio" id="method-generator" value="generator" v-model="method" />
              <label for="method-generator"> Generator </label>
            </span>

            <span>
              <input type="radio" id="method-vals" value="vals" v-model="method" />
              <label for="method-vals"> Vals </label>
            </span>

            <span>
              <input type="radio" id="method-commas" value="commas" v-model="method" />
              <label for="method-commas"> Comma list </label>
            </span>

            <span>
              <input type="radio" id="method-circle" value="circle" v-model="method" />
              <label for="method-circle"> Circle</label>
            </span>
          </div>
        </div>

        <div class="control-group" v-show="method === 'generator'">
          <div class="control">
            <label for="generator">Generator</label>
            <ScaleLineInput
              id="generator"
              placeholder="3/2"
              v-model="generatorString"
              @update:value="generator = $event"
              :defaultValue="FIFTH"
            />
            <button @click="flipGenerator">Flip to {{ opposite }}</button>
          </div>

          <div class="control">
            <label for="period">Period</label>
            <ScaleLineInput
              id="period"
              placeholder="2/1"
              v-model="periodString"
              @update:value="period = $event"
              :defaultValue="OCTAVE"
            />
          </div>

          <div class="control">
            <label for="num-periods">Number of periods</label>
            <input id="num-periods" type="number" min="1" max="99" v-model="numPeriods" />
          </div>

          <div class="control">
            <label for="up">Generators up/down from 1/1</label>
            <input id="up" type="number" min="0" :step="numPeriods" :max="upMax" v-model="up" />
            <input id="down" type="number" disabled :value="down" min="0" :max="upMax" />
          </div>

          <div class="control">
            <label for="size"
              >Scale size{{ numPeriods === 1 ? '' : ` (multiple of ${numPeriods})` }}</label
            >
            <input
              id="size"
              type="number"
              :min="numPeriods"
              max="999"
              :step="numPeriods"
              v-model="size"
            />
          </div>
        </div>

        <div class="control-group" v-show="method === 'vals'">
          <div class="control">
            <label for="vals">Vals</label>
            <input type="text" id="vals" placeholder="12 & 17c" v-model="valsString" />
          </div>
        </div>

        <div class="control-group" v-show="method === 'commas'">
          <div class="control">
            <label for="commas">Comma list</label>
            <input
              type="text"
              id="commas"
              placeholder="225/224, 1029/1024"
              v-model="commasString"
            />
          </div>
        </div>

        <div class="control-group" v-show="method === 'vals' || method === 'commas'">
          <div class="control">
            <label for="subgroup">Subgroup / Prime limit</label>
            <input
              type="text"
              ref="subgroupInput"
              id="subgroup"
              :placeholder="method === 'vals' ? '2.3.5' : ''"
              v-model="subgroupString"
            />
          </div>
        </div>

        <div class="control-group" v-show="method === 'circle'">
          <div class="square">
            <PeriodCircle
              :scale="scale"
              :generatorCents="circleGeneratorCents"
              :periodCents="circlePeriodCents"
              :size="generatorsPerPeriod"
              :up="up / numPeriods"
              @update:generatorCents="updateCircleGenerator"
            />
          </div>
          <div class="control">
            <label for="period-stretch">Period stretch</label>
            <input
              class="wide-range"
              type="range"
              id="period-stretch"
              step="any"
              min="-0.05"
              max="0.05"
              v-model="periodStretch"
            />
            <label for="generator-fine-tune">Generator fine-tune</label>
            <input
              class="wide-range"
              type="range"
              id="generator-fine-tune"
              step="any"
              min="-5"
              max="5"
              v-model="generatorFineCents"
            />
          </div>
        </div>

        <template v-if="method !== 'circle'">
          <div :class="{ error: mosPatternsError.length }">
            <strong>MOS sizes</strong>
            <span v-show="mosPatternsError.length">⚠</span>
          </div>
          <div class="btn-group" v-if="mosPatterns.length">
            <button
              v-for="(mosInfo, i) of mosPatterns"
              :key="i"
              @mouseenter="previewMosPattern = mosInfo.mosPattern"
              @mouseleave="previewMosPattern = ''"
              @click="selectMosSize(mosInfo.size)"
            >
              {{ mosInfo.size }}
            </button>
          </div>
          <div class="btn-group" v-else>
            <button @click="calculateExpensiveMosPattern">Calculate MOS sizes...</button>
          </div>
        </template>
        <div class="control-group" v-else>
          <div class="control">
            <label for="generators-per-period">Generators per period</label>
            <input
              id="generators-per-period"
              type="number"
              min="1"
              max="999"
              step="1"
              v-model="generatorsPerPeriod"
            />
          </div>
        </div>

        <div class="control-group" v-if="method !== 'circle'">
          <div class="control radio-group">
            <label>Generate key colors</label>
            <span>
              <input type="radio" id="color-none" value="none" v-model="colorMethod" />
              <label for="color-none"> Off </label>
            </span>
            <span>
              <input type="radio" id="color-gaps" value="gaps" v-model="colorMethod" />
              <label for="color-gaps"> Fill gaps (expand scale) </label>
            </span>
          </div>
          <div class="control radio-group" v-show="colorMethod !== 'none'">
            <label>Black keys are</label>
            <span>
              <input type="radio" id="sharp" value="sharp" v-model="colorAccidentals" />
              <label for="sharp"> Sharp </label>
            </span>
            <span>
              <input type="radio" id="flat" value="flat" v-model="colorAccidentals" />
              <label for="flat"> Flat </label>
            </span>
          </div>
        </div>
      </div>
      <div v-show="method === 'vals' || method === 'commas'">
        <p class="section" :class="{ open: showAdvanced }" @click="showAdvanced = !showAdvanced">
          Advanced options
        </p>
        <div class="control-group" v-show="showAdvanced">
          <div class="control radio-group">
            <span>
              <input type="radio" id="tempering-TE" value="TE" v-model="tempering" />
              <label for="tempering-TE"> TE </label>
            </span>

            <span>
              <input type="radio" id="tempering-POTE" value="POTE" v-model="tempering" />
              <label for="tempering-POTE"> POTE </label>
            </span>

            <span>
              <input type="radio" id="tempering-CTE" value="CTE" v-model="tempering" />
              <label for="tempering-CTE"> CTE </label>
            </span>
          </div>

          <div class="control" v-show="tempering === 'CTE'">
            <label for="constraints">Constraints</label>
            <textarea id="constraints" v-model="constraintsString"></textarea>
          </div>

          <div class="control">
            <label for="weights">Weights</label>
            <textarea id="weights" v-model="weightsString"></textarea>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="generate" :disabled="method === 'vals' || method === 'commas'">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <span class="error" v-show="error.length">⚠</span>
        <i>{{ previewMosPattern }}</i>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.square {
  position: relative;
  width: 95%;
  overflow: hidden;
}
.square::before {
  content: '';
  display: block;
  padding-top: 100%;
}
.square :first-child {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

.wide-range {
  width: 100%;
}
</style>
