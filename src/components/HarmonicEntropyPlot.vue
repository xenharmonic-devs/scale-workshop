<script setup lang="ts">
import { useHarmonicEntropyStore } from '@/stores/harmonic-entropy'
import { computed, ref } from 'vue'

const props = defineProps<{
  labels: string[]
  colors: string[]
  centss: number[]
}>()

const entropy = useHarmonicEntropyStore()

const boxWidth = 10
const boxHeight = 1

const svg = ref<SVGSVGElement | null>(null)
const circleCents = ref(0)
const circlePercentage = ref(0)
const circleX = ref(0)
const circleY = ref(0)
const showCircle = ref(false)
const lineIndex = ref(-1)

const xScale = computed(() => boxWidth / entropy.options.maxCents!)

const lineCents = computed(() => {
  if (lineIndex.value < 0) {
    return 0
  }
  return props.centss[lineIndex.value]
})

// Need to format here because prettier is overaggressive with newlines
const linePercentage = computed(() => {
  if (lineIndex.value < 0) {
    return 0
  }
  const percentage = entropy.entropyPercentage(props.centss[lineIndex.value]) * 100
  return `Entropy: ${percentage.toFixed(2)} %`
})

const circleEntropy = computed(() => `Entropy: ${(100 * circlePercentage.value).toFixed(2)} %`)

function entropyToViewY(y: number) {
  return (entropy.maxY - y) / (entropy.maxY - entropy.minY)
}

const points = computed(() => {
  if (!entropy.table.length) {
    return `0,0.5 ${boxWidth},0.5`
  }
  return entropy.table.map(([x, y]) => `${xScale.value * x},${entropyToViewY(y)}`).join(' ')
})

const lines = computed(() =>
  props.centss.map((cents) => {
    const x = xScale.value * cents
    const y = 1 - entropy.entropyPercentage(cents)
    return { x1: x, y1: 1, x2: x, y2: y }
  })
)

const ticks = computed(() => {
  const result: [number, string][] = []

  for (let cents = 0; cents <= entropy.options.maxCents!; cents += 200) {
    result.push([cents * xScale.value, cents.toString()])
  }
  return result
})

let pt: DOMPoint | null = null

function coords(x: number, y: number) {
  if (svg.value === null) {
    return { x: 0, y: 0 }
  }
  if (pt === null) {
    pt = svg.value.createSVGPoint()
  }
  pt.x = x
  pt.y = y
  const ctm = svg.value.getScreenCTM()
  if (!ctm) {
    throw new Error('Unable to calculate coordinates')
  }
  return pt.matrixTransform(ctm.inverse())
}

function plotMouseMove(event: MouseEvent) {
  const { x } = coords(event.x, event.y)
  circleCents.value = x / xScale.value
  circlePercentage.value = entropy.entropyPercentage(circleCents.value)
  circleX.value = x
  circleY.value = 1 - circlePercentage.value
  showCircle.value = true
}

function lineMouseMove(event: MouseEvent) {
  const { x } = coords(event.x, event.y)
  const cents = x / xScale.value
  let minDistance = Infinity
  for (let i = 0; i < props.centss.length; ++i) {
    const distance = Math.abs(cents - props.centss[i])
    if (distance < minDistance) {
      lineIndex.value = i
      minDistance = distance
    }
  }
}
</script>

<template>
  <svg
    ref="svg"
    :width="`${boxWidth * 35}em`"
    :height="`${boxHeight * 35}em`"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 -0.04 ${boxWidth} ${boxHeight}`"
    preserveAspectRatio="xMinYMin meet"
  >
    <defs>
      <polyline :points="points" fill="none" id="plot" />
      <text :y="Math.min(0.8, circleY)" id="circle-text" font-size="0.05">
        <tspan :x="circleX + 0.02">Dyad: {{ circleCents.toFixed(1) }} ¢</tspan>
        <tspan :x="circleX + 0.02" dy="1em">{{ circleEntropy }}</tspan>
      </text>
    </defs>
    <use href="#plot" class="plot" />
    <use
      href="#plot"
      @mousemove="plotMouseMove"
      @mouseleave="showCircle = false"
      stroke="rgba(0 0 0 / 0%)"
      stroke-width="0.25"
    />
    <g v-for="(l, i) of lines" :key="i" @mousemove="lineMouseMove" @mouseleave="lineIndex = -1">
      <line v-bind="l" class="interval-line" />
      <circle :cx="l.x2" :cy="l.y2" r="0.008" :fill="colors[i]" class="interval-circle" />
      <line v-bind="l" stroke="rgba(0 0 0 / 0%)" stroke-width="0.1" />
    </g>
    <text
      v-if="lineIndex >= 0"
      class="interval-text"
      font-size="0.06"
      :y="Math.min(0.75, 0.5 * (lines[lineIndex].y1 + lines[lineIndex].y2))"
    >
      <tspan :x="lines[lineIndex].x1 + 0.01">Label: {{ labels[lineIndex] }}</tspan>
      <tspan :x="lines[lineIndex].x1 + 0.01" dy="1em">Dyad: {{ lineCents.toFixed(1) }} ¢</tspan>
      <tspan :x="lines[lineIndex].x1 + 0.01" dy="1em">{{ linePercentage }}</tspan>
    </text>
    <g v-if="showCircle" class="plot-circle">
      <circle :cx="circleX" :cy="circleY" r="0.01" />
      <use href="#circle-text" class="circle-text-border" />
      <use href="#circle-text" class="circle-text" />
    </g>
    <g class="ticks">
      <rect x="0" y="0.9" :width="boxWidth" height="0.2" />
      <g v-for="([x, label], i) of ticks" :key="i">
        <line :x1="x" y1="0.9" :x2="x" y2="0.906" />
        <text :x="x" y="0.909" font-size="0.04">{{ label }}</text>
      </g>
    </g>
  </svg>
</template>
<style scoped>
.plot {
  stroke: var(--color-accent-text-btn);
  stroke-width: 0.003;
}
.plot-circle {
  pointer-events: none;
}
.plot-circle > circle {
  fill: none;
  stroke: var(--color-bright-indicator);
  stroke-width: 0.006;
}
.circle-text-border {
  fill: var(--color-background);
  stroke: var(--color-background);
  stroke-width: 0.015;
}
.circle-text {
  fill: var(--color-text);
}

.interval-line {
  stroke: var(--color-dark-indicator);
  stroke-width: 0.004;
}
.interval-circle {
  stroke: var(--color-dark-indicator);
  stroke-width: 0.002;
}
.interval-text {
  fill: var(--color-text);
  pointer-events: none;
}

.ticks > rect {
  fill: #ddd;
}
.ticks > g > line {
  stroke: #111;
  stroke-width: 0.004;
}
.ticks > g > text {
  fill: #333;
  text-anchor: middle;
  dominant-baseline: hanging;
}
</style>
