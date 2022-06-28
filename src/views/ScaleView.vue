<script setup lang="ts">
import ScaleBuilder from "@/components/ScaleBuilder.vue";
import type Scale from "@/scale";

defineProps<{
  scaleName: string;
  scaleLines: string[];
  baseFrequency: number;
  baseMidiNote: number;
  keyColors: string[];
  scale: Scale;
  names: string[];
  frequencies: number[];
  heldKeys: Set<number>;
}>();

defineEmits([
  "update:scaleName",
  "update:scaleLines",
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
      :baseFrequency="baseFrequency"
      :baseMidiNote="baseMidiNote"
      :keyColors="keyColors"
      :scale="scale"
      :names="names"
      :frequencies="frequencies"
      :heldKeys="heldKeys"
      @update:scaleName="$emit('update:scaleName', $event)"
      @update:scaleLines="$emit('update:scaleLines', $event)"
      @update:baseFrequency="$emit('update:baseFrequency', $event)"
      @update:baseMidiNote="$emit('update:baseMidiNote', $event)"
      @update:keyColors="$emit('update:keyColors', $event)"
    />
  </main>
</template>
