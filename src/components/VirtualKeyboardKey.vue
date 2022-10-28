<script setup lang="ts">
import { LEFT_MOUSE_BTN } from "@/constants";
import { onUnmounted, ref } from "vue";

type NoteOff = () => void;
type NoteOnCallback = () => NoteOff;

const props = defineProps<{
  color: string;
  isMousePressed: boolean;
  noteOn: NoteOnCallback;
}>();

const active = ref(false);

const emit = defineEmits(["press", "unpress"]);

let noteOff: NoteOff | null = null;

onUnmounted(() => {
  if (noteOff !== null) {
    noteOff();
  }
});

function start() {
  active.value = true;
  noteOff = props.noteOn();
}

function end() {
  active.value = false;
  if (noteOff !== null) {
    noteOff();
    noteOff = null;
  }
}

function onTouchStart(event: TouchEvent) {
  event.preventDefault();
  start();
}

function onTouchEnd(event: TouchEvent) {
  event.preventDefault();
  end();
}

function onMouseDown(event: MouseEvent) {
  if (event.button !== LEFT_MOUSE_BTN) {
    return;
  }
  event.preventDefault();
  emit("press");
  start();
}

function onMouseUp(event: MouseEvent) {
  if (event.button !== LEFT_MOUSE_BTN) {
    return;
  }
  event.preventDefault();
  emit("unpress");
  end();
}

function onMouseEnter(event: MouseEvent) {
  if (!props.isMousePressed) {
    return;
  }
  event.preventDefault();
  start();
}

function onMouseLeave(event: MouseEvent) {
  if (!props.isMousePressed) {
    return;
  }
  event.preventDefault();
  end();
}
</script>

<template>
  <td
    :style="'background-color:' + color"
    :class="{ active }"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  ></td>
</template>

<style scoped>
td {
  text-align: center;
  vertical-align: middle;
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.6em;
  user-select: none;
  cursor: pointer;
}
td p {
  pointer-events: none;
  word-break: break-word;
  line-height: 1.1em;
  color: #888;
}

td:hover {
  background: linear-gradient(
    0deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 0, 0, 0.5) 50%,
    rgba(255, 255, 255, 0) 100%
  );
}
td.held {
  background: linear-gradient(
    0deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(200, 230, 0, 0.5) 50%,
    rgba(0, 0, 0, 0) 100%
  );
}
td.active {
  background: linear-gradient(
    0deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 255, 0, 0.5) 50%,
    rgba(0, 0, 0, 0) 100%
  );
}
</style>
