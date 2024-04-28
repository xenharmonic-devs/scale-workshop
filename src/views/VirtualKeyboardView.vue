<script setup lang="ts">
import VirtualKeyboard from '@/components/VirtualKeyboard.vue'
import VirtualPiano from '@/components/VirtualPiano.vue'
import { useStateStore } from '@/stores/state'

defineProps<{
  noteOn: NoteOnCallback
}>()

const state = useStateStore()

type NoteOff = () => void
type NoteOnCallback = (index: number) => NoteOff
</script>

<template>
  <main>
    <VirtualPiano
      v-if="state.keyboardMode === 'piano'"
      :baseIndex="state.baseIndex"
      :baseMidiNote="state.baseMidiNote"
      :keyColors="state.keyColors"
      :noteOn="noteOn"
      :heldNotes="state.heldNotes"
    ></VirtualPiano>
    <VirtualKeyboard
      v-else
      :baseIndex="state.baseIndex"
      :baseMidiNote="state.baseMidiNote"
      :isomorphicHorizontal="state.isomorphicHorizontal"
      :isomorphicVertical="state.isomorphicVertical"
      :keyColors="state.keyColors"
      :noteOn="noteOn"
      :heldNotes="state.heldNotes"
      :frequencies="state.frequencies"
      :baseFrequency="state.scaleRaw.baseFrequency"
      :scale="state.scale"      
      :showLabel="state.showKeyboardLabel"
      :showCents="state.showKeyboardCents"
      :showRatio="state.showKeyboardRatio"
      :showFrequency="state.showKeyboardFrequency"
    ></VirtualKeyboard>
  </main>
</template>
