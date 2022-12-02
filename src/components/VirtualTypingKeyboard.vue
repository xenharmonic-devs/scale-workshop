<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { mmod } from "xen-dev-utils";
import type { Keyboard, CoordinateKeyboardEvent } from "@/keyboard";
import { CODES_LAYER_1 } from "@/keyboard";

/** TODO
 * Make clickable/touchable
 */

type NoteOff = () => void;
type NoteOnCallback = (index: number) => NoteOff;

const props = defineProps<{
  baseIndex: number; // Should incorporate equave shift
  baseMidiNote: number;
  keyColors: string[];
  keyboardMode: "isomorphic" | "piano";
  keyboardMapping: Map<string, number>;
  isomorphicHorizontal: number;
  isomorphicVertical: number;
  noteOn: NoteOnCallback;
  heldNotes: Map<number, number>;
  typingKeyboard: Keyboard;
  deactivationCode: string;
  equaveUpCode: string;
  equaveDownCode: string;
  degreeUpCode: string;
  degreeDownCode: string;
}>();

type VirtualKey = {
  key: string;
  x: number;
  y: number;
  index?: number;
  color: string;
  stroke: string;
  class: {
    black: boolean;
    white: boolean;
    active: boolean;
  };
};

const activeKeys = reactive(new Set());

const rows = computed(() => {
  const colors = props.keyColors.length ? props.keyColors : ["white"];
  const horizontal = props.isomorphicHorizontal;
  const vertical = props.isomorphicVertical;
  const base = props.baseIndex;
  const midi = props.baseMidiNote;
  const mapping = props.keyboardMapping;

  const result: VirtualKey[][] = [];

  const offsets = [200, 250, 280, 230];
  let j = 0;
  for (const codeRow of CODES_LAYER_1) {
    const row = [];
    let i = 0;
    for (const code of codeRow) {
      if (code === null || code === "Backquote") {
        continue;
      }
      let index;
      if (props.keyboardMode === "isomorphic") {
        index = base + i * horizontal + (2 - j) * vertical;
      } else {
        index = mapping!.get(code);
      }
      const color =
        index === undefined
          ? "whitesmoke"
          : colors[mmod(index - midi, colors.length)];
      const black = color.toLowerCase() === "black";
      row.push({
        key: code,
        x: offsets[j] + 100 * i,
        y: 100 + 100 * j,
        index,
        color: color,
        stroke: index === undefined ? "whitesmoke" : "dimgray",
        class: {
          black,
          white: !black && index !== undefined,
          active: activeKeys.has(code) && index !== undefined,
        },
      });
      i++;
    }
    result.push(row);
    j++;
  }
  return result;
});

const noteOffFill = ref("lightgray");
const equaveUpFill = ref("lightgray");
const equaveDownFill = ref("lightgray");
const degreeUpFill = ref("lightgray");
const degreeDownFill = ref("lightgray");
const shiftLeftFill = ref("lightgray");
const shiftRightFill = ref("lightgray");

function typingKeyDown(event: CoordinateKeyboardEvent) {
  activeKeys.add(event.code);
  return () => activeKeys.delete(event.code);
}

function windowKeyDown(event: KeyboardEvent) {
  const code = event.code;
  if (code === props.deactivationCode) {
    noteOffFill.value = "limegreen";
  }
  if (code === props.equaveUpCode) {
    equaveUpFill.value = "limegreen";
  }
  if (code === props.equaveDownCode) {
    equaveDownFill.value = "limegreen";
  }
  if (code === props.degreeUpCode) {
    degreeUpFill.value = "limegreen";
  }
  if (code === props.degreeDownCode) {
    degreeDownFill.value = "limegreen";
  }
  if (code === "ShiftLeft") {
    shiftLeftFill.value = "limegreen";
  }
  if (code === "ShiftRight") {
    shiftRightFill.value = "limegreen";
  }
}

function windowKeyUp(event: KeyboardEvent) {
  const code = event.code;
  if (code === props.deactivationCode) {
    noteOffFill.value = "lightgray";
  }
  if (code === props.equaveUpCode) {
    equaveUpFill.value = "lightgray";
  }
  if (code === props.equaveDownCode) {
    equaveDownFill.value = "lightgray";
  }
  if (code === props.degreeUpCode) {
    degreeUpFill.value = "lightgray";
  }
  if (code === props.degreeDownCode) {
    degreeDownFill.value = "lightgray";
  }
  if (code === "ShiftLeft") {
    shiftLeftFill.value = "lightgray";
  }
  if (code === "ShiftRight") {
    shiftRightFill.value = "lightgray";
  }
}

onMounted(() => {
  props.typingKeyboard.addKeydownListener(typingKeyDown);
  window.addEventListener("keydown", windowKeyDown);
  window.addEventListener("keyup", windowKeyUp);
});

onUnmounted(() => {
  props.typingKeyboard.removeEventListener(typingKeyDown);
  window.removeEventListener("keydown", windowKeyDown);
  window.removeEventListener("keyup", windowKeyUp);
});
</script>

<template>
  <svg
    width="200"
    height="100"
    viewBox="0 0 1700 800"
    style="width: 100%; height: auto"
  >
    <g>
      <rect
        x="100"
        y="100"
        width="98"
        height="98"
        rx="5"
        ry="5"
        :fill="noteOffFill"
        stroke="lightslategray"
        stroke-width="1"
      />
      <rect
        x="125"
        y="140"
        width="50"
        height="20"
        fill="none"
        stroke="dimgray"
        stroke-width="1"
      />
    </g>

    <g>
      <rect
        x="1520"
        y="20"
        width="48"
        height="48"
        rx="3"
        ry="3"
        :fill="equaveDownFill"
        stroke="lightslategray"
        stroke-width="1"
      />
      <text x="1530" y="60" font-size="50">↓</text>
    </g>
    <g>
      <rect
        x="1570"
        y="20"
        width="48"
        height="48"
        rx="3"
        ry="3"
        :fill="equaveUpFill"
        stroke="lightslategray"
        stroke-width="1"
      />
      <text x="1580" y="60" font-size="50">↑</text>
    </g>
    <g>
      <rect
        x="1620"
        y="20"
        width="48"
        height="48"
        rx="3"
        ry="3"
        :fill="degreeDownFill"
        stroke="lightslategray"
        stroke-width="1"
      />
      <text x="1622" y="55" font-size="50">←</text>
    </g>
    <g>
      <rect
        x="1620"
        y="70"
        width="48"
        height="98"
        rx="3"
        ry="3"
        :fill="degreeUpFill"
        stroke="lightslategray"
        stroke-width="1"
      />
      <text x="1620" y="125" font-size="50">→</text>
    </g>

    <template v-for="row of rows">
      <rect
        v-for="key of row"
        :key="key.key"
        :class="key.class"
        :x="key.x"
        :y="key.y"
        :fill="key.color"
        :stroke="key.stroke"
        width="98"
        height="98"
        rx="5"
        ry="5"
        stroke-width="1"
      />
    </template>
    <rect
      x="100"
      y="400"
      width="128"
      height="98"
      rx="5"
      ry="5"
      :fill="shiftLeftFill"
      stroke="lightslategray"
      stroke-width="1"
    />
    <rect
      x="1330"
      y="400"
      width="250"
      height="98"
      rx="5"
      ry="5"
      :fill="shiftRightFill"
      stroke="lightslategray"
      stroke-width="1"
    />
  </svg>
</template>

<style scoped>
svg rect.white.active {
  fill: lightgreen !important;
}
svg rect.black.active {
  fill: green;
}
</style>
