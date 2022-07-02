<script setup lang="ts">
import { mmod } from "@/utils";
import { computed, ref } from "vue";
import VirtualKeyboardKey from "@/components/VirtualKeyboardKey.vue";

type NoteOff = () => void;
type NoteOnCallback = (index: number) => NoteOff;

const props = defineProps<{
  baseIndex: number; // Should incorporate equave shift
  keyColors: string[];
  isomorphicHorizontal: number;
  isomorphicVertical: number;
  noteOn: NoteOnCallback;
}>();

type VirtualKey = {
  x: number;
  y: number;
  index: number;
  color: string;
};

const virtualKeys = computed(() => {
  const colors = props.keyColors;
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
        color: colors[mmod(index, colors.length)],
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
        :class="{ 'hidden-sm': key.x > 8 }"
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
  position: fixed;
  border-spacing: 0px;
  top: 50px;
  left: 0;
  width: 100vw;
  min-width: 500px; /* this stops the keys getting too close together for portrait mobile users */
  height: calc(100vh - 50px);
  z-index: 100;
}
</style>
