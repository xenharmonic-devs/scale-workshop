<script setup lang="ts">
import ExtendedMonzo from "@/monzo";
import Scale from "@/scale";
import { mmod } from "@/utils";
import Fraction from "fraction.js";
import { computed } from "vue";
import TuningTableRow from "./TuningTableRow.vue";

const props = defineProps<{
  lines: string[];
  baseMidiNote: number;
  baseFrequency: number;
}>();

// Placeholder for dynamically parsed intervals in the future
const DEFAULT_NUMBER_OF_COMPONENTS = 25;
const dummyIntervals = [
  ExtendedMonzo.fromFraction(new Fraction("5/4"), DEFAULT_NUMBER_OF_COMPONENTS),
  ExtendedMonzo.fromEqualTemperament(
    new Fraction("7/12"),
    new Fraction(2),
    DEFAULT_NUMBER_OF_COMPONENTS
  ),
  ExtendedMonzo.fromCents(1101.1, DEFAULT_NUMBER_OF_COMPONENTS),
  ExtendedMonzo.fromValue(2.0, DEFAULT_NUMBER_OF_COMPONENTS),
];

const scale = computed(() => {
  return Scale.fromIntervalArray(dummyIntervals, props.baseFrequency);
});

const rows = computed(() => {
  const scl = scale.value;
  return Array(128)
    .fill(null)
    .map((_, index) => {
      const i = index - props.baseMidiNote;
      const monzo = scl.getMonzo(i);
      return {
        index,
        frequency: scl.getFrequency(i),
        cents: monzo.toCents(),
        ratio: monzo.valueOf(),
        name: props.lines[mmod(i - 1, props.lines.length)],
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
