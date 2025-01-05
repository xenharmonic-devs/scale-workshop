<script setup lang="ts">
import { FIFTH, OCTAVE } from '@/constants'
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import PeriodCircle from '@/components/PeriodCircle.vue'
import { expandCode, gapKeyColors, parseCents } from '@/utils'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { useRank2Store } from '@/stores/tempering'
import { Interval, intervalValueAs } from 'sonic-weave'
import { useScaleStore } from '@/stores/scale'
import { mmod } from 'xen-dev-utils'
import type { MosInfo } from 'moment-of-symmetry'

const EPSILON = 1e-12

const scale = useScaleStore()
const rank2 = useRank2Store()

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['update:scaleName', 'update:source', 'cancel'])

const commasInput = ref<HTMLInputElement | null>(null)
const valsInput = ref<HTMLInputElement | null>(null)
const subgroupInput = ref<HTMLInputElement | null>(null)

// === Watchers ===

// Consolidate circle method's fine tuning to hard values when changing "tabs"
function consolidateCircle() {
  rank2.period = parseCents(rank2.circlePeriodCents, scale.centsFractionDigits)
  rank2.periodString = rank2.period.toString()

  rank2.generator = parseCents(rank2.circleGeneratorCents, scale.centsFractionDigits)
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

// === Methods ===

function flipGenerator() {
  const g = rank2.generator
  const value = g.value.inverse().reduce(rank2.period.value)
  rank2.generator = new Interval(value, g.domain, 0, intervalValueAs(value, g.node), g)
  rank2.generatorString = rank2.generator.toString()
}

function selectMosSize(mosSize: number) {
  rank2.size = mosSize
  if (rank2.method === 'vals' || rank2.method === 'commas') {
    let [period, generator] = rank2.temperament.generators
    generator = mmod(generator, period)

    rank2.numPeriods = rank2.temperament.numberOfPeriods
    rank2.method = 'generator'

    rank2.period = parseCents(period, scale.centsFractionDigits)
    rank2.periodString = rank2.period.toString()

    rank2.generator = parseCents(generator, scale.centsFractionDigits)
    rank2.generatorString = rank2.generator.toString()
  }
}

function updateCircleGenerator(value: number) {
  rank2.generator = parseCents(value, scale.centsFractionDigits)
  rank2.generatorString = rank2.generator.toString()
  rank2.generatorFineCents = '0'
}

function chromaAndHardness(size: number) {
  const g = rank2.generatorPerPeriod
  const scalePerPeriod = [...Array(size).keys()].map((i) => mmod(i * g, 1))
  scalePerPeriod.sort((a, b) => a - b)
  scalePerPeriod.push(1)
  let L = scalePerPeriod[1]
  let s = scalePerPeriod[1]
  for (let i = 0; i < size; ++i) {
    const other = scalePerPeriod[i + 1] - scalePerPeriod[i]
    // Epsilon works around floating point noise
    if (other + EPSILON < s) {
      s = other
      break
    } else if (other - EPSILON > L) {
      L = other
      break
    }
  }
  const p = rank2.period.totalCents()
  if (!p) {
    return {
      chroma: 0,
      hardness: L / s
    }
  }
  L *= p
  s *= p
  return {
    chroma: L - s,
    hardness: L / s
  }
}

function setPreview(mosInfo: MosInfo) {
  const { chroma, hardness } = chromaAndHardness(mosInfo.size)
  rank2.previewMosPattern = `${mosInfo.mosPattern}, L/s: ${hardness.toFixed(2)}, L-s: ${chroma.toFixed(1)}¢`
}

function generate(expand = true) {
  if (rank2.method === 'circle') {
    consolidateCircle()
  }
  let size = rank2.safeSize
  let up = rank2.safeUp
  let down = rank2.down
  const n = rank2.safeNumPeriods

  let labelString = ''

  // The option to fill in colors is not shown in circle UI so it's ignored here.
  if (rank2.colorMethod === 'gaps' && rank2.method !== 'circle') {
    const colors = Array(n)
      .fill(
        gapKeyColors(
          rank2.generator.totalCents() / rank2.period.totalCents(),
          size / n,
          down / n,
          rank2.colorAccidentals === 'flat'
        )
      )
      .flat() as ('black' | 'white')[]
    size = colors.length
    if (rank2.colorAccidentals === 'flat') {
      down = size - n - rank2.up
    } else {
      up = size - n - rank2.down
    }
    labelString = `\n[${colors.join(', ')}]`
  }
  const source = `rank2(${rank2.generator.toString()}, ${up}, ${down}, ${rank2.period.toString()}, ${n})${labelString}`
  emit('update:scaleName', `Rank 2 temperament (${rank2.generatorString}, ${rank2.periodString})`)
  if (expand) {
    emit('update:source', expandCode(source))
  } else {
    emit('update:source', source)
  }
}
</script>

<template>
  <Modal :show="show" @confirm="generate" @cancel="$emit('cancel')">
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
              <label for="method-generator">Generator</label>
            </span>

            <span>
              <input type="radio" id="method-vals" value="vals" v-model="rank2.method" />
              <label for="method-vals">Vals</label>
            </span>

            <span>
              <input type="radio" id="method-commas" value="commas" v-model="rank2.method" />
              <label for="method-commas">Comma list</label>
            </span>

            <span>
              <input type="radio" id="method-circle" value="circle" v-model="rank2.method" />
              <label for="method-circle">Circle</label>
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
              :scale="scale.scale"
              :labels="scale.labels"
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

        <div class="control-group" v-show="rank2.method === 'circle'">
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

        <div class="control-group" v-show="rank2.method !== 'circle'">
          <div class="control radio-group">
            <label>Generate key colors</label>
            <span>
              <input type="radio" id="color-none" value="none" v-model="rank2.colorMethod" />
              <label for="color-none">Off</label>
            </span>
            <span>
              <input type="radio" id="color-gaps" value="gaps" v-model="rank2.colorMethod" />
              <label for="color-gaps">Fill gaps (expand scale)</label>
            </span>
          </div>
          <div class="control radio-group" v-show="rank2.colorMethod !== 'none'">
            <label>Black keys are</label>
            <span>
              <input type="radio" id="sharp" value="sharp" v-model="rank2.colorAccidentals" />
              <label for="sharp">Sharp</label>
            </span>
            <span>
              <input type="radio" id="flat" value="flat" v-model="rank2.colorAccidentals" />
              <label for="flat">Flat</label>
            </span>
          </div>
        </div>
      </div>
      <div class="control-group" v-show="rank2.method === 'vals' || rank2.method === 'commas'">
        <div class="control radio-group">
          <span>
            <input type="radio" id="tempering-TE" value="TE" v-model="rank2.optimizationScheme" />
            <label for="tempering-TE">TE</label>
          </span>

          <span>
            <input
              type="radio"
              id="tempering-POTE"
              value="POTE"
              v-model="rank2.optimizationScheme"
            />
            <label for="tempering-POTE">POTE</label>
          </span>

          <span>
            <input type="radio" id="tempering-CTE" value="CTE" v-model="rank2.optimizationScheme" />
            <label for="tempering-CTE">CTE</label>
          </span>
        </div>
        <p
          class="section"
          :class="{ open: rank2.showAdvanced }"
          @click="rank2.showAdvanced = !rank2.showAdvanced"
        >
          Advanced options
        </p>
        <div class="control" v-show="rank2.showAdvanced">
          <label for="weights">Weights for {{ rank2.subgroupLabel }}</label>
          <textarea id="weights" v-model="rank2.weightsString"></textarea>
        </div>
        <p class="warning">{{ rank2.error }}</p>
      </div>
      <div class="control-group" v-show="rank2.method !== 'circle'">
        <div :class="{ error: rank2.mosPatternsError.length }">
          <strong>MOS sizes</strong>
          <span v-show="rank2.mosPatternsError.length">⚠</span>
        </div>
        <div class="btn-group" v-if="rank2.mosPatterns.length">
          <button
            v-for="(mosInfo, i) of rank2.mosPatterns"
            :key="i"
            @mouseenter="setPreview(mosInfo)"
            @mouseleave="rank2.previewMosPattern = ''"
            @click="selectMosSize(mosInfo.size)"
          >
            {{ mosInfo.size }}
          </button>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button
          @click="generate(true)"
          :disabled="rank2.method === 'vals' || rank2.method === 'commas'"
        >
          OK
        </button>
        <button @click="$emit('cancel')">Cancel</button>
        <button
          @click="generate(false)"
          :disabled="rank2.method === 'vals' || rank2.method === 'commas'"
        >
          Raw
        </button>
        <span class="error" v-show="rank2.mosPatternsError.length">⚠</span>
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

p.warning {
  height: 3em;
  width: 29em;
  overflow-y: hidden;
}

/* Content layout (medium) */
@media screen and (min-width: 600px) {
  .modal-mask :deep(.modal-container) {
    min-width: 30rem;
    max-width: 31rem;
  }
}
</style>
