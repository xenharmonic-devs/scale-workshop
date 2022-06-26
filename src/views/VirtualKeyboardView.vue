<script setup lang="ts">
import VirtualKeyboard from "@/components/VirtualKeyboard.vue";
import type Scale from "@/scale";

type NoteOff = () => void;
type NoteOnCallback = (index: number) => NoteOff;

defineProps<{
  baseMidiNote: number;
  equaveShift: number;
  isomorphicHorizontal: number;
  isomorphicVertical: number;
  scale: Scale;
  keyColors: string[];
  noteOn: NoteOnCallback;
}>();
</script>

<template>
  <main>
    <VirtualKeyboard
      :baseIndex="baseMidiNote + equaveShift * scale.size"
      :isomorphicHorizontal="isomorphicHorizontal"
      :isomorphicVertical="isomorphicVertical"
      :keyColors="keyColors"
      :noteOn="noteOn"
    ></VirtualKeyboard>
  </main>
</template>
