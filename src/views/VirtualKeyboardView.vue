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
  () => scale.scale.baseMidiNote + scale.equaveShift * scale.scale.size + scale.degreeShift
)

type NoteOff = () => void
type NoteOnCallback = (index: number) => NoteOff
</script>

<template>
  <main>
    <VirtualPiano
      v-if="scale.keyboardMode === 'piano'"
      :baseIndex="baseIndex"
      :baseMidiNote="scale.scale.baseMidiNote"
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
      :isomorphicHorizontal="state.isomorphicHorizontal"
      :isomorphicVertical="state.isomorphicVertical"
      :colorMap="scale.colorForIndex"
      :noteOn="noteOn"
      :heldNotes="state.heldNotes"
      :scale="scale.scale"
      :labelMap="scale.labelForIndex"
      :showLabel="state.showKeyboardLabel"
      :showCents="state.showKeyboardCents"
      :showRatio="state.showKeyboardRatio"
      :showFrequency="state.showKeyboardFrequency"
    ></VirtualKeyboard>
  </main>
</template>
