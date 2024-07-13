<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS, FIFTH, OCTAVE } from '@/constants'
import { makeRank2FromVals, makeRank2FromCommas, type Rank2Params } from '@/tempering'
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import PeriodCircle from '@/components/PeriodCircle.vue'
import { gapKeyColors, setAndReportValidity } from '@/utils'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { ExtendedMonzo, Interval, Scale } from 'scale-workshop-core'
import { useRank2Store } from '@/stores/tempering'

const props = defineProps<{
  show: boolean
  centsFractionDigits: number
  scale: Scale
}>()

const rank2 = useRank2Store()

const emit = defineEmits(['update:scaleName', 'update:scale', 'update:keyColors', 'cancel'])

const commasInput = ref<HTMLInputElement | null>(null)
const valsInput = ref<HTMLInputElement | null>(null)
const subgroupInput = ref<HTMLInputElement | null>(null)

// === Watchers ===

// Consolidate circle method's fine tuning to hard values when changing "tabs"
function consolidateCircle() {
  const options = { centsFractionDigits: props.centsFractionDigits }
  rank2.period = new Interval(
    ExtendedMonzo.fromCents(rank2.circlePeriodCents, DEFAULT_NUMBER_OF_COMPONENTS),
    'cents'
  ).mergeOptions(options)
  rank2.periodString = rank2.period.toString()
  rank2.generator = new Interval(
    ExtendedMonzo.fromCents(rank2.circleGeneratorCents, DEFAULT_NUMBER_OF_COMPONENTS),
    'cents'
  ).mergeOptions(options)
  rank2.generatorString = rank2.generator.toString()
  rank2.periodStretch = '0'
  rank2.generatorFineCents = '0'
}

watch(
  () => rank2.method,
  (_, oldValue) => {
    if (oldValue === 'circle') {
      consolidateCircle()
    }
  }
)

watch(
  () => rank2.subgroupError,
  (newValue) => setAndReportValidity(subgroupInput.value, newValue)
)

watch(
  () => rank2.mosPatternsError,
  (newValue) => {
    if (document.activeElement === subgroupInput.value) {
      setAndReportValidity(valsInput.value, '')
      setAndReportValidity(commasInput.value, '')
      setAndReportValidity(subgroupInput.value, newValue)
      return
    } else {
      setAndReportValidity(subgroupInput.value, '')
    }
    if (rank2.method === 'commas') {
      setAndReportValidity(commasInput.value, newValue)
      setAndReportValidity(valsInput.value, '')
    } else if (rank2.method === 'vals') {
      setAndReportValidity(commasInput.value, '')
      setAndReportValidity(valsInput.value, newValue)
    }
  }
)

// === Methods ===

function flipGenerator() {
  rank2.generator = rank2.generator.neg().mmod(
    rank2.period.mergeOptions({
      centsFractionDigits: props.centsFractionDigits
    })
  )
  rank2.generatorString = rank2.generator.toString()
}

function selectMosSize(mosSize: number) {
  rank2.size = mosSize
  if (rank2.method === 'vals' || rank2.method === 'commas') {
    let params: Rank2Params
    if (rank2.method === 'vals') {
      params = makeRank2FromVals(rank2.vals, mosSize, rank2.subgroup, rank2.options)
    } else {
      params = makeRank2FromCommas(rank2.commas, mosSize, rank2.subgroup, rank2.options)
    }
    const lineOptions = { centsFractionDigits: props.centsFractionDigits }
    rank2.generator = new Interval(
      ExtendedMonzo.fromCents(params.generator, DEFAULT_NUMBER_OF_COMPONENTS),
      'cents',
      undefined,
      lineOptions
    )
    rank2.generatorString = rank2.generator.toString()
    rank2.period = new Interval(
      ExtendedMonzo.fromCents(params.period, DEFAULT_NUMBER_OF_COMPONENTS),
      'cents',
      undefined,
      lineOptions
    )
    rank2.periodString = rank2.period.toString()
    rank2.numPeriods = params.numPeriods
    rank2.method = 'generator'
  }
}

function updateCircleGenerator(value: number) {
  rank2.generator = new Interval(
    ExtendedMonzo.fromCents(value, DEFAULT_NUMBER_OF_COMPONENTS),
    'cents'
  ).mergeOptions({ centsFractionDigits: props.centsFractionDigits })
  rank2.generatorString = rank2.generator.toString()
  rank2.generatorFineCents = '0'
  rank2.expensiveMosPatterns = []
}

function generate() {
  // Clear error for the next time the modal is opened
  rank2.error = ''
  try {
    if (rank2.method === 'circle') {
      consolidateCircle()
    }
    const lineOptions = { centsFractionDigits: props.centsFractionDigits }
    let size_ = rank2.safeSize
    let down_ = rank2.down
    const n = rank2.safeNumPeriods
    // The option to fill in colors is not shown in circle UI so it's ignored here.
    if (rank2.colorMethod === 'gaps' && rank2.method !== 'circle') {
      const colors = Array(n)
        .fill(
          gapKeyColors(
            rank2.generator.totalCents() / rank2.period.totalCents(),
            size_ / n,
            down_ / n,
            rank2.colorAccidentals === 'flat'
          )
        )
        .flat()
      size_ = colors.length
      if (rank2.colorAccidentals === 'flat') {
        down_ = size_ - n - rank2.up
      }
      emit('update:keyColors', colors)
    }
    const scale = Scale.fromRank2(
      rank2.generator.mergeOptions(lineOptions),
      rank2.period.mergeOptions(lineOptions),
      size_,
      down_,
      n
    )
    emit('update:scaleName', `Rank 2 temperament (${rank2.generatorString}, ${rank2.periodString})`)
    emit('update:scale', scale)
  } catch (error_) {
    console.error(error_)
    if (error_ instanceof Error) {
      rank2.error = error_.message
    } else {
      rank2.error = '' + error_
    }
  }
}
</script>

<template>
  <Modal :show="show" extraStyle="width: 30rem" @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate rank 2 temperament</h2>
    </template>
    <template #body>
      <div>
        <div class="control-group">
          <div class="control radio-group">
            <label>Method</label>
            <span>
              <input type="radio" id="method-generator" value="generator" v-model="rank2.method" />
              <label for="method-generator"> Generator </label>
            </span>

            <span>
              <input type="radio" id="method-vals" value="vals" v-model="rank2.method" />
              <label for="method-vals"> Vals </label>
            </span>

            <span>
              <input type="radio" id="method-commas" value="commas" v-model="rank2.method" />
              <label for="method-commas"> Comma list </label>
            </span>

            <span>
              <input type="radio" id="method-circle" value="circle" v-model="rank2.method" />
              <label for="method-circle"> Circle</label>
            </span>
          </div>
        </div>

        <div class="control-group" v-show="rank2.method === 'generator'">
          <div class="control">
            <label for="generator">Generator</label>
            <ScaleLineInput
              id="generator"
              placeholder="3/2"
              v-model="rank2.generatorString"
              @update:value="rank2.generator = $event"
              :defaultValue="FIFTH"
            />
            <button @click="flipGenerator">Flip to {{ rank2.opposite }}</button>
          </div>

          <div class="control">
            <label for="period">Period</label>
            <ScaleLineInput
              id="period"
              placeholder="2/1"
              v-model="rank2.periodString"
              @update:value="rank2.period = $event"
              :defaultValue="OCTAVE"
            />
          </div>

          <div class="control">
            <label for="num-periods">Number of periods</label>
            <input id="num-periods" type="number" min="1" max="99" v-model="rank2.numPeriods" />
          </div>

          <div class="control">
            <label for="up">Generators up/down from 1/1</label>
            <input
              id="up"
              type="number"
              min="0"
              :step="rank2.numPeriods"
              :max="rank2.upMax"
              v-model="rank2.up"
            />
            <input
              id="down"
              type="number"
              disabled
              :value="rank2.down"
              min="0"
              :max="rank2.upMax"
            />
          </div>

          <div class="control">
            <label for="size"
              >Scale size{{
                rank2.numPeriods === 1 ? '' : ` (multiple of ${rank2.numPeriods})`
              }}</label
            >
            <input
              id="size"
              type="number"
              :min="rank2.numPeriods"
              max="999"
              :step="rank2.numPeriods"
              v-model="rank2.size"
            />
          </div>
        </div>

        <div class="control-group" v-show="rank2.method === 'vals'">
          <div class="control">
            <label for="vals">Vals</label>
            <input
              ref="valsInput"
              type="text"
              id="vals"
              placeholder="12 & 17c"
              v-model="rank2.valsString"
            />
          </div>
        </div>

        <div class="control-group" v-show="rank2.method === 'commas'">
          <div class="control">
            <label for="commas">Comma list</label>
            <input
              ref="commasInput"
              type="text"
              id="commas"
              placeholder="225/224, 1029/1024"
              v-model="rank2.commasString"
            />
          </div>
        </div>

        <div class="control-group" v-show="rank2.method === 'vals' || rank2.method === 'commas'">
          <div class="control">
            <label for="subgroup">Subgroup / Prime limit</label>
            <input
              type="text"
              ref="subgroupInput"
              id="subgroup"
              :placeholder="rank2.method === 'vals' ? '2.3.5' : ''"
              v-model="rank2.subgroupString"
            />
          </div>
        </div>

        <div class="control-group" v-show="rank2.method === 'circle'">
          <div class="square">
            <PeriodCircle
              :scale="scale"
              :generatorCents="rank2.circleGeneratorCents"
              :periodCents="rank2.circlePeriodCents"
              :size="rank2.generatorsPerPeriod"
              :up="rank2.safeUp / rank2.safeNumPeriods"
              :numPeriods="rank2.safeNumPeriods"
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
              v-model="rank2.periodStretch"
            />
            <label for="generator-fine-tune">Generator fine-tune</label>
            <input
              class="wide-range"
              type="range"
              id="generator-fine-tune"
              step="any"
              min="-5"
              max="5"
              v-model="rank2.generatorFineCents"
            />
          </div>
        </div>

        <template v-if="rank2.method !== 'circle'">
          <div :class="{ error: rank2.mosPatternsError.length }">
            <strong>MOS sizes</strong>
            <span v-show="rank2.mosPatternsError.length">⚠</span>
          </div>
          <div class="btn-group" v-if="rank2.mosPatterns.length">
            <button
              v-for="(mosInfo, i) of rank2.mosPatterns"
              :key="i"
              @mouseenter="rank2.previewMosPattern = mosInfo.mosPattern"
              @mouseleave="rank2.previewMosPattern = ''"
              @click="selectMosSize(mosInfo.size)"
            >
              {{ mosInfo.size }}
            </button>
          </div>
          <div class="btn-group" v-else>
            <button @click="rank2.calculateExpensiveMosPattern">Calculate MOS sizes...</button>
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
              v-model="rank2.generatorsPerPeriod"
            />
          </div>
        </div>

        <div class="control-group" v-if="rank2.method !== 'circle'">
          <div class="control radio-group">
            <label>Generate key colors</label>
            <span>
              <input type="radio" id="color-none" value="none" v-model="rank2.colorMethod" />
              <label for="color-none"> Off </label>
            </span>
            <span>
              <input type="radio" id="color-gaps" value="gaps" v-model="rank2.colorMethod" />
              <label for="color-gaps"> Fill gaps (expand scale) </label>
            </span>
          </div>
          <div class="control radio-group" v-show="rank2.colorMethod !== 'none'">
            <label>Black keys are</label>
            <span>
              <input type="radio" id="sharp" value="sharp" v-model="rank2.colorAccidentals" />
              <label for="sharp"> Sharp </label>
            </span>
            <span>
              <input type="radio" id="flat" value="flat" v-model="rank2.colorAccidentals" />
              <label for="flat"> Flat </label>
            </span>
          </div>
        </div>
      </div>
      <div v-show="rank2.method === 'vals' || rank2.method === 'commas'">
        <p
          class="section"
          :class="{ open: rank2.showAdvanced }"
          @click="rank2.showAdvanced = !rank2.showAdvanced"
        >
          Advanced options
        </p>
        <div class="control-group" v-show="rank2.showAdvanced">
          <div class="control radio-group">
            <span>
              <input type="radio" id="tempering-TE" value="TE" v-model="rank2.tempering" />
              <label for="tempering-TE"> TE </label>
            </span>

            <span>
              <input type="radio" id="tempering-POTE" value="POTE" v-model="rank2.tempering" />
              <label for="tempering-POTE"> POTE </label>
            </span>

            <span>
              <input type="radio" id="tempering-CTE" value="CTE" v-model="rank2.tempering" />
              <label for="tempering-CTE"> CTE </label>
            </span>
          </div>

          <div class="control" v-show="rank2.tempering === 'CTE'">
            <label for="constraints">Constraints</label>
            <textarea id="constraints" v-model="rank2.constraintsString"></textarea>
          </div>

          <div class="control">
            <label for="weights">Weights</label>
            <textarea id="weights" v-model="rank2.weightsString"></textarea>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="generate" :disabled="rank2.method === 'vals' || rank2.method === 'commas'">
          OK
        </button>
        <button @click="$emit('cancel')">Cancel</button>
        <span class="error" v-show="rank2.error.length">⚠</span>
        <i>{{ rank2.previewMosPattern }}</i>
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
