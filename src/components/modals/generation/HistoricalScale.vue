<script setup lang="ts">
import { ExtendedMonzo, Interval, parseLine, Scale } from 'scale-workshop-core'
import Modal from '@/components/ModalDialog.vue'
import { computed, reactive, ref, watch } from 'vue'
import { DEFAULT_NUMBER_OF_COMPONENTS, FIFTH, OCTAVE } from '@/constants'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { mmod, centsToValue, lcm, Fraction } from 'xen-dev-utils'
import { mosSizes } from 'moment-of-symmetry'
import { circleDifference, spineLabel as spineLabel_, type AccidentalStyle } from '@/utils'

const props = defineProps<{
  centsFractionDigits: number
}>()

const emit = defineEmits([
  'update:scaleName',
  'update:scale',
  'update:keyColors',
  'update:baseFrequency',
  'update:baseMidiNote',
  'cancel'
])

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

const ACCIDENTAL_STYLE =
  (localStorage.getItem('accidentalPreference') as AccidentalStyle) ?? 'double'

function spineLabel(up: number) {
  return spineLabel_(up, ACCIDENTAL_STYLE)
}

const method = ref<'simple' | 'target' | 'well temperament'>('simple')

const generator = ref(FIFTH)
const generatorString = ref('3/2')

const size = ref(12)
const down = ref(3)
const format = ref<'cents' | 'default'>('cents')

const selectedPreset = ref('pythagorean')

const pureGenerator = ref(FIFTH)
const pureGeneratorString = ref('3/2')
const target = ref(parseLine('7/4', DEFAULT_NUMBER_OF_COMPONENTS))
const targetString = ref('7/4')
const searchRange = ref(11)
const period = ref(OCTAVE)
const periodString = ref('2/1')
const pureExponent = ref(10)
const temperingStrength = ref(1)

const wellComma = ref(parseLine('531441/524288', DEFAULT_NUMBER_OF_COMPONENTS))
const wellCommaString = ref('531441/524288')
const wellCommaFractionStrings = reactive<Map<number, string>>(
  new Map([
    [-6, '0'],
    [-5, '0'],
    [-4, '0'],
    [-3, '0'],
    [-2, '0'],
    [-1, '-1/6'],
    [0, '-1/6'],
    [1, '-1/6'],
    [2, '-1/6'],
    [3, '-1/6'],
    [4, '-1/6']
  ])
)

const selectedWellPreset = ref('vallotti')

const mosSizeList = computed(() => {
  const p = method.value === 'simple' ? 1200 : period.value.totalCents()
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

type Candidate = {
  exponent: number
  tempering: number
}

const candidates = computed(() => {
  const pureCents = pureGenerator.value.totalCents()
  const targetCents = target.value.totalCents()
  const periodCents = period.value.totalCents()
  const halfPeriod = 0.5 * periodCents
  const result: Candidate[] = []
  for (let i = -searchRange.value; i <= searchRange.value; ++i) {
    if (i === 0 || i === 1 || i === -1) {
      continue
    }
    const offset = mmod(targetCents - pureCents * i + halfPeriod, periodCents) - halfPeriod
    result.push({
      exponent: i,
      tempering: offset / i
    })
  }
  result.sort((a, b) => Math.abs(a.tempering) - Math.abs(b.tempering))
  return result
})

// This way makes the selection behave slightly nicer when other values change
const tempering = computed(() => {
  for (const candidate of candidates.value) {
    if (candidate.exponent === pureExponent.value) {
      return candidate.tempering
    }
  }
  return 0
})

const strengthSlider = computed({
  get: () => temperingStrength.value,
  set(newValue: number) {
    // There's something wrong with how input ranges are handled.
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      temperingStrength.value = newValue
    }
  }
})

const temperedGenerator = computed(() => {
  const lineOptions = { centsFractionDigits: props.centsFractionDigits }
  if (method.value === 'simple') {
    return generator.value.mergeOptions(lineOptions)
  }
  return pureGenerator.value
    .mergeOptions(lineOptions)
    .add(
      new Interval(
        ExtendedMonzo.fromCents(
          tempering.value * temperingStrength.value,
          DEFAULT_NUMBER_OF_COMPONENTS
        ),
        'cents',
        undefined,
        lineOptions
      )
    )
    .asType('any')
})

const wellIntervals = computed(() => {
  const comma = wellComma.value.asType('any')
  // Not a generator in the strictest sense. It accumulates offsets along the way.
  let generator = FIFTH.mul(0).asType('any')

  // Unison
  const result = [generator]

  // Against the spiral of fifths
  for (let i = 0; i < down.value; ++i) {
    let frac = new Fraction(0)
    try {
      frac = new Fraction(wellCommaFractionStrings.get(-i - 1) ?? '0')
    } catch {
      /* empty */
    }
    generator = generator.sub(FIFTH).sub(comma.mul(frac)).mmod(OCTAVE)
    result.unshift(generator)
  }

  // Along the spiral of fifths
  generator = FIFTH.mul(0).asType('any')
  // Note that this intentionally overshoots by one to reach the enharmonic
  for (let i = 0; i < size.value - down.value; ++i) {
    let frac = new Fraction(0)
    try {
      frac = new Fraction(wellCommaFractionStrings.get(i) ?? '0')
    } catch {
      /* empty */
    }
    generator = generator.add(FIFTH).add(comma.mul(frac)).mmod(OCTAVE)
    result.push(generator)
  }

  return result
})

const enharmonicCents = computed(() => {
  const ws = wellIntervals.value
  return circleDifference(ws[ws.length - 1].totalCents(), ws[0].totalCents(), 1200.0).toFixed(
    props.centsFractionDigits
  )
})

const ZERO = new Fraction(0)

const allWellCommasAreZero = computed(() => {
  const d = down.value
  for (let i = 0; i < size.value; ++i) {
    let frac: Fraction
    try {
      frac = new Fraction(wellCommaFractionStrings.get(i) ?? '0')
    } catch {
      return false
    }
    if (wellCommaFractionStrings.has(i - d) && !ZERO.equals(frac)) {
      return false
    }
  }
  return true
})

// This is a simplified and linearized model of beating
function equalizeBeating() {
  const monzo = generator.value.monzo
  const g = monzo.valueOf()
  let multiGenExponent = 1
  if (!monzo.cents) {
    multiGenExponent = monzo.vector.reduce((denom, component) => lcm(component.d, denom), 1)
  }
  const t = target.value.monzo.valueOf()

  const generatorMaxBeats = Math.abs(g * (1 - centsToValue(tempering.value * multiGenExponent)))
  const targetMaxBeats = Math.abs(t * (1 - centsToValue(tempering.value * pureExponent.value)))

  // Solve the linearized model:
  // generatorBeats = generatorMaxBeats * strength = targetMaxBeats * (1 - strength) = targetBeats
  temperingStrength.value = targetMaxBeats / (generatorMaxBeats + targetMaxBeats)

  // Do one more iteration of linearization:
  const generatorMidBeats = Math.abs(
    g * (1 - centsToValue(tempering.value * multiGenExponent * temperingStrength.value))
  )
  const targetMidBeats = Math.abs(
    g * (1 - centsToValue(tempering.value * pureExponent.value * (1 - temperingStrength.value)))
  )

  // generatorBeats = generatorMidBeats + mu * (generatorMaxBeats - generatorMidBeats) = targetMidBeats - mu * targetMidBeats = targetBeats
  const mu =
    (targetMidBeats - generatorMidBeats) / (generatorMaxBeats + targetMidBeats - generatorMidBeats)

  temperingStrength.value += mu * (1 - temperingStrength.value)
}

type Preset = {
  name: string
  generator: string
  down: number
  size?: number
}

const presets: Record<string, Preset> = {
  pythagorean: {
    name: 'Pythagorean tuning',
    generator: '3/2',
    down: 5
  },
  helmholtz: {
    name: 'Helmholtz aka Schismatic',
    down: 11,
    size: 24,
    generator: '3/2 - 1\\8<32805/32768>'
  },
  twelve: {
    name: '12-tone equal temperament',
    generator: '7\\12',
    down: 3
  },
  eight: {
    name: '1/8-comma Meantone',
    generator: '3/2 - 1\\8<531441/524288>',
    down: 5
  },
  sixth: {
    name: '1/6-comma Meantone',
    down: 5,
    generator: '3/2 - 1\\6<531441/524288>'
  },
  fifth: {
    name: '1/5-comma Meantone',
    down: 3,
    generator: '3/2 - 1\\5<81/80>'
  },
  quarter: {
    name: '1/4-comma Meantone',
    down: 3,
    generator: '3/2 - 1\\4<81/80>'
  },
  twosevenths: {
    name: '2/7-comma Meantone',
    down: 3,
    generator: '3/2 - 2\\7<81/80>'
  },
  third: {
    name: '1/3-comma Meantone',
    down: 3,
    generator: '3/2 - 1\\3<81/80>'
  }
}

type WellPreset = {
  name: string
  down: number
  comma: string
  commaFractions: string
}

const wellPresets: Record<string, WellPreset> = {
  grammateus: {
    name: 'Grammateus 1518',
    down: 1,
    comma: '531441/524288',
    commaFractions: '0,0,0,0,0,0,-1/2,0,0,0,0'
  },
  neidhardtgrosse: {
    name: 'Neidhardt Große Stadt 1724',
    down: 5,
    comma: '531441/524288',
    commaFractions: '-1/12,0,-1/12,-1/12,0,-1/6,-1/6,-1/6,-1/12,0,-1/12'
  },
  neidhardtkleine: {
    name: 'Neidhardt Kleine Stadt 1732',
    down: 4,
    comma: '531441/524288',
    commaFractions: '-1/12,-1/12,0,0,-1/6,-1/6,-1/6,-1/6,-1/12,-1/12,0'
  },
  vallotti: {
    name: 'Vallotti 1754',
    down: 6,
    comma: '531441/524288',
    commaFractions: '0,0,0,0,0,-1/6,-1/6,-1/6,-1/6,-1/6,-1/6'
  },
  lambert: {
    name: 'Lambert 1774',
    down: 6,
    comma: '531441/524288',
    commaFractions: '0,0,0,0,0,-1/7,-1/7,-1/7,-1/7,-1/7,-1/7,-1/7'
  },
  barnes: {
    name: 'Bach/Barnes 1979',
    down: 3,
    comma: '531441/524288',
    commaFractions: '0,0,-1/6,-1/6,-1/6,-1/6,-1/6,0,-1/6,0,0'
  },
  lehman: {
    name: 'Bach/Lehman 2005',
    down: 1,
    comma: '531441/524288',
    commaFractions: '-1/6,-1/6,-1/6,-1/6,-1/6,0,0,0,-1/12,-1/12,-1/12'
  },
  odonnell: {
    name: "Bach/O'Donnell 2006",
    down: 3,
    comma: '531441/524288',
    commaFractions: '-1/12,0,0,-1/6,-1/6,-1/6,0,-1/6,0,-1/12,-1/12,-1/12'
  },
  hill: {
    name: 'Bach/Hill 2008',
    down: 4,
    comma: '531441/524288',
    commaFractions: '0,0,0,-2/13,-2/13,-2/13,-2/13,-2/13,0,-1/13,-1/13,-1/13'
  },
  swich: {
    name: 'Bach/Swich 2011',
    down: 3,
    comma: '531441/524288',
    commaFractions: '1/36,0,-1/5,-1/5,-1/5,-1/5,-1/5,0,-1/12,0,1/36'
  },
  louie: {
    name: 'Bach/Louie 2018',
    down: 4,
    comma: '531441/524288',
    commaFractions: '0,0,0,0,-1/6,-1/6,-1/6,-1/6,-1/6,-1/18,-1/18'
  },
  werckmeister3: {
    name: 'Werckmeister III 1691',
    down: 3,
    comma: '81/80',
    commaFractions: '0,0,0,-1/4,-1/4,-1/4,0,0,-1/4,0,0'
  },
  rameau: {
    name: 'Rameau 1726',
    down: 3,
    comma: '81/80',
    commaFractions: '11/24,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,0,0,-1/6'
  },
  rousseau: {
    name: "d'Alembert/Rousseau 1752",
    down: 3,
    comma: '81/80',
    commaFractions: '1/12,1/12,1/12,-1/4,-1/4,-1/4,-1/4,-1/12,-1/12,-1/12,-1/12'
  },
  corrette: {
    name: "Corrette's Wolf 1753",
    down: 3,
    comma: '81/80',
    commaFractions: '1/12,1/12,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/12'
  },
  marpourg: {
    name: 'Marpourg 1756',
    down: 3,
    comma: '81/80',
    commaFractions: '3/20,3/20,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,3/20,3/20,3/20'
  },
  kirnberger3: {
    name: 'Kirnberger III 1779',
    down: 5,
    comma: '81/80',
    commaFractions: '0,0,0,0,0,-1/4,-1/4,-1/4,-1/4,0,0'
  },
  kellner: {
    name: 'Kellner 1975',
    down: 4,
    comma: '81/80',
    commaFractions: '0,0,0,0,-1/5,-1/5,-1/5,-1/5,0,-1/5,0'
  },
  egarr: {
    name: "Egarr's English Ord 2007",
    down: 3,
    comma: '81/80',
    commaFractions: '1/4,1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/8,-1/8,-1/8,0'
  }
}

// Record order is supposed to be quaranteed since ES2015, but that doesn't seem to be the case...
const presetKeys: string[] = [...Object.keys(presets)]

// Sort by wideness of the generator
presetKeys.sort(
  (a, b) =>
    parseLine(presets[b].generator, DEFAULT_NUMBER_OF_COMPONENTS).totalCents() -
    parseLine(presets[a].generator, DEFAULT_NUMBER_OF_COMPONENTS).totalCents()
)

const wellPresetKeys: string[] = [...Object.keys(wellPresets)]

function extractYear(name: string) {
  for (const word of name.split(' ')) {
    const year = parseInt(word, 10)
    if (isNaN(year)) {
      continue
    }
    return year
  }
  return Infinity
}

// Sort by comma and then by date
wellPresetKeys.sort((a, b) => {
  // XXX: String length used as a complexity proxy.
  const c = wellPresets[b].comma.length - wellPresets[a].comma.length
  if (c) {
    return c
  }
  return extractYear(wellPresets[a].name) - extractYear(wellPresets[b].name)
})

watch(size, (newValue) => {
  if (down.value >= newValue) {
    down.value = newValue - 1
  }
})

function selectPreset(value: string) {
  if (value === 'none') {
    return
  }
  const preset = presets[value]
  size.value = preset.size ?? 12
  down.value = preset.down
  generator.value = parseLine(preset.generator, DEFAULT_NUMBER_OF_COMPONENTS)
  generatorString.value = preset.generator
}

watch(selectedPreset, selectPreset, { immediate: true })

function selectWellPreset(value: string) {
  if (value === 'none') {
    return
  }
  const preset = wellPresets[value]
  size.value = 12
  down.value = preset.down
  wellCommaString.value = preset.comma
  wellComma.value = parseLine(preset.comma, DEFAULT_NUMBER_OF_COMPONENTS)
  const fracs = preset.commaFractions.split(',')
  wellCommaFractionStrings.clear()
  for (let i = 0; i < fracs.length; ++i) {
    wellCommaFractionStrings.set(i - preset.down, fracs[i])
  }
}

watch(selectedWellPreset, selectWellPreset, { immediate: true })

function resetWellCommas() {
  wellCommaFractionStrings.clear()
  selectedWellPreset.value = 'none'
}

function onWellCommaInput(event: Event, i: number) {
  wellCommaFractionStrings.set(i - 1 - down.value, (event.target as HTMLInputElement).value)
  selectedWellPreset.value = 'none'
}

function generate() {
  const lineOptions = { centsFractionDigits: props.centsFractionDigits }

  // Check if the scale can be centered around C
  if (
    size.value === 12 &&
    down.value >= 1 &&
    (method.value === 'simple' || method.value === 'well temperament')
  ) {
    emit('update:baseFrequency', FREQUENCY_C)
    emit('update:baseMidiNote', MIDI_NOTE_C)
    emit('update:keyColors', KEY_COLORS_C)
  }

  if (method.value === 'simple') {
    const scale = Scale.fromRank2(
      temperedGenerator.value,
      OCTAVE.mergeOptions(lineOptions),
      size.value,
      down.value
    )

    if (selectedPreset.value in presets) {
      emit('update:scaleName', presets[selectedPreset.value].name)
    } else {
      emit('update:scaleName', `Rank 2 temperament (${generatorString.value})`)
    }

    if (format.value === 'cents') {
      emit('update:scale', scale.asType('cents'))
    } else {
      emit('update:scale', scale)
    }
  } else if (method.value === 'target') {
    const scale = Scale.fromRank2(
      temperedGenerator.value,
      period.value.mergeOptions(lineOptions),
      size.value,
      down.value
    )

    let genString = temperedGenerator.value.toString()
    if (format.value === 'cents') {
      emit('update:scale', scale.asType('cents'))
      genString = temperedGenerator.value.totalCents().toFixed(props.centsFractionDigits)
    } else {
      emit('update:scale', scale)
    }
    emit('update:scaleName', `Rank 2 temperament (${genString}, ${periodString.value})`)
  } else {
    const scale = new Scale(wellIntervals.value.slice(0, size.value), OCTAVE, 440).mergeOptions(
      lineOptions
    )
    scale.sortInPlace()
    if (format.value === 'cents') {
      emit('update:scale', scale.asType('cents'))
    } else {
      emit('update:scale', scale)
    }
    if (selectedWellPreset.value in wellPresets) {
      emit('update:scaleName', wellPresets[selectedWellPreset.value].name)
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
                v-model="method"
                @input="selectPreset(selectedPreset)"
              />
              <label for="method-simple"> Simple </label>
            </span>

            <span>
              <input
                type="radio"
                id="method-target"
                value="target"
                v-model="method"
                @input="down = 1"
              />
              <label for="method-target"> Target </label>
            </span>

            <span>
              <input
                type="radio"
                id="method-well"
                value="well temperament"
                v-model="method"
                @input="selectWellPreset(selectedWellPreset)"
              />
              <label for="method-well"> Well Temperament </label>
            </span>
          </div>
        </div>

        <div class="control-group" v-show="method === 'simple'">
          <div class="control">
            <label for="generator">Interval to stack</label>
            <ScaleLineInput
              id="generator"
              placeholder="3/2"
              :defaultValue="FIFTH"
              v-model="generatorString"
              @update:value="generator = $event"
              @input="selectedPreset = 'none'"
            />
          </div>
          <div class="control">
            <label for="size">Scale size</label>
            <input id="size" type="number" min="1" max="999" v-model="size" />
          </div>
          <div class="control">
            <label for="down">Down (number of fourths)</label>
            <input id="down" type="number" min="0" :max="size - 1" v-model="down" />
          </div>
          <div class="control radio-group">
            <label>Format</label>
            <span>
              <input id="format-cents" type="radio" value="cents" v-model="format" />
              <label for="format-cents"> cents</label>
            </span>
            <span>
              <input id="format-default" type="radio" value="default" v-model="format" />
              <label for="format-default"> default</label>
            </span>
          </div>
          <div class="control">
            <label for="presets">Presets</label>
            <select id="presets" v-model="selectedPreset">
              <option v-for="key of presetKeys" :key="key" :value="key">
                {{ presets[key].name }}
              </option>
            </select>
          </div>
        </div>

        <div class="control-group" v-show="method === 'target'">
          <div class="control">
            <label for="pure-generator">Stacking interval</label>
            <ScaleLineInput
              id="pure-generator"
              placeholder="3/2"
              v-model="pureGeneratorString"
              :defaultValue="FIFTH"
              @update:value="pureGenerator = $event"
            />
          </div>
          <div class="control">
            <label for="target">Target interval</label>
            <ScaleLineInput
              id="target"
              placeholder="7/4"
              v-model="targetString"
              :defaultValue="HARMONIC_SEVENTH"
              @update:value="target = $event"
            />
          </div>
          <div class="control">
            <label for="period">Period</label>
            <ScaleLineInput
              id="period"
              placeholder="2/1"
              v-model="periodString"
              :defaultValue="OCTAVE"
              @update:value="period = $event"
            />
          </div>
          <div class="control">
            <label for="search-range">Search range</label>
            <input id="search-range" type="number" v-model="searchRange" />
          </div>
          <div class="control">
            <label for="candidates">Exponent / Tempering</label>
            <select id="candidates" v-model="pureExponent">
              <option
                v-for="candidate of candidates"
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
          <button class="control" @click="equalizeBeating">Equalize beating</button>
          <div class="control">
            <label for="size">Scale size</label>
            <input id="size" type="number" min="1" max="999" v-model="size" />
          </div>
          <div class="control">
            <label for="down">Down</label>
            <input id="down" type="number" min="0" :max="size - 1" v-model="down" />
          </div>
          <div class="control radio-group">
            <label>Format</label>
            <span>
              <input id="format-cents" type="radio" value="cents" v-model="format" />
              <label for="format-cents"> cents</label>
            </span>
            <span>
              <input id="format-default" type="radio" value="default" v-model="format" />
              <label for="format-default"> default</label>
            </span>
          </div>
        </div>

        <div class="control-group" v-show="method === 'well temperament'">
          <div class="control">
            <label for="size">Scale size</label>
            <input
              id="size"
              type="number"
              min="1"
              max="999"
              v-model="size"
              @input="selectedWellPreset = 'none'"
            />
          </div>
          <div class="control">
            <label for="down">Down (number of fourths)</label>
            <input
              id="down"
              type="number"
              min="0"
              :max="size - 1"
              v-model="down"
              @input="selectedWellPreset = 'none'"
            />
          </div>
          <div class="control">
            <label for="well-comma">Comma</label>
            <ScaleLineInput
              id="well-comma"
              placeholder="81/80"
              v-model="wellCommaString"
              :defaultValue="SYNTONIC"
              @update:value="wellComma = $event"
              @input="selectedWellPreset = 'none'"
            />
          </div>
          <div class="control radio-group">
            <label>Format</label>
            <span>
              <input id="format-cents" type="radio" value="cents" v-model="format" />
              <label for="format-cents"> cents</label>
            </span>
            <span>
              <input id="format-default" type="radio" value="default" v-model="format" />
              <label for="format-default"> default</label>
            </span>
          </div>
          <div class="control">
            <label for="presets">Presets</label>
            <select id="presets" v-model="selectedWellPreset">
              <option v-for="key of wellPresetKeys" :key="key" :value="key">
                {{ wellPresets[key].name }}
              </option>
            </select>
          </div>
          <button :disabled="allWellCommasAreZero" @click="resetWellCommas">
            Reset deviations to 0
          </button>
          <p>
            Difference between {{ spineLabel(size - down) }} and {{ spineLabel(-down) }} =
            {{ enharmonicCents }} ¢
          </p>
          <div class="control">
            <label>{{ spineLabel(-down) }}</label>
            <template v-for="i of size" :key="i">
              <input
                type="text"
                :value="wellCommaFractionStrings.get(i - 1 - down) ?? '0'"
                @input="onWellCommaInput($event, i)"
                :disabled="i === size"
              />
              <label :class="{ ghost: i === size }">{{ spineLabel(i - down) }}</label>
            </template>
          </div>
          <p>
            Difference between {{ spineLabel(size - down) }} and {{ spineLabel(-down) }} =
            {{ enharmonicCents }} ¢
          </p>
          <button :disabled="allWellCommasAreZero" @click="resetWellCommas">
            Reset deviations to 0
          </button>
        </div>
      </div>
      <div v-if="method === 'simple' || method === 'target'">
        <label>MOS: </label>
        <span v-for="(mosSize, i) of mosSizeList" :key="mosSize">
          <a href="#" @click="size = mosSize">{{ mosSize }}</a
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
