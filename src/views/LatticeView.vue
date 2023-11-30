<script setup lang="ts">
import { computed } from 'vue'
import type { Scale } from 'scale-workshop-core'
import { mmod } from 'xen-dev-utils'
import ScaleLattice from '@/components/ScaleLattice.vue'

const props = defineProps<{
  scale: Scale
  baseMidiNote: number
  keyColors: string[]
  heldNotes: Map<number, number>
}>()

const heldScaleDegrees = computed(() => {
  const result: Set<number> = new Set()
  for (const tableIndex of props.heldNotes.keys()) {
    if (props.heldNotes.get(tableIndex)! > 0) {
      result.add(mmod(tableIndex - props.baseMidiNote, props.scale.size))
    }
  }
  return result
})
</script>

<template>
  <main>
    <h2>Lattice visualization</h2>
    <ScaleLattice :scale="scale" :heldScaleDegrees="heldScaleDegrees" />
  </main>
</template>

<style scoped>
/* View */
main {
  padding: 1rem;
  overflow-y: auto !important;
  display: flex;
  flex-direction: column;
}
</style>
