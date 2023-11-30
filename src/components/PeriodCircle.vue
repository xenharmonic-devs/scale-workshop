<script setup lang="ts">
import { LEFT_MOUSE_BTN } from '@/constants'
import type { Scale } from 'scale-workshop-core'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const CIRCLE_RADIUS = 40
const SCALE_TICK_HEIGHT = 4
const GENERATOR_TICK_HEIGHT = 5

const props = defineProps<{
  scale: Scale | null
  generatorCents: number | null
  periodCents: number | null
  size: number
  up: number
}>()

const emit = defineEmits(['update:generatorCents'])

const periodCents = computed(() => {
  if (props.periodCents !== null) {
    return props.periodCents
  }
  if (props.scale !== null) {
    return props.scale.equave.totalCents()
  }
  return 1200
})

const scaleTickDirections = computed(() => {
  if (props.scale === null) {
    return []
  }
  const result = []
  for (let i = 1; i < props.scale.size + 1; ++i) {
    result.push(props.scale.getMonzo(i).totalCents())
  }
  const angleScale = (2 * Math.PI) / periodCents.value
  return result
    .map((cents) => cents * angleScale)
    .map((theta) => [Math.sin(theta), Math.cos(theta)])
})

const scaleTickCoords = computed(() => {
  const result = []
  for (const [sin, cos] of scaleTickDirections.value) {
    const inner = CIRCLE_RADIUS - 0.5 * SCALE_TICK_HEIGHT
    const outer = CIRCLE_RADIUS + 0.5 * SCALE_TICK_HEIGHT
    result.push({
      x1: `${50 + inner * sin}%`,
      y1: `${50 - inner * cos}%`,
      x2: `${50 + outer * sin}%`,
      y2: `${50 - outer * cos}%`
    })
  }
  return result
})

const scaleLabels = computed(() => {
  const result = []
  let i = 1
  for (const [sin, cos] of scaleTickDirections.value) {
    const name = props.scale!.getName(i++)
    const radius = CIRCLE_RADIUS - 2 * SCALE_TICK_HEIGHT
    result.push({
      x: `${50 + radius * sin}`,
      y: `${50 - radius * cos}`,
      name
    })
  }
  return result
})

const generatorTickDirections = computed(() => {
  if (props.generatorCents === null) {
    return []
  }
  const result = [...Array(props.size).keys()].map(
    (i) => (i + props.up + 1 - props.size) * props.generatorCents!
  )
  const angleScale = (2 * Math.PI) / periodCents.value
  return result
    .map((cents) => cents * angleScale)
    .map((theta) => [Math.sin(theta), Math.cos(theta)])
})

const generatorTrajectory = computed(() => {
  const directions = generatorTickDirections.value
  const result = []
  for (let i = 0; i < directions.length - 1; ++i) {
    result.push({
      x1: `${50 + directions[i][0] * CIRCLE_RADIUS}%`,
      y1: `${50 - directions[i][1] * CIRCLE_RADIUS}%`,
      x2: `${50 + directions[i + 1][0] * CIRCLE_RADIUS}%`,
      y2: `${50 - directions[i + 1][1] * CIRCLE_RADIUS}%`
    })
  }
  return result
})

const generatorTickCoords = computed(() => {
  const result = []
  for (const [sin, cos] of generatorTickDirections.value) {
    const inner = CIRCLE_RADIUS - 0.5 * GENERATOR_TICK_HEIGHT
    const outer = CIRCLE_RADIUS + 0.5 * GENERATOR_TICK_HEIGHT
    result.push({
      x1: `${50 + inner * sin}%`,
      y1: `${50 - inner * cos}%`,
      x2: `${50 + outer * sin}%`,
      y2: `${50 - outer * cos}%`
    })
  }
  return result
})

const generatorLabels = computed(() => {
  const result = []
  let i = props.up + 1 - props.size
  for (const [sin, cos] of generatorTickDirections.value) {
    let name: string
    if (i === 0) {
      name = '0'
    } else if (i === 1) {
      name = 'g'
    } else if (i === -1) {
      name = '-g'
    } else {
      name = `${i}g`
    }
    const radius = CIRCLE_RADIUS + GENERATOR_TICK_HEIGHT
    result.push({
      x: `${50 + radius * sin}`,
      y: `${50 - radius * cos}`,
      name
    })
    i++
  }
  return result
})

const container = ref<SVGElement | null>(null)

const isMousePressed = ref(false)

function onMouseDown(event: MouseEvent) {
  if (event.button !== LEFT_MOUSE_BTN) {
    return
  }
  isMousePressed.value = true
  onMouseMove(event)
}

function onMouseMove(event: MouseEvent) {
  if (!isMousePressed.value) {
    return
  }
  const x = event.offsetX - container.value!.clientWidth * 0.5
  const y = event.offsetY - container.value!.clientHeight * 0.5

  const clockwise = 1 - (Math.PI + Math.atan2(x, y)) / (2 * Math.PI)
  emit('update:generatorCents', clockwise * periodCents.value)
}

function onWindowMouseUp(event: MouseEvent) {
  if (event.button !== LEFT_MOUSE_BTN) {
    return
  }
  isMousePressed.value = false
}

// Notes on touch handling:
// * Touch start must not preventDefault to allow scrolling with two fingers.
// * Touch move must preventDefault to prevent scrolling with one finger.
// * The behaviour is a bit sporadic when two-finger scrolling is released and only one finger remains on the svg element.

function handleTouch(touch: Touch) {
  const svg = container.value!
  const bounds = svg.getBoundingClientRect()
  const x = touch.pageX - bounds.left - svg.clientWidth * 0.5
  const y = touch.pageY - bounds.top - svg.clientHeight * 0.5

  const clockwise = 1 - (Math.PI + Math.atan2(x, y)) / (2 * Math.PI)
  emit('update:generatorCents', clockwise * periodCents.value)
}

function onTouchStart(event: TouchEvent) {
  if (event.touches.length === 1) {
    handleTouch(event.touches[0])
  }
}

function onTouchMove(event: TouchEvent) {
  if (event.touches.length === 1) {
    event.preventDefault()
    handleTouch(event.touches[0])
  }
}

onMounted(() => {
  window.addEventListener('mouseup', onWindowMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', onWindowMouseUp)
})
</script>

<template>
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 100 100"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    ref="container"
  >
    <line
      v-for="(attrs, index) of generatorTrajectory"
      :key="index"
      v-bind="attrs"
      stroke-width="0.5%"
      stroke="rgba(127, 127, 127, 0.5)"
    />

    <circle cx="50%" cy="50%" r="40%" fill="none" stroke-width="0.7%" />

    <line
      v-for="(attrs, index) of scaleTickCoords"
      :key="index"
      v-bind="attrs"
      stroke-width="0.5%"
      class="scale-tick"
    />
    <text
      v-for="(label, index) of scaleLabels"
      :key="index"
      :x="label.x"
      :y="label.y"
      font-size="3.5"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      {{ label.name }}
    </text>

    <line
      v-for="(attrs, index) of generatorTickCoords"
      :key="index"
      v-bind="attrs"
      stroke-width="0.5%"
      class="generator-tick"
    />
    <text
      v-for="(label, index) of generatorLabels"
      :key="index"
      :x="label.x"
      :y="label.y"
      font-size="4"
      text-anchor="middle"
      dominant-baseline="middle"
      class="generator"
    >
      {{ label.name }}
    </text>
  </svg>
</template>

<style scoped>
svg {
  user-select: none;
}

svg circle {
  stroke: var(--color-accent);
}

svg .scale-tick {
  stroke: var(--color-accent-mute);
}

svg .generator-tick {
  stroke: var(--color-accent-deeper);
}

svg text {
  fill: var(--color-text);
}

svg text.generator {
  fill: var(--color-accent-text-btn);
}
</style>
