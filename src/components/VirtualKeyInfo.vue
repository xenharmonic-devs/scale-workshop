<script setup lang="ts">
import { formatHertz, formatExponential, formatCents } from '@/utils'

const props = defineProps<{
  label: string
  cent: number
  ratio: number
  frequency: number
  showLabel: boolean
  showCent: boolean
  showRatio: boolean
  showFrequency: boolean
}>()
</script>

<template>
  <div class="key-info">
    <div v-if="props.showLabel">
      <strong>{{ props.label }}</strong>
    </div>
    <div v-if="props.showCent">{{ formatCents(props.cent, 0) }}</div>
    <div v-if="props.showRatio">{{ formatExponential(props.ratio) }}</div>
    <div v-if="props.showFrequency">{{ formatHertz(props.frequency) }}</div>
  </div>
</template>

<style scoped>
.key-info {
  font-size: 1.25em;
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.3);
}

[data-theme='dark'] .key-info {
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
}

.dark .key-info {
  color: white;
  text-shadow: none;
}

.light .key-info {
  color: black;
  text-shadow: none;
}
</style>
