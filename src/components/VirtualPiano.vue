<script setup lang="ts">
import { LEFT_MOUSE_BTN } from "@/constants";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { mmod } from "xen-dev-utils";

type NoteOff = () => void;
type NoteOnCallback = (index: number) => NoteOff;

const props = defineProps<{
  baseMidiNote: number;
  baseIndex: number; // Should incorporate equave shift
  keyColors: string[];
  noteOn: NoteOnCallback;
  heldNotes: Map<number, number>;
}>();

type VirtualKey = {
  x: number;
  left: number;
  right: number;
  index: number;
  color: string;
};

type VirtualBlackKey = {
  x: number;
  index: number;
};

const NUM_KEYS = 30;

const noteOffs: Map<number, NoteOff> = new Map();

const whiteKeys = computed(() => {
  const colors = props.keyColors.length ? props.keyColors : ["white"];
  const result: VirtualKey[] = [];
  for (let x = 0; x < NUM_KEYS; ++x) {
    const index = props.baseIndex + x;
    const colorIndex = index - props.baseMidiNote;
    const color = colors[mmod(colorIndex, colors.length)];
    if (color.toLowerCase() !== "black") {
      let left = 0;
      while (
        colors[mmod(colorIndex - 1 - left, colors.length)].toLowerCase() ===
        "black"
      ) {
        left++;
      }
      let right = 0;
      while (
        colors[mmod(colorIndex + 1 + right, colors.length)].toLowerCase() ===
        "black"
      ) {
        right++;
      }
      result.push({
        x,
        left,
        right,
        index,
        color,
      });
    }
  }
  return result;
});

const blackKeys = computed(() => {
  const colors = props.keyColors.length ? props.keyColors : ["white"];
  const result: VirtualBlackKey[] = [];
  for (let x = 0; x < NUM_KEYS; ++x) {
    const index = props.baseIndex + x;
    const colorIndex = index - props.baseMidiNote;
    const color = colors[mmod(colorIndex, colors.length)];
    if (color.toLowerCase() === "black") {
      result.push({
        x,
        index,
      });
    }
  }
  return result;
});

const isMousePressed = ref(false);

function start(index: number) {
  noteOffs.set(index, props.noteOn(index));
}

function end(index: number) {
  if (noteOffs.has(index)) {
    noteOffs.get(index)!();
    noteOffs.delete(index);
  }
}

function onTouchEnd(event: TouchEvent, index: number) {
  event.preventDefault();
  end(index);
}

function onTouchStart(event: TouchEvent, index: number) {
  event.preventDefault();
  // Make sure that we start a new note.
  end(index);

  start(index);
}

function onMouseDown(event: MouseEvent, index: number) {
  if (event.button !== LEFT_MOUSE_BTN) {
    return;
  }
  event.preventDefault();
  isMousePressed.value = true;
  start(index);
}

function onMouseUp(event: MouseEvent, index: number) {
  if (event.button !== LEFT_MOUSE_BTN) {
    return;
  }
  event.preventDefault();
  isMousePressed.value = false;
  end(index);
}

function onMouseEnter(event: MouseEvent, index: number) {
  if (!isMousePressed.value) {
    return;
  }
  event.preventDefault();
  start(index);
}

function onMouseLeave(event: MouseEvent, index: number) {
  if (!isMousePressed.value) {
    return;
  }
  event.preventDefault();
  end(index);
}

function windowMouseUp(event: MouseEvent) {
  if (event.button === LEFT_MOUSE_BTN) {
    isMousePressed.value = false;
  }
}

onMounted(() => {
  window.addEventListener("mouseup", windowMouseUp);
});

onUnmounted(() => {
  noteOffs.forEach((off) => {
    if (off !== null) {
      off();
    }
  });
  window.removeEventListener("mouseup", windowMouseUp);
});
</script>

<template>
  <svg width="100%" height="100%">
    <rect
      v-for="(key, i) of whiteKeys"
      :key="i"
      @touchstart="onTouchStart($event, key.index)"
      @touchend="onTouchEnd($event, key.index)"
      @touchcancel="onTouchEnd($event, key.index)"
      @mousedown="onMouseDown($event, key.index)"
      @mouseup="onMouseUp($event, key.index)"
      @mouseenter="onMouseEnter($event, key.index)"
      @mouseleave="onMouseLeave($event, key.index)"
      :class="{ white: true, active: (heldNotes.get(key.index) || 0) > 0 }"
      :x="4 * key.x - 2 * key.left + '%'"
      y="20%"
      :width="4 + 2 * (key.right + key.left) + '%'"
      height="55%"
      :style="'fill:' + key.color + ';'"
    />
    <rect
      v-for="(key, i) of blackKeys"
      :key="i"
      @touchstart="onTouchStart($event, key.index)"
      @touchend="onTouchEnd($event, key.index)"
      @touchcancel="onTouchEnd($event, key.index)"
      @mousedown="onMouseDown($event, key.index)"
      @mouseup="onMouseUp($event, key.index)"
      @mouseenter="onMouseEnter($event, key.index)"
      @mouseleave="onMouseLeave($event, key.index)"
      :class="{ black: true, active: (heldNotes.get(key.index) || 0) > 0 }"
      :x="4 * key.x + '%'"
      y="20%"
      width="4%"
      height="30%"
    />
  </svg>
</template>

<style scoped>
svg {
  user-select: none;
}
svg rect.white {
  stroke: gray;
  stroke-width: 2;
}
svg rect.white.active {
  fill: lightgreen !important;
}
svg rect.black {
  fill: black;
  stroke: gray;
  stroke-width: 2;
  stroke-opacity: 0.5;
}
svg rect.black.active {
  fill: green;
}
</style>
