<script setup lang="ts">
import { LEFT_MOUSE_BTN } from '@/constants'
import { computed, onMounted, onUnmounted, ref } from 'vue'

type NoteOff = () => void
type NoteOnCallback = (index: number) => NoteOff
type ColorMap = (index: number) => string

const props = defineProps<{
  baseIndex: number
  colorMap: ColorMap
  splitAccidentals: boolean
  accidentalColor: string
  lowAccidentalColor: string
  middleAccidentalColor: string
  highAccidentalColor: string
  noteOn: NoteOnCallback
  heldNotes: Map<number, number>
}>()

type VirtualKey = {
  x: number
  left: number
  right: number
  index: number
  color: string
}

type VirtualBlackKey = {
  x: number
  index: number
  color: string
}

type VirtualSplitKey = {
  x: number
  y: string
  height: string
  index: number
  color: string
}

const NUM_KEYS = 30

// Percentages of SVG height
const TOP_Y = 20
const SPLIT_BOTTOM_Y = 60

const noteOffs: Map<number, NoteOff> = new Map()

const whiteKeys = computed(() => {
  const low = props.lowAccidentalColor.toLowerCase()
  const middle = props.middleAccidentalColor.toLowerCase()
  const high = props.highAccidentalColor.toLowerCase()
  const black = props.accidentalColor.toLowerCase()

  const result: VirtualKey[] = []

  if (props.splitAccidentals) {
    const mainSeen = new Set<string>()
    let x = 0
    for (let i = 0; i < 3 * NUM_KEYS; ++i) {
      const index = props.baseIndex + i
      const color = props.colorMap(index)
      if (color === low || color === middle || color === high) {
        if (mainSeen.has(color)) {
          x++
          mainSeen.clear()
        }
        mainSeen.add(color)
      } else {
        const seen = new Set<string>()
        let j = 0
        let left = 0
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const acc = props.colorMap(index - 1 - j)
          if (acc !== low && acc !== middle && acc !== high) {
            break
          }
          if (seen.has(acc)) {
            left++
            seen.clear()
          }
          seen.add(acc)
          j++
        }
        if (seen.size) {
          left++
        }

        j = 0
        let right = 0
        seen.clear()
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const acc = props.colorMap(index + 1 + j)
          if (acc !== low && acc !== middle && acc !== high) {
            break
          }
          if (seen.has(acc)) {
            right++
            seen.clear()
          }
          seen.add(acc)
          j++
        }
        if (seen.size) {
          right++
        }

        if (mainSeen.size) {
          x++
        }
        mainSeen.clear()
        result.push({
          x,
          left,
          right,
          index,
          color
        })
        x++
      }
    }
  } else {
    for (let x = 0; x < NUM_KEYS; ++x) {
      const index = props.baseIndex + x
      const color = props.colorMap(index)
      if (color !== black) {
        let left = 0
        while (props.colorMap(index - 1 - left) === black) {
          left++
        }
        let right = 0
        while (props.colorMap(index + 1 + right) == black) {
          right++
        }
        result.push({
          x,
          left,
          right,
          index,
          color
        })
      }
    }
  }
  return result
})

const blackKeys = computed(() => {
  const black = props.accidentalColor.toLowerCase()
  const result: VirtualBlackKey[] = []
  for (let x = 0; x < NUM_KEYS; ++x) {
    const index = props.baseIndex + x
    const color = props.colorMap(index)
    if (color === black) {
      result.push({
        x,
        index,
        color
      })
    }
  }
  return result
})

const splitKeys = computed(() => {
  const low = props.lowAccidentalColor.toLowerCase()
  const middle = props.middleAccidentalColor.toLowerCase()
  const high = props.highAccidentalColor.toLowerCase()
  const result: VirtualSplitKey[] = []
  let lowKey: VirtualSplitKey | undefined
  let middleKey: VirtualSplitKey | undefined
  let highKey: VirtualSplitKey | undefined
  let x = 0

  function pushKeys() {
    let y = TOP_Y
    if (lowKey || middleKey || highKey) {
      x++
    }
    if (highKey) {
      let height = SPLIT_BOTTOM_Y - y
      if (middleKey && lowKey) {
        height /= 3
      } else if (middleKey || lowKey) {
        height /= 2
      } else {
        height *= 0.8
      }
      highKey.height = `${height}%`
      result.push(highKey)
      highKey = undefined
      y += height
    }
    if (middleKey) {
      let height = SPLIT_BOTTOM_Y - y
      if (lowKey) {
        height /= 2
      }
      middleKey.y = `${y}%`
      middleKey.height = `${height}%`
      result.push(middleKey)
      middleKey = undefined
      y += height
    }
    if (lowKey) {
      const height = SPLIT_BOTTOM_Y - y
      lowKey.y = `${y}%`
      lowKey.height = `${height}%`
      result.push(lowKey)
      lowKey = undefined
    }
  }

  for (let i = 0; i < 3 * NUM_KEYS; ++i) {
    const index = props.baseIndex + i
    const color = props.colorMap(index)
    if (color === low) {
      if (lowKey) {
        pushKeys()
      }
      lowKey = {
        x,
        index,
        color,
        y: '',
        height: ''
      }
    } else if (color === middle) {
      if (middleKey) {
        pushKeys()
      }
      middleKey = { x, index, color, y: '', height: '' }
    } else if (color === high) {
      if (highKey) {
        pushKeys()
      }
      highKey = { x, index, color, y: `${TOP_Y}%`, height: '' }
    } else {
      x++
      pushKeys()
    }
  }
  pushKeys()
  return result
})

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
  window.addEventListener('mouseup', windowMouseUp)
})

onUnmounted(() => {
  noteOffs.forEach((off) => {
    if (off !== null) {
      off()
    }
  })
  window.removeEventListener('mouseup', windowMouseUp)
})
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
    <template v-if="splitAccidentals">
      <rect
        v-for="(key, i) of splitKeys"
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
        :y="key.y"
        :height="key.height"
        :style="'fill:' + key.color + ';'"
        width="4%"
      />
    </template>
    <template v-else>
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
        :style="'fill:' + key.color + ';'"
      />
    </template>
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
  fill: green !important;
}
</style>
