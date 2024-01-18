<script setup lang="ts">
import { ExtendedMonzo, Interval, Scale } from 'scale-workshop-core'
import Modal from '@/components/ModalDialog.vue'
import { computed } from 'vue'
import { DEFAULT_NUMBER_OF_COMPONENTS, FIFTH, OCTAVE } from '@/constants'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { circleDifference } from 'xen-dev-utils'
import { mosSizes } from 'moment-of-symmetry'
import { spineLabel as spineLabel_, type AccidentalStyle } from '@/utils'
import { useHistoricalStore } from '@/stores/historical'

const props = defineProps<{
  centsFractionDigits: number
  accidentalStyle: AccidentalStyle
}>()

const emit = defineEmits([
  'update:scaleName',
  'update:scale',
  'update:keyColors',
  'update:baseFrequency',
  'update:baseMidiNote',
  'cancel'
])

const historical = useHistoricalStore()

// The presets default to middle C when there's an 'F' in the scale i.e. down >= 1
const KEY_COLORS_C = [
  'white',
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
  'white'
]

const MIDI_NOTE_C = 60
const FREQUENCY_C = 261.6255653005986

const MAX_SIZE = 99
const MAX_LENGTH = 10

const HARMONIC_SEVENTH = new Interval(
  ExtendedMonzo.fromFraction('7/4', DEFAULT_NUMBER_OF_COMPONENTS),
  'ratio'
)

const SYNTONIC = new Interval(
  ExtendedMonzo.fromFraction('81/80', DEFAULT_NUMBER_OF_COMPONENTS),
  'ratio'
)

function spineLabel(up: number) {
  return spineLabel_(up, props.accidentalStyle)
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
  const lineOptions = { centsFractionDigits: props.centsFractionDigits }
  if (historical.method === 'simple') {
    return historical.generator.mergeOptions(lineOptions)
  }
  return historical.pureGenerator
    .mergeOptions(lineOptions)
    .add(
      new Interval(
        ExtendedMonzo.fromCents(
          historical.tempering * historical.temperingStrength,
          DEFAULT_NUMBER_OF_COMPONENTS
        ),
        'cents',
        undefined,
        lineOptions
      )
    )
    .asType('any')
})

const enharmonicCents = computed(() => {
  const ws = historical.wellIntervals
  return circleDifference(ws[ws.length - 1].totalCents(), ws[0].totalCents()).toFixed(
    props.centsFractionDigits
  )
})

function onWellCommaInput(event: Event, i: number) {
  historical.wellCommaFractionStrings.set(
    i - 1 - historical.down,
    (event.target as HTMLInputElement).value
  )
  historical.selectedWellPreset = 'none'
}

function generate() {
  const lineOptions = { centsFractionDigits: props.centsFractionDigits }

  // Check if the scale can be centered around C
  if (
    historical.size === 12 &&
    historical.down >= 1 &&
    (historical.method === 'simple' || historical.method === 'well temperament')
  ) {
    emit('update:baseFrequency', FREQUENCY_C)
    emit('update:baseMidiNote', MIDI_NOTE_C)
    emit('update:keyColors', KEY_COLORS_C)
  }

  if (historical.method === 'simple') {
    const scale = Scale.fromRank2(
      temperedGenerator.value,
      OCTAVE.mergeOptions(lineOptions),
      historical.size,
      historical.down
    )

    if (historical.selectedPreset in historical.presets) {
      emit('update:scaleName', historical.presets[historical.selectedPreset].name)
    } else {
      emit('update:scaleName', `Rank 2 temperament (${historical.generatorString})`)
    }

    if (historical.format === 'cents') {
      emit('update:scale', scale.asType('cents'))
    } else {
      emit('update:scale', scale)
    }
  } else if (historical.method === 'target') {
    const scale = Scale.fromRank2(
      temperedGenerator.value,
      historical.period.mergeOptions(lineOptions),
      historical.size,
      historical.down
    )

    let genString = temperedGenerator.value.toString()
    if (historical.format === 'cents') {
      emit('update:scale', scale.asType('cents'))
      genString = temperedGenerator.value.totalCents().toFixed(props.centsFractionDigits)
    } else {
      emit('update:scale', scale)
    }
    emit('update:scaleName', `Rank 2 temperament (${genString}, ${historical.periodString})`)
  } else {
    const scale = new Scale(
      historical.wellIntervals.slice(0, historical.size),
      OCTAVE,
      440
    ).mergeOptions(lineOptions)
    scale.sortInPlace()
    if (historical.format === 'cents') {
      emit('update:scale', scale.asType('cents'))
    } else {
      emit('update:scale', scale)
    }
    if (historical.selectedWellPreset in historical.wellPresets) {
      emit('update:scaleName', historical.wellPresets[historical.selectedWellPreset].name)
    } else {
      emit('update:scaleName', 'Custom Well Temperament')
    }
  }
}
</script>
<template>
  <Modal extraStyle="width: 25rem" @confirm="generate" @cancel="$emit('cancel')">
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
              <label for="method-simple"> Simple </label>
            </span>

            <span>
              <input
                type="radio"
                id="method-target"
                value="target"
                v-model="historical.method"
                @input="historical.down = 1"
              />
              <label for="method-target"> Target </label>
            </span>

            <span>
              <input
                type="radio"
                id="method-well"
                value="well temperament"
                v-model="historical.method"
                @input="historical.selectWellPreset(historical.selectedWellPreset)"
              />
              <label for="method-well"> Well Temperament </label>
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
              <label for="format-cents"> cents</label>
            </span>
            <span>
              <input id="format-default" type="radio" value="default" v-model="historical.format" />
              <label for="format-default"> default</label>
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
                {{ candidate.exponent }} / {{ candidate.tempering.toFixed(centsFractionDigits) }} ¢
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
              <label for="format-cents"> cents</label>
            </span>
            <span>
              <input id="format-default" type="radio" value="default" v-model="historical.format" />
              <label for="format-default"> default</label>
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
              <label for="format-cents"> cents</label>
            </span>
            <span>
              <input id="format-default" type="radio" value="default" v-model="historical.format" />
              <label for="format-default"> default</label>
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
  </Modal>
</template>
<style scoped>
.ghost {
  opacity: 0.5;
}
</style>
