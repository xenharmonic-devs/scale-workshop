<script setup lang="ts">
import type Scale from "@/scale";
import { computed } from "vue";
import TuningTableRow from "@/components/TuningTableRow.vue";
import { mmod } from "xen-dev-utils";

const props = defineProps<{
  scale: Scale;
  frequencies: number[];
  baseMidiNote: number;
  keyColors: string[];
}>();

const rows = computed(() => {
  const colors = props.keyColors.length ? props.keyColors : ["white"];
  return props.frequencies.map((frequency, i) => {
    const index = i - props.baseMidiNote;
    const monzo = props.scale.getMonzo(index);
    return {
      index: i,
      frequency: frequency,
      cents: monzo.toCents(),
      ratio: monzo.valueOf(),
      name: props.scale.getName(index),
      keyColor: colors[mmod(index, colors.length)],
      isRoot: index === 0,
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
        <TuningTableRow v-for="row of rows" :key="row.index" v-bind="row" />
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
