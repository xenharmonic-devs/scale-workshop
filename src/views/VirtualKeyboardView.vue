<script setup lang="ts">
import VirtualKeyboard from '@/components/VirtualKeyboard.vue'
import VirtualPiano from '@/components/VirtualPiano.vue'
import type { Scale } from 'scale-workshop-core'

type NoteOff = () => void
type NoteOnCallback = (index: number) => NoteOff

defineProps<{
  baseMidiNote: number
  equaveShift: number
  degreeShift: number
  isomorphicHorizontal: number
  isomorphicVertical: number
  scale: Scale
  keyColors: string[]
  noteOn: NoteOnCallback
  heldNotes: Map<number, number>
  keyboardMode: 'isomorphic' | 'piano'
}>()
</script>

<template>
  <main>
    <VirtualPiano
      v-if="keyboardMode === 'piano'"
      :baseIndex="baseMidiNote + equaveShift * scale.size + degreeShift"
      :baseMidiNote="baseMidiNote"
      :keyColors="keyColors"
      :noteOn="noteOn"
      :heldNotes="heldNotes"
    ></VirtualPiano>
    <VirtualKeyboard
      v-else
      :baseIndex="baseMidiNote + equaveShift * scale.size + degreeShift"
      :baseMidiNote="baseMidiNote"
      :isomorphicHorizontal="isomorphicHorizontal"
      :isomorphicVertical="isomorphicVertical"
      :keyColors="keyColors"
      :noteOn="noteOn"
      :heldNotes="heldNotes"
    ></VirtualKeyboard>
  </main>
</template>
