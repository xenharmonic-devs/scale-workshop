<script setup lang="ts">
/**
 * Just intonation lattice visualization with a 3D look.
 * Not as convincing as OpenGL, but much less bloated than three.js.
 */
import { useJiLatticeStore } from '@/stores/ji-lattice'
import { spanLattice3D } from 'ji-lattice'
import { computed, nextTick, reactive, ref, watch } from 'vue'

const EPSILON = 1e-6

/** Near field z-index cutoff */
const NEAR_PLANE = 0.5

const store = useJiLatticeStore()

const props = defineProps<{
  monzos: number[][]
  labels: string[]
  colors: string[]
  heldNotes: Set<number>
}>()

const svgElement = ref<SVGSVGElement | null>(null)

const viewBox = reactive([-1, -1, 2, 2])

const lattice = computed(() => {
  const result = spanLattice3D(props.monzos, store.latticeOptions3D)
  // Center everything so that the vanishing point is at the center of the view box
  const inorm = 1 / result.vertices.length
  const avgX = result.vertices.reduce((s, v) => s + v.x, 0) * inorm
  const avgY = result.vertices.reduce((s, v) => s + v.y, 0) * inorm
  const avgZ = result.vertices.reduce((s, v) => s + v.z, 0) * inorm
  result.vertices = result.vertices.map((v) => ({
    ...v,
    x: v.x - avgX,
    y: v.y - avgY,
    z: v.z - avgZ
  }))
  result.edges = result.edges.map((e) => ({
    ...e,
    x1: e.x1 - avgX,
    y1: e.y1 - avgY,
    z1: e.z1 - avgZ,
    x2: e.x2 - avgX,
    y2: e.y2 - avgY,
    z2: e.z2 - avgZ
  }))
  return result
})

watch(
  () => [
    svgElement.value,
    lattice.value,
    props.labels,
    store.depth,
    store.labelOffset,
    store.size,
    store.showLabels
  ],
  (dependencies) => {
    const element = dependencies[0] as unknown as SVGSVGElement
    if (!element) {
      return
    }
    // Must wait for Vue to render elements before calculating bounding boxes
    nextTick(() => {
      viewBox[0] = Infinity
      viewBox[1] = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      for (const el of element.children as unknown as SVGCircleElement[]) {
        const { x, y, width, height } = el.getBBox({
          stroke: true,
          fill: true
        })
        viewBox[0] = Math.min(viewBox[0], x)
        viewBox[1] = Math.min(viewBox[1], y)
        maxX = Math.max(maxX, x + width)
        maxY = Math.max(maxY, y + height)
      }
      viewBox[2] = maxX - viewBox[0]
      viewBox[3] = maxY - viewBox[1]
      viewBox[0] -= store.size * 0.5
      viewBox[1] -= store.size * 0.5
      viewBox[2] += store.size
      viewBox[3] += store.size
    })
  }
)

const elements = computed(() => {
  const result = []
  for (const vertex of lattice.value.vertices) {
    const z = vertex.z + store.depth
    if (z < NEAR_PLANE) {
      continue
    }
    const s = store.depth / z
    const cx = vertex.x * s
    const cy = vertex.y * s
    const r = store.size * s
    const node: any = {
      tag: 'circle',
      cx,
      cy,
      r,
      'stroke-width': 0.1 * r,
      class: { node: true, held: props.heldNotes.has(vertex.index!) },
      z
    }
    if (vertex.index === undefined) {
      node.class.auxiliary = true
      node.r *= 0.4
    } else {
      node.fill = props.colors[vertex.index]
    }
    result.push(node)
    if (store.showLabels && vertex.index !== undefined) {
      result.push({
        tag: 'text',
        x: cx,
        y: cy - store.labelOffset * r,
        'font-size': `${3 * r}px`,
        'stroke-width': 0.08 * r,
        class: { 'node-label': true },
        body: props.labels[vertex.index],
        z: z - EPSILON
      })
    }
  }
  for (const edge of lattice.value.edges) {
    const z1 = edge.z1 + store.depth
    const z2 = edge.z2 + store.depth
    if (z1 < NEAR_PLANE || z2 < NEAR_PLANE) {
      continue
    }
    const s1 = store.depth / z1
    const x1 = edge.x1 * s1
    const y1 = edge.y1 * s1
    const s2 = store.depth / z2
    const x2 = edge.x2 * s2
    const y2 = edge.y2 * s2
    let u = x2 - x1
    let v = y2 - y1
    const r = Math.hypot(u, v)
    if (r < EPSILON) {
      continue
    }
    u /= r
    v /= r
    if (edge.type === 'auxiliary') {
      u *= 0.1
      v *= 0.1
    } else {
      u *= 0.5
      v *= 0.5
    }
    const points = `${x1 + v * s1},${y1 - u * s1} ${x1 - v * s1},${y1 + u * s1} ${x2 - v * s2},${y2 + u * s2} ${x2 + v * s2},${y2 - u * s2}`
    if (store.grayExtras && edge.type === 'custom') {
      ;(edge as any).type = 'border'
    }
    result.push({
      tag: 'polygon',
      points,
      class: `edge ${edge.type}`,
      z: Math.max(z1, z2) + EPSILON
    })
  }
  result.sort((a, b) => b.z - a.z)
  return result
})
</script>

<template>
  <svg
    ref="svgElement"
    class="lattice"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="viewBox.join(' ')"
    preserveAspectRatio="xMidYMid meet"
  >
    <template v-for="(element, i) of elements" :key="i">
      <circle v-if="element.tag === 'circle'" v-bind="element" />
      <polygon v-if="element.tag === 'polygon'" v-bind="element" />
      <text v-if="element.tag === 'text'" v-bind="element">{{ element.body }}</text>
    </template>
  </svg>
</template>
