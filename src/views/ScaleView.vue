<script setup lang="ts">
import ScaleBuilder from "@/components/ScaleBuilder.vue";

defineProps<{
  scaleName: string;
  scaleLines: string[];
  baseFrequency: number;
  baseMidiNote: number;
  keyColors: string[];
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
      @update:scaleName="$emit('update:scaleName', $event)"
      @update:scaleLines="$emit('update:scaleLines', $event)"
      @update:baseFrequency="$emit('update:baseFrequency', $event)"
      @update:baseMidiNote="$emit('update:baseMidiNote', $event)"
      @update:keyColors="$emit('update:keyColors', $event)"
    />
  </main>
</template>
