<script setup lang="ts">
import VirtualKeyboard from '@/components/VirtualKeyboard.vue'
import VirtualPiano from '@/components/VirtualPiano.vue'
import { useStateStore } from '@/stores/state'
import { useScaleStore } from '@/stores/scale'
import { computed } from 'vue'

defineProps<{
  noteOn: NoteOnCallback
}>()

const state = useStateStore()
const scale = useScaleStore()

const baseIndex = computed(
  () => scale.baseMidiNote + scale.equaveShift * scale.scale.size + scale.degreeShift
)

type NoteOff = () => void
type NoteOnCallback = (index: number) => NoteOff
</script>

<template>
  <main>
    <VirtualPiano
      v-if="scale.keyboardMode === 'piano'"
      :baseIndex="baseIndex"
      :baseMidiNote="scale.baseMidiNote"
      :colorMap="scale.colorForIndex"
      :splitAccidentals="scale.splitAccidentals"
      :accidentalColor="scale.accidentalColor"
      :lowAccidentalColor="scale.lowAccidentalColor"
      :middleAccidentalColor="scale.middleAccidentalColor"
      :highAccidentalColor="scale.highAccidentalColor"
      :noteOn="noteOn"
      :heldNotes="state.heldNotes"
    ></VirtualPiano>
    <VirtualKeyboard
      v-else
      :baseIndex="baseIndex"
      :baseMidiNote="scale.baseMidiNote"
      :isomorphicHorizontal="state.isomorphicHorizontal"
      :isomorphicVertical="state.isomorphicVertical"
      :colorMap="scale.colorForIndex"
      :noteOn="noteOn"
      :heldNotes="state.heldNotes"
      :baseFrequency="scale.baseFrequency"
      :frequencies="scale.frequencies"
      :centss="scale.centss"
      :labelMap="scale.labelForIndex"
      :showLabel="state.showKeyboardLabel"
      :showCent="state.showKeyboardCents"
      :showRatio="state.showKeyboardRatio"
      :showFrequency="state.showKeyboardFrequency"
    ></VirtualKeyboard>
  </main>
</template>
