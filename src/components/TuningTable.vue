<script setup lang="ts">
import { computed } from 'vue'
import TuningTableRow from '@/components/TuningTableRow.vue'
import { mmod } from 'xen-dev-utils'

const props = defineProps<{
  baseFrequency: number
  frequencies: number[] // All 128 frequencies
  centss: number[] // All 128 cents values
  heldNotes: Map<number, number>
  baseMidiNote: number
  labels: string[] // Labels from #1 to the equave
  colors: string[] // Colors from #1 to the equave
  symbols: string[]
}>()

const rows = computed(() => {
  const inverseBaseFreq = 1 / props.baseFrequency
  return props.frequencies.map((frequency, i) => {
    const active = (props.heldNotes.get(i) ?? 0) > 0
    const index = i - props.baseMidiNote
    const ratio = frequency * inverseBaseFreq
    const cents = props.centss[i]
    return {
      index: i,
      active,
      frequency,
      cents,
      ratio: ratio,
      label: props.labels[mmod(index - 1, props.labels.length)],
      symbol: props.symbols[i],
      color: props.colors[mmod(index - 1, props.colors.length)],
      isRoot: index === 0,
      equave: mmod(index, props.labels.length) === 0
    }
  })
})
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>&nbsp;</th>
        <th>#</th>
        <th>Freq</th>
        <th>Cents</th>
        <th>Ratio</th>
        <th>Label</th>
        <th>Symbol</th>
      </tr>
    </thead>
    <tbody>
      <TuningTableRow v-for="row of rows" :key="row.index" v-bind="row" />
    </tbody>
  </table>
</template>

<style scoped>
table {
  width: 100%;
  text-align: center;
  border-spacing: 0px;
}
table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  font-weight: bold;
}
table table tr:nth-of-type(2n) {
  background-color: var(--color-background-soft);
}
</style>
