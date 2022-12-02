<script setup lang="ts">
import VirtualTypingKeyboard from "@/components/VirtualTypingKeyboard.vue";
import type { Keyboard } from "@/keyboard";
import type Scale from "@/scale";

type NoteOff = () => void;
type NoteOnCallback = (index: number) => NoteOff;

defineProps<{
  baseMidiNote: number;
  equaveShift: number;
  degreeShift: number;
  isomorphicHorizontal: number;
  isomorphicVertical: number;
  scale: Scale;
  keyColors: string[];
  noteOn: NoteOnCallback;
  heldNotes: Map<number, number>;
  keyboardMode: "isomorphic" | "piano";
  keyboardMapping: Map<string, number>;
  typingKeyboard: Keyboard;
  deactivationCode: string;
  equaveUpCode: string;
  equaveDownCode: string;
  degreeUpCode: string;
  degreeDownCode: string;
}>();
</script>

<template>
  <main>
    <VirtualTypingKeyboard
      :baseIndex="baseMidiNote + equaveShift * scale.size + degreeShift"
      :baseMidiNote="baseMidiNote"
      :isomorphicHorizontal="isomorphicHorizontal"
      :keyboardMode="keyboardMode"
      :keyboardMapping="keyboardMapping"
      :isomorphicVertical="isomorphicVertical"
      :keyColors="keyColors"
      :noteOn="noteOn"
      :heldNotes="heldNotes"
      :typingKeyboard="typingKeyboard"
      :deactivationCode="deactivationCode"
      :equaveUpCode="equaveUpCode"
      :equaveDownCode="equaveDownCode"
      :degreeUpCode="degreeUpCode"
      :degreeDownCode="degreeDownCode"
    ></VirtualTypingKeyboard>
  </main>
</template>
