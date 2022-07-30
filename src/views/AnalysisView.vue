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
}>();

const cellFormat = ref<"best" | "cents" | "decimal">("best");
const trailLongevity = ref(70);
const maxOtonalRoot = ref(16);
const maxUtonalRoot = ref(23);

const fadeAlpha = computed(() => 1 - trailLongevity.value / 100);

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
    <div class="columns-container">
      <div class="column analysis">
        <h1>Analysis</h1>
        <h2>Interval Matrix / Modes</h2>
        <div class="control-group">
          <label>Cell format</label>
          <div class="control radio-group">
            <span>
              <input
                type="radio"
                id="format-best"
                value="best"
                v-model="cellFormat"
              />
              <label for="format-best"> Best </label>
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
        <h2>Currently played chord</h2>
        <div class="control-group">
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
        <h3>Otonal</h3>
        <div class="control-group">
          <label for="otonal-root">Maximum root</label>
          <input
            id="otonal-root"
            type="number"
            class="control"
            min="1"
            v-model="maxOtonalRoot"
          />
        </div>
        <ChordWheel
          class="chord-wheel"
          type="otonal"
          :maxChordRoot="maxOtonalRoot"
          :virtualSynth="virtualSynth"
          :width="500"
          :height="400"
          :lineWidth="2"
          :backgroundRBG="[255, 255, 255]"
          :fadeAlpha="fadeAlpha"
          :shadowBlur="2"
          strokeStyle="black"
          textColor="red"
        />
        <h3>Utonal</h3>
        <div class="control-group">
          <label for="otonal-root">Maximum root</label>
          <input
            id="utonal-root"
            type="number"
            class="control"
            min="1"
            v-model="maxUtonalRoot"
          />
        </div>
        <ChordWheel
          class="chord-wheel"
          type="utonal"
          :maxChordRoot="maxUtonalRoot"
          :virtualSynth="virtualSynth"
          :width="500"
          :height="400"
          :lineWidth="2"
          :backgroundRBG="[255, 255, 255]"
          :fadeAlpha="fadeAlpha"
          :shadowBlur="2"
          strokeStyle="black"
          textColor="blue"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
th {
  font-weight: bold;
}
table,
th,
td {
  border: 1px solid;
}
th, td {
  padding: 0.2rem 0.5rem;
}
table {
  border-collapse: collapse;
}

div.columns-container {
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-border);
  column-count: 1;
}
div.column {
  background-color: var(--color-background);
  overflow-x: hidden;
  height: 100%;
}
div.analysis {
  padding: 1rem;
}
</style>
