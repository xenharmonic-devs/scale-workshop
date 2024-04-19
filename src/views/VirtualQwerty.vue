<script setup lang="ts">
import VirtualTypingKeyboard from '@/components/VirtualTypingKeyboard.vue'
import type { Keyboard } from 'isomorphic-qwerty'
import { useStateStore } from '@/stores/state'
import { useScaleStore } from '@/stores/scale'
import { computed } from 'vue'

const state = useStateStore()
const scale = useScaleStore()

type NoteOff = () => void
type NoteOnCallback = (index: number) => NoteOff

defineProps<{
  noteOn: NoteOnCallback
  typingKeyboard: Keyboard
}>()

const baseIndex = computed(
  () => scale.scale.baseMidiNote + scale.equaveShift * scale.scale.size + scale.degreeShift
)
</script>

<template>
  <main>
    <VirtualTypingKeyboard
      :baseIndex="baseIndex"
      :isomorphicHorizontal="state.isomorphicHorizontal"
      :keyboardMode="scale.keyboardMode"
      :colorScheme="state.colorScheme"
      :qwertyMapping="scale.qwertyMapping"
      :hasLeftOfZ="scale.hasLeftOfZ"
      :isomorphicVertical="state.isomorphicVertical"
      :colorMap="scale.colorForIndex"
      :noteOn="noteOn"
      :heldNotes="state.heldNotes"
      :typingKeyboard="typingKeyboard"
      :deactivationCode="state.deactivationCode"
      :equaveUpCode="state.equaveUpCode"
      :equaveDownCode="state.equaveDownCode"
      :degreeUpCode="state.degreeUpCode"
      :degreeDownCode="state.degreeDownCode"
      :equaveShift="scale.equaveShift"
      :degreeShift="scale.degreeShift"
      @update:equaveShift="scale.equaveShift = $event"
      @update:degreeShift="scale.degreeShift = $event"
    ></VirtualTypingKeyboard>
  </main>
</template>
