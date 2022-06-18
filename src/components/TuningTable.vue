<script setup lang="ts">
import type ExtendedMonzo from "@/monzo";
import { parseLine } from "@/parser";
import Scale from "@/scale";
import { mmod } from "@/utils";
import { computed } from "vue";
import TuningTableRow from "./TuningTableRow.vue";

const props = defineProps<{
  lines: string[];
  baseMidiNote: number;
  baseFrequency: number;
}>();

const scaleAndNames = computed<[Scale, string[]]>(() => {
  const intervals: ExtendedMonzo[] = [];
  const names: string[] = [];
  props.lines.forEach((line) => {
    try {
      intervals.push(parseLine(line));
      names.push(line);
    } catch {}
  });
  if (!intervals.length) {
    intervals.push(parseLine("1/1"));
    names.push("1/1");
  }
  return [Scale.fromIntervalArray(intervals, props.baseFrequency), names];
});

const rows = computed(() => {
  const [scale, names] = scaleAndNames.value;
  return Array(128)
    .fill(null)
    .map((_, index) => {
      const i = index - props.baseMidiNote;
      const monzo = scale.getMonzo(i);
      return {
        index,
        frequency: scale.getFrequency(i),
        cents: monzo.toCents(),
        ratio: monzo.valueOf(),
        name: names[mmod(i - 1, names.length)],
      };
    });
});
</script>

<template>
  <div class="column tuning-table">
    <table>
      <thead>
        <tr>
          <th>&nbsp;</th>
          <th>#</th>
          <th>Freq</th>
          <th>Cents</th>
          <th>Ratio</th>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        <TuningTableRow
          v-for="row of rows"
          :key="row.index"
          :index="row.index"
          :frequency="row.frequency"
          :cents="row.cents"
          :ratio="row.ratio"
          :name="row.name"
        />
      </tbody>
    </table>
  </div>
</template>

<style>
/* Tuning table */
.tuning-table table {
  width: 100%;
  text-align: center;
  border-spacing: 0px;
}
.tuning-table table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  font-weight: bold;
}
.tuning-table table tr:nth-of-type(2n) {
  background-color: var(--color-background-soft);
}
</style>
