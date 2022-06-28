<script setup lang="ts">
import { formatHertz, formatExponential } from "@/utils";

defineProps<{
  index: number;
  frequency: number;
  cents: number;
  ratio: number;
  name: string;
  keyColor: string;
  active: boolean;
}>();
</script>

<template>
  <tr :class="{ active }">
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
tr.active {
  background-color: blueviolet !important;
}
.key-color {
  border-bottom: 1px solid var(--color-background-mute);
}
</style>
