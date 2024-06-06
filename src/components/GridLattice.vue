<script setup lang="ts">
import { useGridStore } from '@/stores/grid'
import { debounce, labelX, labelY } from '@/utils'
import { spanGrid } from 'ji-lattice'
import { type Interval } from 'sonic-weave'
import { computed, ref, watch } from 'vue'

const store = useGridStore()

const props = defineProps<{
  relativeIntervals: Interval[]
  labels: string[]
  colors: string[]
  heldNotes: Set<number>
}>()

const svgElement = ref<SVGSVGElement | null>(null)

const steps = computed(() => {
  const result: number[] = []
  for (const interval of props.relativeIntervals) {
    result.push(interval.dot(store.val).valueOf())
  }
  return result
})

const grid = computed(() => {
  const result = spanGrid(steps.value, store.gridOptions)
  return result
})

const gridLines = computed(() => grid.value.edges.filter((e) => e.type === 'gridline'))
const edges = computed(() => grid.value.edges.filter((e) => e.type !== 'gridline'))

const viewBox = computed(
  () =>
    `${store.viewCenterX - store.viewScale} ${store.viewCenterY - store.viewScale} ${store.viewScale * 2} ${store.viewScale * 2}`
)

function computeGridExtent() {
  const element = svgElement.value
  if (!element) {
    return
  }
  const portAspectRatio = element.clientWidth / element.clientHeight
  // The grid extent is much larger than the view port to reach long custom connecting edges.
  const s = 2 * store.viewScale
  if (portAspectRatio >= 1) {
    store.minY = store.viewCenterY - s
    store.maxY = store.viewCenterY + s
    store.minX = store.viewCenterX - portAspectRatio * s
    store.maxX = store.viewCenterX + portAspectRatio * s
  } else {
    store.minY = store.viewCenterY - s / portAspectRatio
    store.maxY = store.viewCenterY + s / portAspectRatio
    store.minX = store.viewCenterX - s
    store.maxX = store.viewCenterX + s
  }
}

const computeExtent = debounce(computeGridExtent)

watch(svgElement, (element) => {
  if (!element) {
    return
  }
  computeGridExtent()
  const observer = new ResizeObserver(computeExtent)
  observer.observe(element)
})

watch(
  () => [
    store.viewScale,
    store.minX,
    store.maxX,
    store.minY,
    store.maxY,
    store.viewCenterX,
    store.viewCenterY
  ],
  computeExtent
)
</script>

<template>
  <svg
    ref="svgElement"
    class="lattice"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="viewBox"
    preserveAspectRatio="xMidYMid meet"
  >
    <line
      v-for="(e, i) of gridLines"
      :key="i"
      v-bind="e"
      :class="`edge ${e.type}`"
      :stroke-width="store.size * 0.1"
    />
    <line
      v-for="(e, i) of edges"
      :key="i"
      v-bind="e"
      :class="`edge ${e.type}`"
      :stroke-width="store.size * 0.2"
    />
    <circle
      v-for="(v, i) of grid.vertices"
      :key="i"
      :class="{ node: true, held: v.indices.some((idx) => heldNotes.has(idx)) }"
      :cx="v.x"
      :cy="v.y"
      :r="store.size"
      :fill="colors[v.indices[0]] ?? 'none'"
      :stroke="colors[v.indices[0]] ?? 'none'"
      :stroke-width="store.size * 0.1"
    />
    <template v-if="store.showLabels">
      <template v-for="(v, i) of grid.vertices" :key="i">
        <text
          v-for="(idx, j) of v.indices"
          :key="idx"
          class="node-label"
          :x="v.x + store.size * store.labelOffset * labelX(j, v.indices.length)"
          :y="v.y + store.size * store.labelOffset * labelY(j, v.indices.length)"
          :font-size="`${2.5 * store.size}px`"
          :stroke-width="store.size * 0.05"
          dominant-baseline="middle"
        >
          {{ labels[idx] }}
        </text>
      </template>
    </template>
  </svg>
</template>

<style scoped>
svg {
  border: dashed 2px var(--color-background-soft);
  border-radius: 4px;
}
</style>
