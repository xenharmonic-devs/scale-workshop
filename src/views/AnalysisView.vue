<script setup lang="ts">
// Placeholder code for analysis to see that props are passed to lazy views too.
defineProps<{
  scaleLines: string[];
  baseFrequency: number;
}>();
</script>

<template>
  <main>
    <h1>Analysis</h1>
    <i>Analysing...</i>
    <p v-for="(line, i) of scaleLines" :key="i">{{ line }}</p>
    <strong>Analysis complete!</strong>
    <p>Looks like a musical scale with base frequency = {{ baseFrequency }}</p>
  </main>
</template>
