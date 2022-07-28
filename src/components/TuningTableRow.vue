<script setup lang="ts">
import { formatHertz, formatExponential } from "@/utils";
import { onMounted, ref } from "vue";

const props = defineProps<{
  index: number;
  frequency: number;
  cents: number;
  ratio: number;
  name: string;
  keyColor: string;
  isRoot: boolean;
}>();

const element = ref<HTMLTableRowElement | null>(null);

// Application state is not suited for real-time display
// se we use hacks to bypass it.
onMounted(() => {
  let rows;
  if ("TUNING_TABLE_ROWS" in window) {
    rows = (window as any).TUNING_TABLE_ROWS;
  } else {
    rows = (window as any).TUNING_TABLE_ROWS = Array(128);
  }
  (element as any).heldKeys = 0;
  rows[props.index] = element;

  if (props.isRoot) {
    element.value!.scrollIntoView({ block: "center" });
  }
});
</script>

<template>
  <tr ref="element" :style="'background-color:' + keyColor + ';'">
    <td
      class="key-color"
      :style="'background-color:' + keyColor + ' !important;'"
    ></td>
    <td>{{ index }}</td>
    <td>{{ formatHertz(frequency) }}</td>
    <td>{{ formatExponential(cents) }}</td>
    <td>{{ formatExponential(ratio) }}</td>
    <td>{{ name }}</td>
  </tr>
</template>

<style scoped>
tr:not(.active) td:not(.key-color) {
  background-color: var(--color-background-semitransparent);
}
tr.active {
  background-color: var(--color-accent) !important;
  color: var(--color-accent-text);
}
.key-color {
  border-bottom: 1px solid var(--color-background-mute);
}
</style>
