<script setup lang="ts">
import { mosScaleInfo } from 'moment-of-symmetry'
import { computed } from 'vue'
import { dot } from 'xen-dev-utils'

const props = defineProps<{
  selected: string
  rows: number
  vertical: number
  horizontal: number
  hardness: { n: number; d: number }
}>()

const emit = defineEmits(['easter-egg', 'mos'])

const viewBox = computed(
  () => `${props.horizontal - props.rows / 2} ${props.vertical - 0.5} ${props.rows} ${props.rows}`
)

type BasicInfo = {
  x: number
  y: number
  name: string
  abbreviation: string
  pattern: string
  udp: string
  equaveMonzo: [number, number]
  brightGeneratorMonzo: [number, number]
}

const basics = computed(() => {
  const v = props.vertical
  const rows: BasicInfo[][] = []
  // Do two extra rows at both ends to compensate for potentially non-square container.
  for (let size = Math.max(2, v); size < props.rows + v + 4; ++size) {
    const row: BasicInfo[] = []
    // Do six extra columns at both ends.
    const low = Math.max(1, Math.floor(props.horizontal - props.rows / 2 + size / 2 - 6))
    const high = Math.min(size, Math.ceil(props.horizontal + props.rows / 2 + size / 2 + 6))
    for (let numL = low; numL < high; ++numL) {
      const numS = size - numL
      const info = mosScaleInfo(numL, numS)
      const p = info.numberOfPeriods
      // Brightest for woods
      let udp = `${size - p}|0(${p})`
      if (size > 2 * p) {
        // Major-like for everything else
        udp = `${size - p * 2}|${p}`
        if (p > 1) {
          udp += `(${p})`
        }
      }
      row.push({
        x: numL - size / 2,
        y: size - 2,
        name: info.name ?? info.mosPattern,
        abbreviation: info.abbreviation ?? info.mosPattern,
        pattern: info.mosPattern,
        udp,
        equaveMonzo: [numL, numS],
        brightGeneratorMonzo: info.brightGeneratorMonzo
      })
    }
    rows.push(row)
  }
  return rows
})

const generators = computed(() => {
  const { n, d } = props.hardness
  return basics.value.map((row) =>
    row.map((i) => `${dot(i.brightGeneratorMonzo, [n, d])}\\${dot(i.equaveMonzo, [n, d])}`)
  )
})
</script>

<template>
  <svg width="100%" height="100%" :viewBox="viewBox">
    <image
      href="@/assets/img/spoob.png"
      x="-1"
      y="-5"
      width="2"
      height="2"
      @click="emit('easter-egg')"
    />

    <template v-for="(row, i) of basics" :key="i">
      <g
        v-for="(info, j) of row"
        :key="j"
        @click="emit('mos', info.name, info.pattern, info.udp)"
        :class="{ selected: selected === info.pattern }"
      >
        <rect :x="info.x - 0.45" :y="info.y - 0.45" width="0.9" height="0.9" />
        <text :x="info.x - 0.4" :y="info.y - 0.3" font-size="0.11" text-anchor="start">
          {{ info.pattern }}
        </text>
        <text :x="info.x + 0.4" :y="info.y - 0.3" font-size="0.11" text-anchor="end">
          {{ generators[i][j] }}
        </text>
        <text :x="info.x" :y="info.y" font-size="0.25" text-anchor="middle">
          {{ info.abbreviation }}
        </text>
        <text :x="info.x" :y="info.y + 0.3" font-size="0.09" text-anchor="middle">
          {{ info.name }}
        </text>
      </g>
    </template>
  </svg>
</template>

<style scoped>
image {
  cursor: pointer;
}
g {
  cursor: pointer;
}
rect {
  fill: var(--color-accent-background);
  stroke: var(--color-accent-text-btn);
  stroke-width: 0.01;
}
g:hover > rect {
  fill: var(--color-accent);
  stroke: var(--color-accent);
}
.selected > rect {
  fill: var(--color-background-mute);
  stroke-width: 0.02;
}
text {
  dominant-baseline: central;
  fill: var(--color-accent-text-btn);
}
g:hover > text {
  fill: white;
}
</style>
