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
      @update:scaleName="$emit('update:scaleName', $event.target.value)"
      @update:scaleLines="$emit('update:scaleLines', $event)"
      @update:baseFrequency="
        $emit('update:baseFrequency', parseInt($event.target.value))
      "
      @update:baseMidiNote="
        $emit('update:baseMidiNote', parseFloat($event.target.value))
      "
      @update:keyColors="$emit('update:keyColors', $event)"
    />
  </main>
</template>
