<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import type { Keyboard, CoordinateKeyboardEvent } from 'isomorphic-qwerty'
import { CODES_LAYER_1, COORDS_BY_CODE } from 'isomorphic-qwerty'
import type { NoteOnCallback } from 'xen-midi';
import { usePlayNote } from './hooks/usePlayNote';

/** Unimplemented features:
 * Key highlights on touch/click
 * Global key off when clicking the button with that rectangle inside it
 * Sustain when multi-touching with the shift buttons
 */
type ColorMap = (index: number) => string

const props = defineProps<{
  baseIndex: number // Should incorporate shifts
  colorMap: ColorMap
  keyboardMode: 'isomorphic' | 'piano'
  colorScheme: 'light' | 'dark'
  qwertyMapping: Map<string, number>
  hasLeftOfZ: boolean
  isomorphicHorizontal: number
  isomorphicVertical: number
  noteOn: NoteOnCallback
  heldNotes: Map<number, number>
  typingKeyboard: Keyboard
  deactivationCode: string
  equaveUpCode: string
  equaveDownCode: string
  degreeUpCode: string
  degreeDownCode: string
  equaveShift: number
  degreeShift: number
}>()

defineEmits(['update:equaveShift', 'update:degreeShift'])

type VirtualKey = {
  key: string
  x: number
  y: number
  index?: number
  color: string
  stroke: string
  class: {
    black: boolean
    white: boolean
    active: boolean
  }
}

// Aesthetic state and properties (interacts with typing keyboard directly)

const activeKeys = reactive(new Set())

const disabledFill = computed(() => (props.colorScheme === 'light' ? 'whitesmoke' : 'gray'))

const rows = computed(() => {
  const horizontal = props.isomorphicHorizontal
  const vertical = props.isomorphicVertical
  const base = props.baseIndex
  const mapping = props.qwertyMapping

  const result: VirtualKey[][] = []

  const offsets = [200, 250, 280, 230]
  let j = 0
  for (const codeRow of CODES_LAYER_1) {
    const row = []
    let i = 0
    for (const code of codeRow) {
      if (code === null || code === 'Backquote') {
        continue
      }
      let index: number | undefined = base
      if (props.keyboardMode === 'isomorphic') {
        const [x, y] = COORDS_BY_CODE.get(code)!
        index += base + x * horizontal + (2 - y) * vertical
      } else {
        index = mapping.get(code)
      }
      let color = index === undefined ? disabledFill.value : props.colorMap(index)
      const black = color.toLowerCase() === 'black'
      let stroke = 'dimgray'
      if (index === undefined) {
        stroke = disabledFill.value
      }
      if (code === 'IntlBackslash' && !props.hasLeftOfZ) {
        stroke = 'red'
        color = disabledFill.value
      }
      row.push({
        key: code,
        x: offsets[j] + 100 * i,
        y: 100 + 100 * j,
        index,
        color,
        stroke,
        class: {
          black,
          white: !black && index !== undefined,
          active: activeKeys.has(code) && index !== undefined
        }
      })
      i++
    }
    result.push(row)
    j++
  }
  return result
})

const noteOffFill = ref('lightgray')
const equaveUpFill = ref('lightgray')
const equaveDownFill = ref('lightgray')
const degreeUpFill = ref('lightgray')
const degreeDownFill = ref('lightgray')
const shiftLeftFill = ref('lightgray')
const shiftRightFill = ref('lightgray')

function typingKeyDown(event: CoordinateKeyboardEvent) {
  activeKeys.add(event.code)
  return () => activeKeys.delete(event.code)
}

function windowKeyDown(event: KeyboardEvent) {
  const code = event.code
  if (code === props.deactivationCode) {
    noteOffFill.value = 'limegreen'
  }
  if (code === props.equaveUpCode) {
    equaveUpFill.value = 'limegreen'
  }
  if (code === props.equaveDownCode) {
    equaveDownFill.value = 'limegreen'
  }
  if (code === props.degreeUpCode) {
    degreeUpFill.value = 'limegreen'
  }
  if (code === props.degreeDownCode) {
    degreeDownFill.value = 'limegreen'
  }
  if (code === 'ShiftLeft') {
    shiftLeftFill.value = 'limegreen'
  }
  if (code === 'ShiftRight') {
    shiftRightFill.value = 'limegreen'
  }
}

function windowKeyUp(event: KeyboardEvent) {
  const code = event.code
  if (code === props.deactivationCode) {
    noteOffFill.value = 'lightgray'
  }
  if (code === props.equaveUpCode) {
    equaveUpFill.value = 'lightgray'
  }
  if (code === props.equaveDownCode) {
    equaveDownFill.value = 'lightgray'
  }
  if (code === props.degreeUpCode) {
    degreeUpFill.value = 'lightgray'
  }
  if (code === props.degreeDownCode) {
    degreeDownFill.value = 'lightgray'
  }
  if (code === 'ShiftLeft') {
    shiftLeftFill.value = 'lightgray'
  }
  if (code === 'ShiftRight') {
    shiftRightFill.value = 'lightgray'
  }
}
const playNote = usePlayNote(props.noteOn);

onMounted(() => {
  props.typingKeyboard.addKeydownListener(typingKeyDown)
})

onUnmounted(() => {
  props.typingKeyboard.removeEventListener(typingKeyDown)
  window.removeEventListener('keydown', windowKeyDown)
  window.removeEventListener('keyup', windowKeyUp)
  playNote.onUnmounted();
})
</script>

<template>
  <svg width="200" height="100" viewBox="0 0 1700 800" style="width: 100%; height: auto">
    <g class="click-not-implemented">
      <rect x="100" y="100" width="98" height="98" rx="5" ry="5" :fill="noteOffFill" stroke="lightslategray"
        stroke-width="1" />
      <rect x="125" y="140" width="50" height="20" fill="none" stroke="dimgray" stroke-width="1"
        pointer-events="none" />
    </g>

    <g @click="$emit('update:equaveShift', equaveShift - 1)">
      <rect x="1520" y="20" width="48" height="48" rx="3" ry="3" :fill="equaveDownFill" stroke="lightslategray"
        stroke-width="1" />
      <text x="1530" y="60" font-size="50" pointer-events="none">↓</text>
    </g>
    <g @click="$emit('update:equaveShift', equaveShift + 1)">
      <rect x="1570" y="20" width="48" height="48" rx="3" ry="3" :fill="equaveUpFill" stroke="lightslategray"
        stroke-width="1" />
      <text x="1580" y="60" font-size="50" pointer-events="none">↑</text>
    </g>
    <g @click="$emit('update:degreeShift', degreeShift - 1)">
      <rect x="1620" y="20" width="48" height="48" rx="3" ry="3" :fill="degreeDownFill" stroke="lightslategray"
        stroke-width="1" />
      <text x="1622" y="55" font-size="50" pointer-events="none">←</text>
    </g>
    <g @click="$emit('update:degreeShift', degreeShift + 1)">
      <rect x="1620" y="70" width="48" height="98" rx="3" ry="3" :fill="degreeUpFill" stroke="lightslategray"
        stroke-width="1" />
      <text x="1620" y="125" font-size="50" pointer-events="none">→</text>
    </g>

    <template v-for="row of rows">
      <rect v-for="key of row" :key="key.key" :class="key.class" :x="key.x" :y="key.y" :fill="key.color"
        :stroke="key.stroke" width="98" height="98" rx="5" ry="5" stroke-width="1"
        @touchstart="playNote.onTouchStart($event, key.index!)" @touchend="playNote.onTouchEnd($event, key.index!)"
        @touchcancel="playNote.onTouchEnd($event, key.index!)" @mousedown="playNote.onMouseDown($event, key.index!)"
        @mouseup="playNote.onMouseUp($event, key.index!)" @mouseenter="playNote.onMouseEnter($event, key.index!)"
        @mouseleave="playNote.onMouseLeave($event, key.index!)" />
    </template>
    <rect x="100" y="400" width="128" height="98" rx="5" ry="5" :fill="shiftLeftFill" stroke="lightslategray"
      stroke-width="1" class="click-not-implemented" />
    <rect x="1330" y="400" width="250" height="98" rx="5" ry="5" :fill="shiftRightFill" stroke="lightslategray"
      stroke-width="1" class="click-not-implemented" />
  </svg>
</template>

<style scoped>
svg {
  user-select: none;
}

svg rect.white.active {
  fill: lightgreen !important;
}

svg rect.black.active {
  fill: green;
}

.click-not-implemented {
  cursor: not-allowed;
}
</style>
