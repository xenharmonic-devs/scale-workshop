<script setup lang="ts">
import { formatHertz, formatExponential } from "@/utils";

defineProps<{
  index: number;
  frequency: number;
  cents: number;
  ratio: number;
  name: string;
}>();
</script>

<template>
  <tr>
    <td></td>
    <td>{{ index }}</td>
    <td>{{ formatHertz(frequency) }}</td>
    <td>{{ formatExponential(cents) }}</td>
    <td>{{ formatExponential(ratio) }}</td>
    <td>{{ name }}</td>
  </tr>
</template>
