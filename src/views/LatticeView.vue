<script setup lang="ts">
import { computed } from 'vue'
import { mmod } from 'xen-dev-utils'
import ScaleLattice from '@/components/ScaleLattice.vue'
import { useStateStore } from '@/stores/state'

const state = useStateStore()

const heldScaleDegrees = computed(() => {
  const result: Set<number> = new Set()
  for (const tableIndex of state.heldNotes.keys()) {
    if (state.heldNotes.get(tableIndex)! > 0) {
      result.add(mmod(tableIndex - state.baseMidiNote, state.scale.size))
    }
  }
  return result
})
</script>

<template>
  <main>
    <h2>Lattice visualization</h2>
    <ScaleLattice :scale="state.scale" :heldScaleDegrees="heldScaleDegrees" />
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
