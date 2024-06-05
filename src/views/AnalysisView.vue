<script setup lang="ts">
import {
  brightnessSignature,
  constantStructureViolations,
  freeEquallyTemperedChord,
  intervalMatrix,
  marginViolations,
  rootedEquallyTemperedChord,
  varietySignature
} from '@/analysis'
import ChordWheel from '@/components/ChordWheel.vue'
import HarmonicEntropyPlot from '@/components/HarmonicEntropyPlot.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { computed, reactive, ref } from 'vue'
import { useAudioStore } from '@/stores/audio'
import { useStateStore } from '@/stores/state'
import { literalToString, type Interval } from 'sonic-weave'
import { useScaleStore } from '@/stores/scale'
import { Fraction, mmod } from 'xen-dev-utils'
import { OCTAVE, UNISON } from '@/constants'
import { useHarmonicEntropyStore } from '@/stores/harmonic-entropy'

const EPSILON = 1e-6

const audio = useAudioStore()
const state = useStateStore()
const scale = useScaleStore()
const entropy = useHarmonicEntropyStore()

const subtab = ref<'matrix' | 'wheels' | 'entropy'>('matrix')
const cellFormat = ref<'best' | 'fraction' | 'cents' | 'decimal'>('best')
const simplifyTolerance = ref(3.5)
const showOptions = ref(false)
const trailLongevity = ref(70)
const maxOtonalRoot = ref(16)
const maxUtonalRoot = ref(23)

const maxDivisions = ref(31)
const equave = ref(OCTAVE)
const equaveString = ref('2/1')
const errorModel = ref<'rooted' | 'free'>('rooted')

const intervalMatrixIndexingRadio = computed({
  get: () => state.intervalMatrixIndexing.toString(),
  set: (newValue: string) => (state.intervalMatrixIndexing = parseInt(newValue, 10))
})

const fadeAlpha = computed(() => 1 - trailLongevity.value / 100)

const backgroundRBG = computed<[number, number, number]>(() => {
  // Add dependency.
  state.colorScheme
  // Fetch from document.
  const css = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-background')
    .trim()
    .toLowerCase()
  if (css === '#fff' || css === '#fefdfe') {
    return [255, 255, 255]
  } else if (css === '#000' || css === '#060206') {
    return [0, 0, 0]
  } else {
    throw new Error('General color parsing not implemented')
  }
})

const strokeStyle = computed(() => {
  // Add dependency.
  state.colorScheme
  // Fetch from document.
  return getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim()
})

// While interval.name suffices for the tuning table
// we want more accurate results here.
function formatMatrixCell(interval: Interval) {
  if (cellFormat.value === 'fraction') {
    if (interval.value.isFractional()) {
      const node = interval.value.asFractionLiteral()
      if (node) {
        return literalToString(node)
      }
    }
    try {
      return (
        '~' +
        new Fraction(interval.valueOf()).simplifyRelative(simplifyTolerance.value).toFraction()
      )
    } catch {
      return '?'
    }
  }
  if (cellFormat.value === 'cents') {
    return interval.totalCents(true).toFixed(1)
  }
  if (cellFormat.value === 'decimal') {
    // Consistent with tuning table localization.
    return interval.valueOf().toFixed(3)
  }

  return interval.toString()
}

const highlights = reactive<boolean[][]>([])

const matrix = computed(() =>
  intervalMatrix(scale.relativeIntervals.slice(0, state.maxMatrixWidth))
)

const centsMatrix = computed(() => matrix.value.map((row) => row.map((i) => i.totalCents(true))))

const matrixRows = computed(() => matrix.value.map((row) => row.map(formatMatrixCell)))

const violations = computed(() => {
  const margin = state.constantStructureMargin
  if (margin) {
    return marginViolations(centsMatrix.value, margin)
  } else {
    return constantStructureViolations(matrix.value)
  }
})

const variety = computed(() => varietySignature(matrix.value))

const brightness = computed(() =>
  brightnessSignature(centsMatrix.value).map((b) => Math.round(100 * b))
)

const heldScaleDegrees = computed(() => {
  const result: Set<number> = new Set()
  for (const midiIndex of state.heldNotes.keys()) {
    if (state.heldNotes.get(midiIndex)! > 0) {
      result.add(mmod(midiIndex - scale.scale.baseMidiNote, scale.scale.size))
    }
  }
  return result
})

const equallyTemperedChordData = computed(() => {
  if (!audio.virtualSynth) {
    return {
      error: 0,
      degrees: [],
      divisions: 1
    }
  }
  const frequencies = audio.virtualSynth.voices.map((voice) => Math.abs(voice.frequency))
  const equaveCents = equave.value.totalCents(true)
  if (errorModel.value === 'rooted') {
    return rootedEquallyTemperedChord(frequencies, maxDivisions.value, equaveCents)
  }
  return freeEquallyTemperedChord(frequencies, maxDivisions.value, equaveCents)
})

const nedjiProjector = computed(() => {
  if (equave.value.equals(OCTAVE)) {
    return ''
  }
  return `<${equave.value.toString()}>`
})

function highlight(y?: number, x?: number) {
  if (!state.calculateConstantStructureViolations) {
    return
  }
  const margin = state.constantStructureMargin
  if (highlights.length !== matrix.value.length) {
    highlights.length = 0
    for (let i = 0; i < matrix.value.length; ++i) {
      highlights.push(Array(matrix.value[i].length).fill(false))
    }
  }
  // Look at other violators
  if (y !== undefined && x !== undefined && violations.value[y][x]) {
    const value: any = margin ? centsMatrix.value[y][x] : matrix.value[y][x].value
    for (let i = 0; i < matrix.value.length; ++i) {
      for (let j = 0; j < matrix.value[i].length; ++j) {
        if (violations.value[i][j]) {
          if (margin) {
            highlights[i][j] = Math.abs(centsMatrix.value[i][j] - value) < margin
          } else {
            highlights[i][j] = matrix.value[i][j].value.strictEquals(value)
          }
        } else {
          highlights[i][j] = false
        }
      }
    }
    return
  }

  // Reset highlights
  for (let i = 0; i < matrix.value.length; ++i) {
    for (let j = 0; j < matrix.value[i].length; ++j) {
      highlights[i][j] = false
    }
  }
  if (y === undefined || x === undefined) {
    return
  }

  // Look at own column
  const value: any = margin ? centsMatrix.value[y][x] : matrix.value[y][x].value
  for (let i = 0; i < matrix.value.length; ++i) {
    if (margin) {
      highlights[i][x] = Math.abs(centsMatrix.value[i][x] - value) < margin
    } else {
      highlights[i][x] = matrix.value[i][x].value.strictEquals(value)
    }
  }
}

// === Harmonic entropy ===
const heMode = ref(0)

const centss = computed(() => {
  const result: number[] = []
  let index = scale.baseMidiNote + heMode.value
  const baseCents = scale.scale.getCents(index)
  while (index < 10000) {
    const cents = scale.scale.getCents(index++) - baseCents
    if (cents > 6000 + EPSILON) {
      break
    }
    result.push(cents)
  }
  return result
})

const labels = computed(() =>
  centss.value.map((_, i) => scale.labelForIndex(scale.baseMidiNote + heMode.value + i))
)

const colors = computed(() =>
  centss.value.map((_, i) => scale.colorForIndex(scale.baseMidiNote + heMode.value + i))
)

// These really should be direct v-models, but there's
// something wrong with how input ranges are handled.
const aSlider = computed({
  get: () => entropy.a,
  set(newValue: number) {
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      entropy.a = newValue
    }
  }
})

const sSlider = computed({
  get: () => entropy.s,
  set(newValue: number) {
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      entropy.s = newValue
    }
  }
})
</script>

<template>
  <div id="view">
    <nav>
      <ul>
        <li>
          <a href="#" :class="{ active: subtab === 'matrix' }" @click="subtab = 'matrix'"
            >Interval matrix</a
          >
        </li>
        <li>
          <a href="#" :class="{ active: subtab === 'wheels' }" @click="subtab = 'wheels'"
            >Chord wheels</a
          >
        </li>
        <li>
          <a href="#" :class="{ active: subtab === 'entropy' }" @click="subtab = 'entropy'"
            >Harmonic entropy</a
          >
        </li>
      </ul>
    </nav>
    <main v-if="subtab === 'matrix'">
      <h2>Interval matrix (modes)</h2>
      <div class="control-group interval-matrix">
        <table @mouseleave="highlight()">
          <tr>
            <th></th>
            <th v-for="i of Math.min(scale.scale.size, state.maxMatrixWidth)" :key="i">
              {{ i - 1 + state.intervalMatrixIndexing }}
            </th>
            <th>({{ scale.scale.size + state.intervalMatrixIndexing }})</th>
            <th class="brightness" v-if="state.calculateBrightness">Bright %</th>
          </tr>
          <tr v-for="(row, i) of matrixRows" :key="i">
            <th :class="{ held: heldScaleDegrees.has(i) }">
              <template v-if="cellFormat === 'best'">
                {{ scale.labels[mmod(i - 1, scale.labels.length)] }}
              </template>
              <template v-else>
                {{ formatMatrixCell(i ? scale.relativeIntervals[i - 1] : UNISON) }}
              </template>
            </th>
            <td
              v-for="(name, j) of row"
              :key="j"
              :class="{
                violator: state.calculateConstantStructureViolations && violations[i][j],
                highlight: (highlights[i] ?? [])[j]
              }"
              @mouseover="highlight(i, j)"
            >
              {{ name }}
            </td>
            <td class="brightness" v-if="state.calculateBrightness">{{ brightness[i] }}</td>
          </tr>
          <tr class="variety" v-if="state.calculateVariety">
            <th>Var</th>
            <td v-for="(v, i) of variety" :key="i">{{ v }}</td>
            <td class="brightness" v-if="state.calculateBrightness"></td>
          </tr>
        </table>
      </div>
      <div class="control-group">
        <div class="control radio-group">
          <label>Display intervals in matrix as</label>
          <span>
            <input type="radio" id="format-best" value="best" v-model="cellFormat" />
            <label for="format-best">Default</label>
          </span>

          <span>
            <input type="radio" id="format-fraction" value="fraction" v-model="cellFormat" />
            <label for="format-fraction">Fraction</label>
          </span>

          <span>
            <input type="radio" id="format-cents" value="cents" v-model="cellFormat" />
            <label for="format-cents">Cents</label>
          </span>

          <span>
            <input type="radio" id="format-decimal" value="decimal" v-model="cellFormat" />
            <label for="format-decimal">Decimal ratio</label>
          </span>
        </div>
      </div>
      <p class="section" :class="{ open: showOptions }" @click="showOptions = !showOptions">
        More options
      </p>
      <div class="control-group" v-show="showOptions">
        <div class="control radio-group">
          <label>Interval indexing</label>
          <span>
            <input
              type="radio"
              id="indexing-zero"
              value="0"
              v-model="intervalMatrixIndexingRadio"
            />
            <label for="indexing-zero">0-indexing (default)</label>
          </span>

          <span>
            <input type="radio" id="indexing-one" value="1" v-model="intervalMatrixIndexingRadio" />
            <label for="indexing-one">1-indexing</label>
          </span>
        </div>
        <div class="control">
          <label for="simplify-tolerance">Fraction approximation tolerance in cents</label>
          <input
            id="simplify-tolerance"
            type="number"
            min="0.1"
            step="0.1"
            v-model="simplifyTolerance"
          />
        </div>
        <div class="control">
          <label for="max-matrix-width">Maximum matrix width</label>
          <input
            id="max-matrix-width"
            type="number"
            min="1"
            step="1"
            v-model="state.maxMatrixWidth"
          />
        </div>
        <div class="control checkbox-container">
          <input
            id="calculate-violators"
            type="checkbox"
            v-model="state.calculateConstantStructureViolations"
          />
          <label for="calculate-violators">Show constant structure violations</label>
        </div>
        <div class="control">
          <label for="cs-margin">Constant structure margin in cents</label>
          <input id="cs-margin" type="number" min="0" v-model="state.constantStructureMargin" />
        </div>
        <div class="control checkbox-container">
          <input id="calculate-variety" type="checkbox" v-model="state.calculateVariety" />
          <label for="calculate-variety">Show variety signature</label>
        </div>
        <div class="control checkbox-container">
          <input id="calculate-brightness" type="checkbox" v-model="state.calculateBrightness" />
          <label for="calculate-brightness">Show mode brightness</label>
        </div>
      </div>
    </main>
    <main v-if="subtab === 'wheels'">
      <div class="columns-container">
        <div class="column">
          <h2>Otonal chord</h2>
          <div class="control-group">
            <ChordWheel
              class="chord-wheel"
              type="otonal"
              :maxChordRoot="maxOtonalRoot"
              :virtualSynth="audio.virtualSynth"
              :width="500"
              :height="400"
              :lineWidth="2"
              :backgroundRBG="backgroundRBG"
              :fadeAlpha="fadeAlpha"
              :shadowBlur="2"
              :strokeStyle="strokeStyle"
              textColor="red"
            />
          </div>
        </div>
        <div class="column">
          <h2>Utonal chord</h2>
          <div class="control-group">
            <ChordWheel
              class="chord-wheel"
              type="utonal"
              :maxChordRoot="maxUtonalRoot"
              :virtualSynth="audio.virtualSynth"
              :width="500"
              :height="400"
              :lineWidth="2"
              :backgroundRBG="backgroundRBG"
              :fadeAlpha="fadeAlpha"
              :shadowBlur="2"
              :strokeStyle="strokeStyle"
              textColor="blue"
            />
          </div>
        </div>
        <div class="column">
          <h2>Chord analysis</h2>
          <div class="control-group">
            <div class="control">
              <label for="trail-longevity">Trail longevity</label>
              <input
                id="trail-longevity"
                type="number"
                class="control"
                min="0"
                max="100"
                v-model="trailLongevity"
              />
            </div>
            <div class="control">
              <label for="otonal-root">Maximum root (otonal)</label>
              <input
                id="otonal-root"
                type="number"
                class="control"
                min="1"
                v-model="maxOtonalRoot"
              />
            </div>
            <div class="control">
              <label for="utonal-root">Maximum root (utonal)</label>
              <input
                id="utonal-root"
                type="number"
                class="control"
                min="1"
                v-model="maxUtonalRoot"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="bicolumns-container">
        <h2>Equally tempered chord</h2>
        <div class="column">
          <p class="chord-data">
            <b>Chord:</b> [{{ equallyTemperedChordData.degrees.join(',') }}] \
            {{ equallyTemperedChordData.divisions }}{{ nedjiProjector }}
          </p>
          <p class="chord-data"><b>Error:</b> {{ equallyTemperedChordData.error.toFixed(5) }} c</p>
        </div>
        <div class="column">
          <div class="control-group">
            <div class="control">
              <label for="divisions">Maximum divisions of the equave</label>
              <input id="divisions" type="number" class="control" min="1" v-model="maxDivisions" />
            </div>
            <div class="control">
              <label for="equave">Equave</label>
              <ScaleLineInput
                id="equave"
                @update:value="equave = $event"
                v-model="equaveString"
                :defaultValue="OCTAVE"
              />
            </div>
            <div class="control radio-group">
              <label>Error model</label>
              <span>
                <input type="radio" id="error-rooted" value="rooted" v-model="errorModel" />
                <label for="error-rooted">Rooted</label>
              </span>
              <span>
                <input type="radio" id="error-free" value="free" v-model="errorModel" />
                <label for="error-free">Free</label>
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
    <main v-if="subtab === 'entropy'">
      <div class="entropy-plot">
        <HarmonicEntropyPlot :centss="centss" :labels="labels" :colors="colors" />
      </div>
      <div class="control-group">
        <div class="control">
          <label for="he-mode">Mode (scale rotation)</label>
          <input id="he-mode" type="number" step="1" v-model="heMode" />
        </div>
        <div class="control">
          <label for="N">Maximum Benedetti height</label>
          <input id="N" type="number" min="1000" step="1000" v-model="entropy.N" />
        </div>
        <label for="a">Rényi order: {{ entropy.a.toFixed(4) }}</label>
        <input
          class="control"
          id="a"
          type="range"
          min="0.02"
          max="7"
          step="any"
          v-model="aSlider"
        />
        <label for="s">Frequency deviation: {{ (entropy.s * 100).toFixed(2) }}%</label>
        <input
          class="control"
          id="s"
          type="range"
          min="0.003"
          max="0.02"
          step="any"
          v-model="sSlider"
        />
      </div>
      <div class="entropy-intervals">
        <table>
          <tr>
            <th>Label</th>
            <th>Cents</th>
            <th>Entropy %</th>
          </tr>
          <tr v-for="(cents, i) of centss" :key="i">
            <td>{{ labels[i] }}</td>
            <td>{{ cents.toFixed(state.centsFractionDigits) }}</td>
            <td>{{ (100 * entropy.entropyPercentage(cents)).toFixed(3) }}</td>
          </tr>
        </table>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Subtab navigation */
nav {
  flex: 0 0 auto;
  display: flex;
  background-color: var(--color-accent-deeper);
  color: white;
  max-width: 100%;
  overflow-x: auto;
}
nav ul {
  padding: 0px;
  margin: 0px;
  white-space: nowrap;
}
nav ul li {
  list-style-type: none;
  display: inline-block;
}
nav ul li a {
  display: inline-block;
  padding: 0.3rem 0.7rem;
  color: white;
  text-decoration: none;
  cursor: default;
}
nav ul li a:hover {
  background-color: var(--color-accent-mute);
}
nav ul li a.active,
nav ul li a.active:hover {
  background-color: var(--color-background);
  color: var(--color-text);
}

/* View */
#view {
  overflow-y: auto !important;
}
main {
  padding: 1rem;
}

/* Interval matrix */
.interval-matrix {
  overflow-x: auto;
  display: block;
}
.interval-matrix th {
  font-weight: bold;
}
.interval-matrix table,
.interval-matrix th,
.interval-matrix td {
  border: 1px solid var(--color-border);
}
.interval-matrix th,
.interval-matrix td {
  padding: 0.2rem 0.5rem;
}
.interval-matrix table {
  border-collapse: collapse;
  text-align: center;
}
.variety {
  border-top: 2px solid;
}
.brightness {
  border-left: 2px solid !important;
}
.violator {
  color: red;
}
.highlight {
  text-decoration: underline;
}
.violator.highlight {
  background-color: rgba(255, 255, 100, 0.8);
}
.held {
  background-color: var(--color-accent);
  color: var(--color-accent-text);
}

.entropy-plot {
  overflow-x: scroll;
}

.entropy-intervals th {
  font-weight: bold;
}
.entropy-intervals table,
.entropy-intervals th,
.entropy-intervals td {
  border: 1px solid var(--color-border);
}
.entropy-intervals th,
.entropy-intervals td {
  padding: 0.2rem 0.5rem;
}
.entropy-intervals table {
  border-collapse: collapse;
  text-align: center;
}

/* Content layout (medium) */
div.columns-container,
div.bicolumns-container {
  column-count: 2;
  column-gap: 1rem;
  overflow: hidden;
}
div.column {
  overflow-y: auto;
}

/* Content layout (medium and large) */
@media screen and (min-width: 600px) {
  div.columns-container {
    column-count: 3;
  }
  div.column {
    height: 100%;
  }
}

/* Chord wheel */
.chord-wheel {
  border: 1px solid var(--color-border);
  max-width: 100%;
  height: auto;
}

/* Equally tempered chord */
.chord-data {
  font-size: 1.2em;
}
</style>
