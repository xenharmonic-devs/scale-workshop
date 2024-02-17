<script setup lang="ts">
import { constantStructureViolations, intervalMatrix } from '@/analysis'
import ChordWheel from '@/components/ChordWheel.vue'
import { computed, reactive, ref } from 'vue'
import { useAudioStore } from '@/stores/audio'
import { useStateStore } from '@/stores/state'
import type { Interval } from 'sonic-weave'
import { useScaleStore } from '@/stores/scale'
import { mmod } from 'xen-dev-utils'

// TODO: Make customizable
const MAX_SCALE_SIZE = 100

const audio = useAudioStore()
const state = useStateStore()
const scale = useScaleStore()

const cellFormat = ref<'best' | 'cents' | 'decimal'>('best')
const trailLongevity = ref(70)
const maxOtonalRoot = ref(16)
const maxUtonalRoot = ref(23)

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
  if (cellFormat.value === 'cents') {
    return interval.totalCents().toFixed(1)
  }
  if (cellFormat.value === 'decimal') {
    // Consistent with tuning table localization.
    return interval.valueOf().toFixed(3)
  }

  return interval.toString()
}

const highlights = reactive<boolean[][]>([])

const matrix = computed(() => intervalMatrix(scale.relativeIntervals))

const matrixRows = computed(() => matrix.value.map((row) => row.map(formatMatrixCell)))

const violations = computed(() => constantStructureViolations(matrix.value))

const heldScaleDegrees = computed(() => {
  const result: Set<number> = new Set()
  for (const midiIndex of state.heldNotes.keys()) {
    if (state.heldNotes.get(midiIndex)! > 0) {
      result.add(mmod(midiIndex - scale.baseMidiNote, scale.scale.size))
    }
  }
  return result
})

function highlight(y?: number, x?: number) {
  if (highlights.length !== matrix.value.length) {
    highlights.length = 0
    for (let i = 0; i < matrix.value.length; ++i) {
      highlights.push(Array(matrix.value[i].length).fill(false))
    }
  }
  // Look at other violators
  if (y !== undefined && x !== undefined && violations.value[y][x]) {
    const value = matrix.value[y][x].value
    for (let i = 0; i < matrix.value.length; ++i) {
      for (let j = 0; j < matrix.value[i].length; ++j) {
        if (violations.value[i][j]) {
          highlights[i][j] = matrix.value[i][j].value.strictEquals(value)
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
  const value = matrix.value[y][x].value
  for (let i = 0; i < matrix.value.length; ++i) {
    highlights[i][x] = matrix.value[i][x].value.strictEquals(value)
  }
}
</script>

<template>
  <main>
    <h2>Interval matrix (modes)</h2>
    <div class="control-group interval-matrix">
      <table @mouseleave="highlight()">
        <tr>
          <th></th>
          <th v-for="i of Math.min(scale.scale.size, MAX_SCALE_SIZE)" :key="i">
            {{ i - 1 + state.intervalMatrixIndexing }}
          </th>
          <th>({{ scale.scale.size + state.intervalMatrixIndexing }})</th>
        </tr>
        <tr v-for="(row, i) of matrixRows" :key="i">
          <th :class="{held: heldScaleDegrees.has(i)}">{{ scale.labels[mmod(i - 1, scale.labels.length)] }}</th>
          <td v-for="(name, j) of row" :key="j" :class="{violator: violations[i][j], highlight: (highlights[i] ?? [])[j]}" @mouseover="highlight(i, j)">{{ name }}</td>
        </tr>
      </table>
    </div>
    <div class="control-group">
      <div class="control radio-group">
        <label>Display intervals in matrix as</label>
        <span>
          <input type="radio" id="format-best" value="best" v-model="cellFormat" />
          <label for="format-best"> Default </label>
        </span>

        <span>
          <input type="radio" id="format-cents" value="cents" v-model="cellFormat" />
          <label for="format-cents"> Cents </label>
        </span>

        <span>
          <input type="radio" id="format-decimal" value="decimal" v-model="cellFormat" />
          <label for="format-decimal"> Decimal ratio </label>
        </span>
      </div>
      <div class="control radio-group">
        <label>Interval indexing</label>
        <span>
          <input type="radio" id="indexing-zero" value="0" v-model="intervalMatrixIndexingRadio" />
          <label for="indexing-zero"> 0-indexing (default) </label>
        </span>

        <span>
          <input type="radio" id="indexing-one" value="1" v-model="intervalMatrixIndexingRadio" />
          <label for="indexing-one"> 1-indexing </label>
        </span>
      </div>
    </div>
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
        </div>
        <div class="control-group">
          <div class="control">
            <label for="otonal-root">Maximum root (otonal)</label>
            <input id="otonal-root" type="number" class="control" min="1" v-model="maxOtonalRoot" />
          </div>
        </div>
        <div class="control-group">
          <div class="control">
            <label for="utonal-root">Maximum root (utonal)</label>
            <input id="utonal-root" type="number" class="control" min="1" v-model="maxUtonalRoot" />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* View */
main {
  padding: 1rem;
  overflow-y: auto !important;
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

/* Content layout (medium) */
div.columns-container {
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
</style>
