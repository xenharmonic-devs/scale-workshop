<script setup lang="ts">
import VirtualKeyboard from '@/components/VirtualKeyboard.vue'
import VirtualPiano from '@/components/VirtualPiano.vue'
import { useStateStore } from '@/stores/state'
import { useScaleStore } from '@/stores/scale'
import { computed } from 'vue';

defineProps<{
  noteOn: NoteOnCallback
}>()

const state = useStateStore()
const scale = useScaleStore()

const baseIndex = computed(
  () => scale.baseMidiNote + state.equaveShift * scale.scale.size + state.degreeShift
)

type NoteOff = () => void
type NoteOnCallback = (index: number) => NoteOff
</script>

<template>
  <main>
    <VirtualPiano
      v-if="state.keyboardMode === 'piano'"
      :baseIndex="baseIndex"
      :baseMidiNote="scale.baseMidiNote"
      :keyColors="scale.colors"
      :noteOn="noteOn"
      :heldNotes="state.heldNotes"
    ></VirtualPiano>
    <VirtualKeyboard
      v-else
      :baseIndex="baseIndex"
      :baseMidiNote="scale.baseMidiNote"
      :isomorphicHorizontal="state.isomorphicHorizontal"
      :isomorphicVertical="state.isomorphicVertical"
      :keyColors="scale.colors"
      :noteOn="noteOn"
      :heldNotes="state.heldNotes"
    ></VirtualKeyboard>
  </main>
</template>
