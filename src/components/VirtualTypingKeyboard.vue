<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { mmod } from 'xen-dev-utils'
import type { Keyboard, CoordinateKeyboardEvent } from 'isomorphic-qwerty'
import { CODES_LAYER_1, COORDS_BY_CODE } from 'isomorphic-qwerty'
import { LEFT_MOUSE_BTN } from '@/constants'

/** Unimplemented features:
 * Key highlights on touch/click
 * Global key off when clicking the button with that rectangle inside it
 * Sustain when multi-touching with the shift buttons
 */

type NoteOff = () => void
type NoteOnCallback = (index: number) => NoteOff

const props = defineProps<{
  baseIndex: number // Should incorporate equave shift
  baseMidiNote: number
  keyColors: string[]
  keyboardMode: 'isomorphic' | 'piano'
  colorScheme: 'light' | 'dark'
  keyboardMapping: Map<string, number>
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
  const colors = props.keyColors.length ? props.keyColors : ['white']
  const horizontal = props.isomorphicHorizontal
  const vertical = props.isomorphicVertical
  const base = props.baseIndex
  const midi = props.baseMidiNote
  const mapping = props.keyboardMapping

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
      let index
      if (props.keyboardMode === 'isomorphic') {
        const [x, y] = COORDS_BY_CODE.get(code)!
        index = base + x * horizontal + (2 - y) * vertical
      } else {
        index = mapping!.get(code)
      }
      const color =
        index === undefined ? disabledFill.value : colors[mmod(index - midi, colors.length)]
      const black = color.toLowerCase() === 'black'
      row.push({
        key: code,
        x: offsets[j] + 100 * i,
        y: 100 + 100 * j,
        index,
        color: color,
        stroke: index === undefined ? disabledFill.value : 'dimgray',
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

// Synth interactive state and properties

const noteOffs: Map<number, NoteOff> = new Map()

const isMousePressed = ref(false)

function start(index: number) {
  noteOffs.set(index, props.noteOn(index))
}

function end(index: number) {
  if (noteOffs.has(index)) {
    noteOffs.get(index)!()
    noteOffs.delete(index)
  }
}

function onTouchEnd(event: TouchEvent, index: number) {
  event.preventDefault()
  end(index)
}

function onTouchStart(event: TouchEvent, index: number) {
  event.preventDefault()
  // Make sure that we start a new note.
  end(index)

  start(index)
}

function onMouseDown(event: MouseEvent, index: number) {
  if (event.button !== LEFT_MOUSE_BTN) {
    return
  }
  event.preventDefault()
  isMousePressed.value = true
  start(index)
}

function onMouseUp(event: MouseEvent, index: number) {
  if (event.button !== LEFT_MOUSE_BTN) {
    return
  }
  event.preventDefault()
  isMousePressed.value = false
  end(index)
}

function onMouseEnter(event: MouseEvent, index: number) {
  if (!isMousePressed.value) {
    return
  }
  event.preventDefault()
  start(index)
}

function onMouseLeave(event: MouseEvent, index: number) {
  if (!isMousePressed.value) {
    return
  }
  event.preventDefault()
  end(index)
}

function windowMouseUp(event: MouseEvent) {
  if (event.button === LEFT_MOUSE_BTN) {
    isMousePressed.value = false
  }
}

onMounted(() => {
  props.typingKeyboard.addKeydownListener(typingKeyDown)
  window.addEventListener('keydown', windowKeyDown)
  window.addEventListener('keyup', windowKeyUp)
  window.addEventListener('mouseup', windowMouseUp)
})

onUnmounted(() => {
  props.typingKeyboard.removeEventListener(typingKeyDown)
  window.removeEventListener('keydown', windowKeyDown)
  window.removeEventListener('keyup', windowKeyUp)
  noteOffs.forEach((off) => {
    if (off !== null) {
      off()
    }
  })
  window.removeEventListener('mouseup', windowMouseUp)
})
</script>

<template>
  <svg width="200" height="100" viewBox="0 0 1700 800" style="width: 100%; height: auto">
    <g class="click-not-implemented">
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
        pointer-events="none"
      />
    </g>

    <g @click="$emit('update:equaveShift', equaveShift - 1)">
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
      <text x="1530" y="60" font-size="50" pointer-events="none">↓</text>
    </g>
    <g @click="$emit('update:equaveShift', equaveShift + 1)">
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
      <text x="1580" y="60" font-size="50" pointer-events="none">↑</text>
    </g>
    <g @click="$emit('update:degreeShift', degreeShift - 1)">
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
      <text x="1622" y="55" font-size="50" pointer-events="none">←</text>
    </g>
    <g @click="$emit('update:degreeShift', degreeShift + 1)">
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
      <text x="1620" y="125" font-size="50" pointer-events="none">→</text>
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
        @touchstart="onTouchStart($event, key.index!)"
        @touchend="onTouchEnd($event, key.index!)"
        @touchcancel="onTouchEnd($event, key.index!)"
        @mousedown="onMouseDown($event, key.index!)"
        @mouseup="onMouseUp($event, key.index!)"
        @mouseenter="onMouseEnter($event, key.index!)"
        @mouseleave="onMouseLeave($event, key.index!)"
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
      class="click-not-implemented"
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
      class="click-not-implemented"
    />
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
