<script setup lang="ts">
import { computed, ref } from "vue";
import VirtualKeyboardKey from "@/components/VirtualKeyboardKey.vue";
import { mmod } from "xen-dev-utils";

type NoteOff = () => void;
type NoteOnCallback = (index: number) => NoteOff;

const props = defineProps<{
  baseIndex: number; // Should incorporate equave shift
  baseMidiNote: number;
  keyColors: string[];
  isomorphicHorizontal: number;
  isomorphicVertical: number;
  noteOn: NoteOnCallback;
  heldNotes: Map<number, number>;
}>();

type VirtualKey = {
  x: number;
  y: number;
  index: number;
  color: string;
};

const virtualKeys = computed(() => {
  const colors = props.keyColors.length ? props.keyColors : ["white"];
  const horizontal = props.isomorphicHorizontal;
  const vertical = props.isomorphicVertical;
  const result: [number, VirtualKey[]][] = [];
  for (let y = 3; y >= -1; y--) {
    const row = [];
    for (let x = 0; x <= 12; ++x) {
      const index = props.baseIndex + x * horizontal + y * vertical;
      row.push({
        x,
        y,
        index,
        color: colors[mmod(index - props.baseMidiNote, colors.length)],
      });
    }
    result.push([y, row]);
  }
  return result;
});

const isMousePressed = ref(false);
</script>

<template>
  <table>
    <tr
      v-for="[y, row] of virtualKeys"
      :key="y"
      :class="{ 'hidden-sm': y < 0 || y > 3 }"
    >
      <VirtualKeyboardKey
        v-for="key of row"
        :key="key.x"
        :class="{
          'hidden-sm': key.x > 8,
          held: (heldNotes.get(key.index) || 0) > 0,
        }"
        :color="key.color"
        :isMousePressed="isMousePressed"
        :noteOn="() => noteOn(key.index)"
        @press="isMousePressed = true"
        @unpress="isMousePressed = false"
      ></VirtualKeyboardKey>
    </tr>
  </table>
</template>

<style scoped>
table {
  background-color: white;
  border-spacing: 0px;
  width: 100%;
  height: 100%;
  min-width: 500px; /* this stops the keys getting too close together for portrait mobile users */
}
</style>
