<script setup lang="ts">
/**
 * Analysis workspace view for interval matrices, chord wheels,
 * harmonic entropy plots, and similar scale tables.
 */
import { type Interval } from 'sonic-weave/interval'
import {
  brightnessSignature,
  constantStructureViolations,
  freeEquallyTemperedChord,
  intervalMatrix,
  marginVarietySignature,
  marginViolations,
  rootedEquallyTemperedChord,
  varietySignature
} from '@/analysis'
import ChordWheel from '@/components/ChordWheel.vue'
import HarmonicEntropyPlot from '@/components/HarmonicEntropyPlot.vue'
import NumericSlider from '@/components/NumericSlider.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import SimilarScales from '@/components/SimilarScales.vue'
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { useAudioStore } from '@/stores/audio'
import { useStateStore } from '@/stores/state'
import { literalToString } from 'sonic-weave/expression'
import { Fraction, lcm, mmod } from 'xen-dev-utils/fraction'
import { useScaleStore } from '@/stores/scale'
import { OCTAVE, UNISON } from '@/constants'
import { useHarmonicEntropyStore } from '@/stores/harmonic-entropy'
import Values from 'values.js'

const EPSILON = 1e-6

const audio = useAudioStore()
const state = useStateStore()
const scale = useScaleStore()
const entropy = useHarmonicEntropyStore()

const subtab = ref<'matrix' | 'wheels' | 'entropy' | 'similar'>('matrix')
const cellFormat = ref<'best' | 'fraction' | 'cents' | 'et' | 'decimal'>('best')
const simplifyTolerance = ref(3.5)
const fractionMaxHeight = ref(26)
const showOptions = ref(false)
const errorModel = ref<'rooted' | 'free'>('rooted')

const intervalMatrixIndexingRadio = computed({
  get: () => state.intervalMatrixIndexing.toString(),
  set: (newValue: string) => (state.intervalMatrixIndexing = parseInt(newValue, 10))
})

const fadeAlpha = computed(() => 1 - state.trailLongevity / 100)

const backgroundRBG = computed<[number, number, number]>(() => {
  const root = document.documentElement
  if (state.colorScheme) {
    const css = getComputedStyle(root).getPropertyValue('--color-background').trim().toLowerCase()
    return new Values(css).rgb
  }
  const css = getComputedStyle(root).getPropertyValue('--color-background').trim().toLowerCase()
  return new Values(css).rgb
})

const strokeStyle = computed(() => {
  const root = document.documentElement
  if (state.colorScheme) {
    return getComputedStyle(root).getPropertyValue('--color-text').trim()
  }
  return getComputedStyle(root).getPropertyValue('--color-text').trim()
})

const scaleEquave = computed(
  () => scale.relativeIntervals[scale.relativeIntervals.length - 1].value
)

const etDenominator = computed(() => {
  const e = scaleEquave.value
  let result = 1
  for (const interval of scale.relativeIntervals) {
    const fractionOfEquave = interval.value.log(e)
    if (typeof fractionOfEquave === 'number') {
      return null
    }
    result = lcm(result, fractionOfEquave.d)
  }
  return result
})

// While interval.name suffices for the tuning table
// we want more accurate results here.
function formatMatrixCell(interval: Interval) {
  const monzo = interval.value
  if (cellFormat.value === 'fraction') {
    if (
      monzo.isFractional() &&
      (!fractionMaxHeight.value || monzo.tenneyHeight() < fractionMaxHeight.value)
    ) {
      const node = monzo.asFractionLiteral()
      if (node) {
        return literalToString(node)
      }
    }
    try {
      return (
        '~' + new Fraction(monzo.valueOf()).simplifyRelative(simplifyTolerance.value).toFraction()
      )
    } catch {
      return '?'
    }
  }
  if (cellFormat.value === 'cents') {
    return monzo.totalCents(true).toFixed(1)
  }
  if (cellFormat.value === 'decimal') {
    // Consistent with tuning table localization.
    return monzo.valueOf().toFixed(3)
  }
  if (cellFormat.value === 'et') {
    const fractionOfEquave = monzo.log(scaleEquave.value)
    if (typeof fractionOfEquave === 'number') {
      return `~${Math.round(fractionOfEquave * 100)}%`
    }
    const denom = etDenominator.value
    if (denom === null) {
      return fractionOfEquave.toFraction().replace('/', '\\')
    }
    const { s, n, d } = fractionOfEquave
    return `${s * n * (denom / d)}\\${denom}`
  }

  return interval.label || interval.toString()
}

const highlights = reactive<boolean[][]>([])

const matrixError = ref('')
const matrix = ref<Interval[][]>([])

watchEffect(() => {
  try {
    matrix.value = intervalMatrix(scale.relativeIntervals.slice(0, state.maxMatrixWidth))
    matrixError.value = ''
  } catch (error) {
    matrix.value = []
    matrixError.value =
      error instanceof Error ? error.message : 'Unable to calculate interval matrix for this scale.'
  }
})

const centsMatrix = computed(() => matrix.value.map((row) => row.map((i) => i.totalCents(true))))

const matrixRows = computed(() => matrix.value.map((row) => row.map(formatMatrixCell)))
const matrixCoreWidth = computed(() => Math.max(0, (matrixRows.value[0]?.length ?? 0) - 1))
const symmetricMatrix = computed(() =>
  matrixRows.value.map((row, rowIndex) =>
    Array.from(
      { length: matrixCoreWidth.value },
      (_, columnIndex) => row[mmod(columnIndex - rowIndex, scale.scale.size)] ?? 'N/A'
    )
  )
)
const displayedMatrixRows = computed(() =>
  state.intervalMatrixArrangement === 'symmetric' ? symmetricMatrix.value : matrixRows.value
)
const displayColumnCount = computed(() =>
  state.intervalMatrixArrangement === 'symmetric'
    ? (displayedMatrixRows.value[0]?.length ?? 0)
    : matrixCoreWidth.value
)

function rowHeaderLabel(rowIndex: number) {
  if (cellFormat.value === 'best') {
    return scale.labels[mmod(rowIndex - 1, scale.labels.length)]
  }
  return formatMatrixCell(rowIndex ? scale.relativeIntervals[rowIndex - 1] : UNISON)
}

function columnHeaderLabel(columnIndex: number) {
  if (state.intervalMatrixArrangement === 'symmetric') {
    return rowHeaderLabel(columnIndex)
  }
  return columnIndex + state.intervalMatrixIndexing
}

const violations = computed(() => {
  const margin = state.constantStructureMargin
  if (margin) {
    return marginViolations(centsMatrix.value, margin)
  }
  return constantStructureViolations(matrix.value)
})

const variety = computed(() => {
  const margin = state.constantStructureMargin
  if (margin) {
    return marginVarietySignature(centsMatrix.value, margin)
  }
  return varietySignature(matrix.value)
})

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
  const equaveCents = state.nedjiEquave.totalCents(true)
  if (errorModel.value === 'rooted') {
    return rootedEquallyTemperedChord(frequencies, state.maxDivisions, equaveCents)
  }
  return freeEquallyTemperedChord(frequencies, state.maxDivisions, equaveCents)
})

const nedjiProjector = computed(() => {
  if (state.nedjiEquave.equals(OCTAVE)) {
    return ''
  }
  return `<${state.nedjiEquave.toString()}>`
})

function highlight(y?: number, x?: number) {
  if (!state.calculateConstantStructureViolations || state.intervalMatrixArrangement !== 'modes') {
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
    const value = margin ? centsMatrix.value[y][x] : matrix.value[y][x].value
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
  const value = margin ? centsMatrix.value[y][x] : matrix.value[y][x].value
  for (let i = 0; i < matrix.value.length; ++i) {
    if (margin) {
      highlights[i][x] = Math.abs(centsMatrix.value[i][x] - value) < margin
    } else {
      highlights[i][x] = matrix.value[i][x].value.strictEquals(value)
    }
  }
}

// === Harmonic entropy ===
const entropyMode = ref(0)

const centsValues = computed(() => {
  const result: number[] = []
  let index = scale.baseMidiNote + entropyMode.value
  const baseCents = scale.scale.getCents(index)
  while (index < 10000) {
    const cents = scale.scale.getCents(index++) - baseCents
    if (isNaN(cents) || Math.abs(cents) > 6000 + EPSILON) {
      break
    }
    result.push(cents)
  }
  return result
})

const labels = computed(() =>
  centsValues.value.map((_, i) => scale.labelForIndex(scale.baseMidiNote + entropyMode.value + i))
)

const colors = computed(() =>
  centsValues.value.map((_, i) => scale.colorForIndex(scale.baseMidiNote + entropyMode.value + i))
)

watch(subtab, (newValue) => {
  if (newValue === 'entropy') {
    void entropy.fetchTable()
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
        <li>
          <a href="#" :class="{ active: subtab === 'similar' }" @click="subtab = 'similar'"
            >Similar scales</a
          >
        </li>
      </ul>
    </nav>
    <main v-if="subtab === 'matrix'">
      <h2>
        <span class="control radio-group">
          Interval matrix:
          <span>
            <input
              type="radio"
              id="arrangement-modes-title"
              value="modes"
              v-model="state.intervalMatrixArrangement"
            />
            <label for="arrangement-modes-title">Modes</label>
          </span>
          /
          <span>
            <input
              type="radio"
              id="arrangement-symmetric-title"
              value="symmetric"
              v-model="state.intervalMatrixArrangement"
            />
            <label for="arrangement-symmetric-title">Symmetric</label>
          </span>
        </span>
      </h2>
      <div class="control-group interval-matrix">
        <p v-if="matrixError" class="matrix-error">{{ matrixError }}</p>
        <table v-else @mouseleave="highlight()">
          <thead>
            <tr>
              <th></th>
              <th
                v-for="columnIndex of displayColumnCount"
                :key="columnIndex"
                v-show="
                  state.intervalMatrixArrangement !== 'modes' ||
                  state.showModesUnityColumn ||
                  columnIndex !== 1
                "
                :class="{
                  held:
                    state.intervalMatrixArrangement === 'symmetric' &&
                    heldScaleDegrees.has(columnIndex - 1)
                }"
              >
                {{ columnHeaderLabel(columnIndex - 1) }}
              </th>
              <template v-if="state.intervalMatrixArrangement !== 'symmetric'">
                <th v-if="scale.scale.size <= state.maxMatrixWidth">
                  ({{ scale.scale.size + state.intervalMatrixIndexing }})
                </th>
                <th v-else>
                  {{ state.maxMatrixWidth + state.intervalMatrixIndexing }}
                </th>
              </template>
              <th class="brightness" v-if="state.calculateBrightness">Bright %</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) of displayedMatrixRows" :key="i">
              <th :class="{ held: heldScaleDegrees.has(i) }">
                {{ rowHeaderLabel(i) }}
              </th>
              <td
                v-for="(name, j) of row"
                :key="j"
                v-show="
                  state.intervalMatrixArrangement !== 'modes' ||
                  state.showModesUnityColumn ||
                  j !== 0
                "
                :class="{
                  violator:
                    state.calculateConstantStructureViolations &&
                    state.intervalMatrixArrangement === 'modes' &&
                    violations[i][j],
                  highlight:
                    state.intervalMatrixArrangement === 'modes' && (highlights[i] ?? [])[j],
                  held:
                    heldScaleDegrees.has(i) &&
                    (state.intervalMatrixArrangement === 'symmetric'
                      ? heldScaleDegrees.has(j)
                      : heldScaleDegrees.has(mmod(j + i, scale.scale.size)))
                }"
                @mouseover="highlight(i, j)"
              >
                {{ name }}
              </td>
              <td class="brightness" v-if="state.calculateBrightness">{{ brightness[i] }}</td>
            </tr>
            <tr
              class="variety"
              v-if="state.calculateVariety && state.intervalMatrixArrangement === 'modes'"
            >
              <th>Var</th>
              <td v-for="(v, i) of variety" :key="i" v-show="state.showModesUnityColumn || i !== 0">
                {{ v }}
              </td>
              <td class="brightness" v-if="state.calculateBrightness"></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="control-group">
        <div class="control radio-group">
          <label>Display intervals in matrix as</label>
          <span>
            <input type="radio" id="format-best" value="best" v-model="cellFormat" />
            <label for="format-best">Mixed</label>
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
            <input type="radio" id="format-et" value="et" v-model="cellFormat" />
            <label for="format-et">Equal temperament</label>
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
          <label for="fraction-max-height">Fraction maximum Tenney height in nats (0 = off)</label>
          <input id="fraction-max-height" type="number" min="0" v-model="fractionMaxHeight" />
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
        <div class="control checkbox-container">
          <input
            id="show-modes-unity-column"
            type="checkbox"
            v-model="state.showModesUnityColumn"
          />
          <label for="show-modes-unity-column">Show 1/1 column</label>
        </div>
        <div class="control">
          <label for="cs-margin">Constant structure / variety margin in cents</label>
          <input
            id="cs-margin"
            type="number"
            min="0"
            step="any"
            v-model="state.constantStructureMargin"
          />
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
              :maxChordRoot="state.maxOtonalRoot"
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
              :maxChordRoot="state.maxUtonalRoot"
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
                v-model="state.trailLongevity"
              />
            </div>
            <div class="control">
              <label for="otonal-root">Maximum root (otonal)</label>
              <input
                id="otonal-root"
                type="number"
                class="control"
                min="1"
                v-model="state.maxOtonalRoot"
              />
            </div>
            <div class="control">
              <label for="utonal-root">Maximum root (utonal)</label>
              <input
                id="utonal-root"
                type="number"
                class="control"
                min="1"
                v-model="state.maxUtonalRoot"
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
              <input
                id="divisions"
                type="number"
                class="control"
                min="1"
                v-model="state.maxDivisions"
              />
            </div>
            <div class="control">
              <label for="equave">Equave</label>
              <ScaleLineInput
                id="equave"
                @update:value="state.nedjiEquave = $event"
                v-model="state.nedjiEquaveString"
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
        <HarmonicEntropyPlot
          v-if="entropy.table.length"
          :centsValues="centsValues"
          :labels="labels"
          :colors="colors"
        />
        <p v-else-if="entropy.isFetching">Loading harmonic entropy table…</p>
      </div>
      <div class="control-group">
        <div class="control">
          <label for="he-mode">Mode (scale rotation)</label>
          <input id="he-mode" type="number" step="1" v-model="entropyMode" />
        </div>
        <div class="control">
          <label for="N">Maximum Benedetti height</label>
          <input id="N" type="number" min="1000" step="1000" v-model="entropy.N" />
        </div>
        <label for="a">Rényi order: {{ entropy.a.toFixed(4) }}</label>
        <NumericSlider class="control" id="a" min="0.02" max="7" step="any" v-model="entropy.a" />
        <label for="s">Frequency deviation: {{ (entropy.s * 100).toFixed(2) }}%</label>
        <NumericSlider
          class="control"
          id="s"
          min="0.003"
          max="0.02"
          step="any"
          v-model="entropy.s"
        />
      </div>
      <div class="entropy-intervals">
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Cents</th>
              <th>Entropy %</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(cents, i) of centsValues" :key="i">
              <td>{{ labels[i] }}</td>
              <td>{{ cents.toFixed(scale.centsFractionDigits) }}</td>
              <td>{{ (100 * entropy.entropyPercentage(cents)).toFixed(3) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
    <SimilarScales v-if="subtab === 'similar'" :relativeIntervals="scale.relativeIntervals" />
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
  padding: 0;
  margin: 0;
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
nav ul li a:focus,
nav ul li a:hover {
  background-color: var(--color-accent-mute);
}
nav ul li a.active,
nav ul li a.active:focus,
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
.matrix-error {
  color: var(--color-error);
  font-weight: 600;
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
