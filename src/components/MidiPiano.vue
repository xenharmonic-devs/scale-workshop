<script setup lang="ts">
import { WHITE_MODE_OFFSET } from '@/constants'
import { computeWhiteIndices } from '@/midi'
import { computed } from 'vue'
import { midiKeyInfo } from 'xen-midi'

const props = defineProps<{
  baseMidiNote: number
  midiWhiteMode: 'off' | 'simple' | 'blackAverage' | 'keyColors'
  keyColors: string[]
  activeKeys: Set<number>
}>()

// The svg container preserves aspect ratio so at least an octave around the base midi note is shown.
// View box is centered around 0,0 and has a logical width of 100 units (padding is added to contain strokes).

const KEY_SCALE = 10
const BLACK_WIDTH = 0.6 * KEY_SCALE

// Close enough.
const center = computed(() => {
  const info = midiKeyInfo(props.baseMidiNote)
  if (info.whiteNumber !== undefined) {
    return info.whiteNumber * KEY_SCALE
  }
  return (info.sharpOf! + 0.5) * KEY_SCALE
})

const whiteIndices = computed(() => computeWhiteIndices(props.baseMidiNote, props.keyColors))

function keyLabel(chromaticNumber: number) {
  const info = midiKeyInfo(chromaticNumber)
  if (props.midiWhiteMode === 'off') {
    return [(chromaticNumber - props.baseMidiNote).toString()]
  } else if (props.midiWhiteMode === 'simple') {
    if (info.whiteNumber !== undefined) {
      return [(info.whiteNumber + WHITE_MODE_OFFSET - props.baseMidiNote).toString()]
    }
  } else if (props.midiWhiteMode === 'blackAverage') {
    const offset = WHITE_MODE_OFFSET - props.baseMidiNote
    if (info.whiteNumber === undefined) {
      return [(info.flatOf + offset).toString(), '\u2295', (info.sharpOf + offset).toString()]
    } else {
      return [(info.whiteNumber + offset).toString()]
    }
  } else {
    const indices = whiteIndices.value
    if (indices.length) {
      if (info.whiteNumber === undefined) {
        // Use a black key if available
        const index = indices[info.sharpOf] + 1
        // Eliminate duplicates
        if (index === indices[info.sharpOf + 1]) {
          return []
        } else {
          return [(index - props.baseMidiNote).toString()]
        }
      } else {
        return [(indices[info.whiteNumber] - props.baseMidiNote).toString()]
      }
    }
  }
  return []
}

const whiteKeys = computed(() => {
  const result = []
  for (let i = 0; i < 128; ++i) {
    const info = midiKeyInfo(i)
    if (info.whiteNumber !== undefined) {
      const x = info.whiteNumber
      result.push({
        x: x * KEY_SCALE - center.value,
        label: keyLabel(i),
        index: i
      })
    }
  }
  return result
})

const blackKeys = computed(() => {
  const result = []
  for (let i = 0; i < 128; ++i) {
    const info = midiKeyInfo(i)
    const label = keyLabel(i)
    if (info.sharpOf !== undefined) {
      const x = info.sharpOf * KEY_SCALE + KEY_SCALE - 0.5 * BLACK_WIDTH - center.value
      const left = midiKeyInfo(i - 2)
      const right = midiKeyInfo(i + 2)
      if (left.whiteNumber !== undefined) {
        result.push({ x: x - 0.2 * BLACK_WIDTH, label, index: i })
      } else if (right.whiteNumber !== undefined) {
        result.push({ x: x + 0.2 * BLACK_WIDTH, label, index: i })
      } else {
        result.push({ x, label, index: i })
      }
    }
  }
  return result
})
</script>

<template>
  <svg width="100%" height="100%" viewBox="-51 -51 102 102">
    <g v-for="key of whiteKeys" :key="key.index">
      <rect
        :class="{ white: true, active: activeKeys.has(key.index) }"
        :x="key.x"
        y="-50"
        height="100"
        :width="KEY_SCALE"
        stroke="gray"
        stroke-width="0.1"
      />
      <text y="20" :font-size="0.5 * KEY_SCALE" text-anchor="middle" fill="black">
        <tspan
          v-for="(line, i) of key.label"
          :key="i"
          :x="key.x + KEY_SCALE * 0.5"
          :dy="0.5 * KEY_SCALE"
        >
          {{ line }}
        </tspan>
      </text>
    </g>
    <g v-for="key of blackKeys" :key="key.index">
      <rect
        :class="{ black: true, active: activeKeys.has(key.index) }"
        :x="key.x"
        y="-50"
        height="60"
        :width="BLACK_WIDTH"
        stroke="gray"
        stroke-width="0.1"
      />
      <text y="-5" :font-size="0.6 * BLACK_WIDTH" text-anchor="middle" fill="white">
        <tspan
          v-for="(line, i) of key.label"
          :key="i"
          :x="key.x + BLACK_WIDTH * 0.5"
          :dy="0.6 * BLACK_WIDTH"
        >
          {{ line }}
        </tspan>
      </text>
    </g>
  </svg>
</template>

<style scoped>
svg rect.white {
  fill: white;
}
svg rect.white.active {
  fill: green;
}

svg rect.black {
  fill: black;
}
svg rect.black.active {
  fill: darkgreen;
}
</style>
