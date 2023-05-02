<script setup lang="ts">
import ScaleBuilder from "@/components/ScaleBuilder.vue";
import type { Scale } from "scale-workshop-core";

defineProps<{
  scaleName: string;
  scaleLines: string[];
  baseMidiNote: number;
  keyColors: string[];

  scale: Scale;
  frequencies: number[];

  centsFractionDigits: number;
  decimalFractionDigits: number;
  newline: string;

  midiOctaveOffset: number;
}>();

defineEmits([
  "update:scaleName",
  "update:scaleLines",
  "update:scale",
  "update:baseFrequency",
  "update:baseMidiNote",
  "update:keyColors",
]);
</script>

<template>
  <main>
    <ScaleBuilder
      :scaleName="scaleName"
      :scaleLines="scaleLines"
      :baseMidiNote="baseMidiNote"
      :keyColors="keyColors"
      :scale="scale"
      :frequencies="frequencies"
      :centsFractionDigits="centsFractionDigits"
      :decimalFractionDigits="decimalFractionDigits"
      :newline="newline"
      :midiOctaveOffset="midiOctaveOffset"
      @update:scaleName="$emit('update:scaleName', $event)"
      @update:scaleLines="$emit('update:scaleLines', $event)"
      @update:scale="$emit('update:scale', $event)"
      @update:baseFrequency="$emit('update:baseFrequency', $event)"
      @update:baseMidiNote="$emit('update:baseMidiNote', $event)"
      @update:keyColors="$emit('update:keyColors', $event)"
    />
  </main>
</template>
