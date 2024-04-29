<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { computed } from 'vue'
import { DEFAULT_NUMBER_OF_COMPONENTS, FIFTH, OCTAVE } from '@/constants'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { circleDifference, mmod } from 'xen-dev-utils'
import { mosSizes } from 'moment-of-symmetry'
import { spineLabel as spineLabel_, parseInterval, expandCode } from '@/utils'
import { useHistoricalStore } from '@/stores/historical'
import { useStateStore } from '@/stores/state'
import { Interval, TimeMonzo } from 'sonic-weave'
import { useScaleStore } from '@/stores/scale'

const emit = defineEmits([
  'update:scaleName',
  'update:source',
  'update:baseFrequency',
  'update:baseMidiNote',
  'cancel'
])

const state = useStateStore()
const scale = useScaleStore()
const historical = useHistoricalStore()

// The presets default to middle C when there's an 'F' in the scale i.e. down >= 1
const KEY_COLORS_C = [
  // 'white', // Implicit unison
  'black',
  'white',
  'black',
  'white',
  'white',
  'black',
  'white',
  'black',
  'white',
  'black',
  'white',
  'white' // Unison
]

const MIDI_NOTE_C = 60
const FREQUENCY_C = 261.6255653005986

const MAX_SIZE = 99
const MAX_LENGTH = 10

const HARMONIC_SEVENTH = new Interval(
  TimeMonzo.fromFraction('7/4', DEFAULT_NUMBER_OF_COMPONENTS),
  'linear'
)

const SYNTONIC = new Interval(
  TimeMonzo.fromFraction('81/80', DEFAULT_NUMBER_OF_COMPONENTS),
  'linear'
)

function spineLabel(up: number) {
  return spineLabel_(up, scale.accidentalPreference)
}

const mosSizeList = computed(() => {
  const p = historical.method === 'simple' ? 1200 : historical.period.totalCents()
  const g = temperedGenerator.value.totalCents()
  const sizes = mosSizes(g / p, MAX_SIZE, MAX_LENGTH + 2)
  if (p > 600) {
    while (sizes.length && sizes[0] < 4) {
      sizes.shift()
    }
  }
  while (sizes.length > MAX_LENGTH) {
    sizes.pop()
  }
  return sizes
})

const strengthSlider = computed({
  get: () => historical.temperingStrength,
  set(newValue: number) {
    // There's something wrong with how input ranges are handled.
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      historical.temperingStrength = newValue
    }
  }
})

const temperedGenerator = computed(() => {
  if (historical.method === 'simple') {
    return historical.generator
  }
  const cents =
    historical.pureGenerator.totalCents() + historical.tempering * historical.temperingStrength
  return parseInterval(cents.toFixed(state.centsFractionDigits))
})

const enharmonicCents = computed(() => {
  const ws = historical.wellIntervals
  return circleDifference(ws[ws.length - 1].totalCents(), ws[0].totalCents()).toFixed(
    state.centsFractionDigits
  )
})

function onWellCommaInput(event: Event, i: number) {
  historical.wellCommaFractionStrings.set(
    i - 1 - historical.down,
    (event.target as HTMLInputElement).value
  )
  historical.selectedWellPreset = 'none'
}

function generate(expand = true) {
  let source: string
  if (historical.method === 'simple') {
    source = `rank2(${temperedGenerator.value.toString()}, ${historical.up}, ${historical.down})`

    if (historical.selectedPreset in historical.presets) {
      emit('update:scaleName', historical.presets[historical.selectedPreset].name)
    } else {
      emit('update:scaleName', `Rank 2 temperament (${historical.generatorString})`)
    }
  } else if (historical.method === 'target') {
    source = `rank2(${temperedGenerator.value.toString()}, ${historical.up}, ${historical.down}, ${historical.period.toString()})`

    let genString = temperedGenerator.value.toString()
    if (historical.format === 'cents') {
      genString = temperedGenerator.value.totalCents().toFixed(state.centsFractionDigits)
    }
    emit('update:scaleName', `Rank 2 temperament (${genString}, ${historical.periodString})`)
  } else {
    const commaFractions = historical.wellCommaFractions
      .slice(0, -1)
      .map((f) => f.toFraction())
      .join(', ')
    source = `wellTemperament([${commaFractions}], ${historical.wellComma.toString()}, ${historical.down})`
    if (historical.selectedWellPreset in historical.wellPresets) {
      emit('update:scaleName', historical.wellPresets[historical.selectedWellPreset].name)
    } else {
      emit('update:scaleName', 'Custom Well Temperament')
    }
  }
  if (historical.format === 'cents') {
    source += `\ni => cents(i, ${state.centsFractionDigits})`
  }
  // Check if the scale can be centered around C
  if (
    historical.size === 12 &&
    historical.down >= 1 &&
    (historical.method === 'simple' || historical.method === 'well temperament')
  ) {
    emit('update:baseFrequency', FREQUENCY_C)
    emit('update:baseMidiNote', MIDI_NOTE_C)
    source += `\n[${KEY_COLORS_C.join(', ')}]`
    const labels: string[] = []
    for (let i = 0; i < historical.size; ++i) {
      labels[mmod(7 * (i - historical.down) - 1, historical.size)] = JSON.stringify(
        spineLabel(i - historical.down)
      )
    }
    source += `\n[${labels.join(', ')}]`
  }
  if (expand) {
    source = expandCode(source)
  }
  emit('update:source', source)
}
</script>
<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate historical temperament</h2>
    </template>
    <template #body>
      <div>
        <div class="control-group">
          <div class="control radio-group">
            <label>Method</label>
            <span>
              <input
                type="radio"
                id="method-simple"
                value="simple"
                v-model="historical.method"
                @input="historical.selectPreset(historical.selectedPreset)"
              />
              <label for="method-simple">Simple</label>
            </span>

            <span>
              <input
                type="radio"
                id="method-target"
                value="target"
                v-model="historical.method"
                @input="historical.down = 1"
              />
              <label for="method-target">Target</label>
            </span>

            <span>
              <input
                type="radio"
                id="method-well"
                value="well temperament"
                v-model="historical.method"
                @input="historical.selectWellPreset(historical.selectedWellPreset)"
              />
              <label for="method-well">Well Temperament</label>
            </span>
          </div>
        </div>

        <div class="control-group" v-show="historical.method === 'simple'">
          <div class="control">
            <label for="generator">Interval to stack</label>
            <ScaleLineInput
              id="generator"
              placeholder="3/2"
              :defaultValue="FIFTH"
              v-model="historical.generatorString"
              @update:value="historical.generator = $event"
              @input="historical.selectedPreset = 'none'"
            />
          </div>
          <div class="control">
            <label for="size">Scale size</label>
            <input id="size" type="number" min="1" max="999" v-model="historical.size" />
          </div>
          <div class="control">
            <label for="down">Down (number of fourths)</label>
            <input
              id="down"
              type="number"
              min="0"
              :max="historical.size - 1"
              v-model="historical.down"
            />
          </div>
          <div class="control radio-group">
            <label>Format</label>
            <span>
              <input id="format-cents" type="radio" value="cents" v-model="historical.format" />
              <label for="format-cents">cents</label>
            </span>
            <span>
              <input id="format-default" type="radio" value="default" v-model="historical.format" />
              <label for="format-default">default</label>
            </span>
          </div>
          <div class="control">
            <label for="presets">Presets</label>
            <select id="presets" v-model="historical.selectedPreset">
              <option v-for="key of historical.presetKeys" :key="key" :value="key">
                {{ historical.presets[key].name }}
              </option>
            </select>
          </div>
        </div>

        <div class="control-group" v-show="historical.method === 'target'">
          <div class="control">
            <label for="pure-generator">Stacking interval</label>
            <ScaleLineInput
              id="pure-generator"
              placeholder="3/2"
              v-model="historical.pureGeneratorString"
              :defaultValue="FIFTH"
              @update:value="historical.pureGenerator = $event"
            />
          </div>
          <div class="control">
            <label for="target">Target interval</label>
            <ScaleLineInput
              id="target"
              placeholder="7/4"
              v-model="historical.targetString"
              :defaultValue="HARMONIC_SEVENTH"
              @update:value="historical.target = $event"
            />
          </div>
          <div class="control">
            <label for="period">Period</label>
            <ScaleLineInput
              id="period"
              placeholder="2/1"
              v-model="historical.periodString"
              :defaultValue="OCTAVE"
              @update:value="historical.period = $event"
            />
          </div>
          <div class="control">
            <label for="search-range">Search range</label>
            <input id="search-range" type="number" v-model="historical.searchRange" />
          </div>
          <div class="control">
            <label for="candidates">Exponent / Tempering</label>
            <select id="candidates" v-model="historical.pureExponent">
              <option
                v-for="candidate of historical.candidates"
                :key="candidate.exponent"
                :value="candidate.exponent"
              >
                {{ candidate.exponent }} /
                {{ candidate.tempering.toFixed(state.centsFractionDigits) }} ¢
              </option>
            </select>
          </div>
          <label for="tempering-strength">Tempering strength</label>
          <input
            id="tempering-strength"
            class="control"
            type="range"
            min="0"
            max="1"
            step="any"
            v-model="strengthSlider"
          />
          <button class="control" @click="historical.equalizeBeating">Equalize beating</button>
          <div class="control">
            <label for="size">Scale size</label>
            <input id="size" type="number" min="1" max="999" v-model="historical.size" />
          </div>
          <div class="control">
            <label for="down">Down</label>
            <input
              id="down"
              type="number"
              min="0"
              :max="historical.size - 1"
              v-model="historical.down"
            />
          </div>
          <div class="control radio-group">
            <label>Format</label>
            <span>
              <input id="format-cents" type="radio" value="cents" v-model="historical.format" />
              <label for="format-cents">cents</label>
            </span>
            <span>
              <input id="format-default" type="radio" value="default" v-model="historical.format" />
              <label for="format-default">default</label>
            </span>
          </div>
        </div>

        <div class="control-group" v-show="historical.method === 'well temperament'">
          <div class="control">
            <label for="size">Scale size</label>
            <input
              id="size"
              type="number"
              min="1"
              max="999"
              v-model="historical.size"
              @input="historical.selectedWellPreset = 'none'"
            />
          </div>
          <div class="control">
            <label for="down">Down (number of fourths)</label>
            <input
              id="down"
              type="number"
              min="0"
              :max="historical.size - 1"
              v-model="historical.down"
              @input="historical.selectedWellPreset = 'none'"
            />
          </div>
          <div class="control">
            <label for="well-comma">Comma</label>
            <ScaleLineInput
              id="well-comma"
              placeholder="81/80"
              v-model="historical.wellCommaString"
              :defaultValue="SYNTONIC"
              @update:value="historical.wellComma = $event"
              @input="historical.selectedWellPreset = 'none'"
            />
          </div>
          <div class="control radio-group">
            <label>Format</label>
            <span>
              <input id="format-cents" type="radio" value="cents" v-model="historical.format" />
              <label for="format-cents">cents</label>
            </span>
            <span>
              <input id="format-default" type="radio" value="default" v-model="historical.format" />
              <label for="format-default">default</label>
            </span>
          </div>
          <div class="control">
            <label for="presets">Presets</label>
            <select id="presets" v-model="historical.selectedWellPreset">
              <option v-for="key of historical.wellPresetKeys" :key="key" :value="key">
                {{ historical.wellPresets[key].name }}
              </option>
            </select>
          </div>
          <button :disabled="historical.allWellCommasAreZero" @click="historical.resetWellCommas">
            Reset deviations to 0
          </button>
          <p>
            Difference between {{ spineLabel(historical.size - historical.down) }} and
            {{ spineLabel(-historical.down) }} = {{ enharmonicCents }} ¢
          </p>
          <div class="control">
            <label>{{ spineLabel(-historical.down) }}</label>
            <template v-for="i of historical.size" :key="i">
              <input
                type="text"
                :value="historical.wellCommaFractionStrings.get(i - 1 - historical.down) ?? '0'"
                @input="onWellCommaInput($event, i)"
                :disabled="i === historical.size"
              />
              <label :class="{ ghost: i === historical.size }">{{
                spineLabel(i - historical.down)
              }}</label>
            </template>
          </div>
          <p>
            Difference between {{ spineLabel(historical.size - historical.down) }} and
            {{ spineLabel(-historical.down) }} = {{ enharmonicCents }} ¢
          </p>
          <button :disabled="historical.allWellCommasAreZero" @click="historical.resetWellCommas">
            Reset deviations to 0
          </button>
        </div>
      </div>
      <div v-if="historical.method === 'simple' || historical.method === 'target'">
        <label>MOS: </label>
        <span v-for="(mosSize, i) of mosSizeList" :key="mosSize">
          <a href="#" @click="historical.size = mosSize">{{ mosSize }}</a
          ><template v-if="i < mosSizeList.length - 1">, </template>
        </span>
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
.ghost {
  opacity: 0.5;
}
</style>
