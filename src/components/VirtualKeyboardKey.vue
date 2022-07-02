<script setup lang="ts">
import { onUnmounted } from "vue";

type NoteOff = () => void;
type NoteOnCallback = () => NoteOff;

const props = defineProps<{
  color: string;
  isMousePressed: boolean;
  noteOn: NoteOnCallback;
}>();

const emit = defineEmits(["press", "unpress"]);

let noteOff: NoteOff | null = null;

onUnmounted(() => {
  if (noteOff !== null) {
    noteOff();
  }
});

function onTouchStart(event: Event) {
  const target = event.target as HTMLTableCellElement;
  target.classList.add("active");
  noteOff = props.noteOn();
}

function onTouchEnd(event: Event) {
  const target = event.target as HTMLTableCellElement;
  target.classList.remove("active");
  if (noteOff !== null) {
    noteOff();
    noteOff = null;
  }
}

const LEFT_MOUSE_BTN = 0;

function onMouseDown(event: MouseEvent) {
  if (event.button !== LEFT_MOUSE_BTN) {
    return;
  }
  emit("press");
  onTouchStart(event as Event);
}

function onMouseUp(event: MouseEvent) {
  if (event.button !== LEFT_MOUSE_BTN) {
    return;
  }
  emit("unpress");
  onTouchEnd(event as Event);
}

function onMouseEnter(event: MouseEvent) {
  if (!props.isMousePressed) {
    return;
  }
  onTouchStart(event as Event);
}

function onMouseLeave(event: MouseEvent) {
  if (!props.isMousePressed) {
    return;
  }
  onTouchEnd(event as Event);
}
</script>

<template>
  <td
    :style="'background-color:' + color"
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
  border: 1px solid grey;
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
td.active {
  background: linear-gradient(
    0deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 255, 0, 0.5) 50%,
    rgba(0, 0, 0, 0) 100%
  );
}
</style>
