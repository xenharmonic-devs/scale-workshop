<script setup lang="ts">
import { intervalMatrix } from "@/analysis";
import type Scale from "@/scale";
import type { VirtualSynth } from "@/virtual-synth";
import ChordWheel from "@/components/ChordWheel.vue";
import { computed, ref } from "vue";
import type { Interval, IntervalOptions } from "@/interval";

const props = defineProps<{
  scale: Scale;
  virtualSynth: VirtualSynth;
  colorScheme: "light" | "dark";
}>();

const cellFormat = ref<"best" | "cents" | "decimal">("best");
const trailLongevity = ref(70);
const maxOtonalRoot = ref(16);
const maxUtonalRoot = ref(23);

const fadeAlpha = computed(() => 1 - trailLongevity.value / 100);

const backgroundRBG = computed<[number, number, number]>(() => {
  // Add dependency.
  props.colorScheme;
  // Fetch from document.
  const css = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-background")
    .trim()
    .toLowerCase();
  if (css === "#fff") {
    return [255, 255, 255];
  } else if (css === "#000") {
    return [0, 0, 0];
  } else {
    throw new Error("General color parsing not implemented");
  }
});

const strokeStyle = computed(() => {
  // Add dependency.
  props.colorScheme;
  // Fetch from document.
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--color-text")
    .trim();
});

// While interval.name suffices for the tuning table
// we want more accurate results here.
function formatMatrixCell(interval: Interval) {
  // We don't have much space so let's not waste it on insignificant digits.
  const options: IntervalOptions = {
    centsFractionDigits: 1,
    decimalFractionDigits: 3,
  };
  interval = interval.mergeOptions(options);

  if (cellFormat.value === "cents") {
    return interval.centsString();
  }
  if (cellFormat.value === "decimal") {
    return interval.decimalString();
  }

  // Monzos are too long.
  if (interval.type === "monzo") {
    return interval.centsString();
  }
  // Composite intervals are too long or not accurate.
  if (interval.isComposite()) {
    return interval.centsString();
  }
  // If we're here the name should faithfully represent the interval.
  return interval.name;
}

const matrix = computed(() => {
  return intervalMatrix(
    props.scale.mergeOptions({
      centsFractionDigits: 1,
      decimalFractionDigits: 3,
    })
  ).map((row) => row.map(formatMatrixCell));
});
</script>

<template>
  <main>
    <h2>Interval matrix (modes)</h2>
    <div class="control-group interval-matrix">
      <table>
        <tr>
          <th></th>
          <th v-for="i of scale.size" :key="i">{{ i }}</th>
          <th>({{ scale.size + 1 }})</th>
        </tr>
        <tr v-for="(row, i) of matrix" :key="i">
          <th>{{ formatMatrixCell(scale.getInterval(i)) }}</th>
          <td v-for="(name, j) of row" :key="j">{{ name }}</td>
        </tr>
      </table>
    </div>
    <div class="control-group">
      <div class="control radio-group">
        <label>Display intervals in matrix as</label>
        <span>
          <input
            type="radio"
            id="format-best"
            value="best"
            v-model="cellFormat"
          />
          <label for="format-best"> Default </label>
        </span>

        <span>
          <input
            type="radio"
            id="format-cents"
            value="cents"
            v-model="cellFormat"
          />
          <label for="format-cents"> Cents </label>
        </span>

        <span>
          <input
            type="radio"
            id="format-decimal"
            value="decimal"
            v-model="cellFormat"
          />
          <label for="format-decimal"> Decimal ratio </label>
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
            :virtualSynth="virtualSynth"
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
            :virtualSynth="virtualSynth"
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
            <input
              id="otonal-root"
              type="number"
              class="control"
              min="1"
              v-model="maxOtonalRoot"
            />
          </div>
        </div>
        <div class="control-group">
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
