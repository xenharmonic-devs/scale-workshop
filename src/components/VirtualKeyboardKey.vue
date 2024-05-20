<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import Values from 'values.js'
import type { NoteOnCallback } from 'xen-midi';
import { usePlayNote } from './hooks/usePlayNote';

const props = defineProps<{
  index: number
  color: string
  isMousePressed: boolean
  noteOn: NoteOnCallback
}>()

const active = ref(false)
const light = computed(() => new Values(props.color).getBrightness() > 50)
const playNote = usePlayNote(props.noteOn);

onUnmounted(() => {
  playNote.onUnmounted()
})
</script>

<template>
  <td
    :data-key-number="index"
    :style="'background-color:' + color"
    :class="{ active, light, dark: !light }"
    @touchstart="playNote.onTouchStart"
    @touchend="playNote.onTouchEnd"
    @touchcancel="playNote.onTouchEnd"
    @mousedown="playNote.onMouseDown"
    @mouseup="playNote.onMouseUp"
    @mouseenter="playNote.onMouseEnter"
    @mouseleave="playNote.onMouseLeave"
  >
    <slot></slot>
  </td>
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
