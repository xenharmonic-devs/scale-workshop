<script setup lang="ts">
import ScaleBuilder from "@/components/ScaleBuilder.vue";

defineProps<{
  scaleLines: string[];
  baseFrequency: number;
  baseMidiNote: number;
}>();

defineEmits([
  "update:scaleLines",
  "update:baseFrequency",
  "update:baseMidiNote",
]);
</script>

<template>
  <main>
    <ScaleBuilder
      :scaleLines="scaleLines"
      :baseFrequency="baseFrequency"
      :baseMidiNote="baseMidiNote"
      @update:scaleLines="$emit('update:scaleLines', $event)"
      @update:baseFrequency="
        $emit('update:baseFrequency', parseInt($event.target.value))
      "
      @update:baseMidiNote="
        $emit('update:baseMidiNote', parseFloat($event.target.value))
      "
    />
  </main>
</template>
