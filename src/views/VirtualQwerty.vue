<script setup lang="ts">
import VirtualTypingKeyboard from '@/components/VirtualTypingKeyboard.vue'
import type { Keyboard } from 'isomorphic-qwerty'
import { useStateStore } from '@/stores/state'

const state = useStateStore()

type NoteOff = () => void
type NoteOnCallback = (index: number) => NoteOff

defineProps<{
  noteOn: NoteOnCallback
  typingKeyboard: Keyboard
}>()

defineEmits(['update:equaveShift', 'update:degreeShift'])
</script>

<template>
  <main>
    <VirtualTypingKeyboard
      :baseIndex="state.baseIndex"
      :baseMidiNote="state.baseMidiNote"
      :isomorphicHorizontal="state.isomorphicHorizontal"
      :keyboardMode="state.keyboardMode"
      :colorScheme="state.colorScheme"
      :keyboardMapping="state.keyboardMapping"
      :isomorphicVertical="state.isomorphicVertical"
      :keyColors="state.keyColors"
      :noteOn="noteOn"
      :heldNotes="state.heldNotes"
      :typingKeyboard="typingKeyboard"
      :deactivationCode="state.deactivationCode"
      :equaveUpCode="state.equaveUpCode"
      :equaveDownCode="state.equaveDownCode"
      :degreeUpCode="state.degreeUpCode"
      :degreeDownCode="state.degreeDownCode"
      :equaveShift="state.equaveShift"
      :degreeShift="state.degreeShift"
      @update:equaveShift="$emit('update:equaveShift', $event)"
      @update:degreeShift="$emit('update:degreeShift', $event)"
    ></VirtualTypingKeyboard>
  </main>
</template>
