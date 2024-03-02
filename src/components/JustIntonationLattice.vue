<script setup lang="ts">
import { useJiLatticeStore } from '@/stores/ji-lattice';
import { spanLattice } from 'ji-lattice'
import { type Interval } from 'sonic-weave';
import { computed, nextTick, reactive, ref, watch } from 'vue';

const store = useJiLatticeStore()

const props = defineProps<{
  relativeIntervals: Interval[]
  labels: string[]
  colors: string[]
  heldNotes: Set<number>
}>();

const svgElement = ref<SVGSVGElement | null>(null)

const viewBox = reactive([-1, -1, 2, 2]);

const monzos = computed(() => {
  const numComponents = store.horizontalCoordinates.length;
  const result: number[][] = [];
  for (const interval of props.relativeIntervals) {
    const value = interval.value.clone()
    value.numberOfComponents = numComponents
    const monzo = interval.value.primeExponents.map(pe => pe.valueOf())
    result.push(monzo);
  }
  return result;
});

const lattice = computed(() => {
  const result = spanLattice(monzos.value, store.latticeOptions)
  // Put aux vertices and lines behind the primary ones.
  result.vertices.reverse()
  result.edges.reverse()
  if (store.rotation) {
    const s = Math.sin(2 * Math.PI * store.rotation / 360)
    const c = Math.cos(2 * Math.PI * store.rotation / 360)
    for (const vertex of result.vertices) {
      const {x, y} = vertex;
      vertex.x = c * x - s * y;
      vertex.y = c * y + s * x;
    }
    for (const edge of result.edges) {
      const {x1, y1, x2, y2} = edge;
      edge.x1 = c * x1 - s * y1;
      edge.y1 = c * y1 + s * x1;
      edge.x2 = c * x2 - s * y2;
      edge.y2 = c * y2 + s * x2;
    }
  }
  return result;
})

watch(() => [svgElement.value, lattice.value, props.labels, store.labelOffset, store.size, store.showLabels], dependencies => {
  const element = dependencies[0] as unknown as SVGSVGElement;
  if (!element) {
    return;
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
});

// Note that the template below abuses Set and Array behavior w.r.t. undefined.
</script>

<template>
  <svg ref="svgElement" class="lattice" xmlns="http://www.w3.org/2000/svg" :viewBox="viewBox.join(' ')" preserveAspectRatio="xMidYMid meet">
    <line
      v-for="e, i of lattice.edges"
      :key="i"
      v-bind="e"
      :class="`edge ${e.type}`"
      :stroke-width="store.size * 0.2"
    />
    <circle
      v-for="v, i of lattice.vertices"
      :key="i"
      :class="{node: true, held: heldNotes.has(v.index!), auxiliary: v.index === undefined}"
      :cx="v.x"
      :cy="v.y"
      :r="v.index === undefined ? 0.4 * store.size : store.size"
      :fill="colors[v.index!] ?? 'none'"
      :stroke="colors[v.index!] ?? 'none'"
      :stroke-width="store.size * 0.1"
    />
    <template v-if="store.showLabels">
      <text
        v-for="v, i of lattice.vertices"
        :key="i"
        class="node-label"
        dominant-baseline="middle"
        :x="v.x"
        :y="v.y - store.labelOffset * store.size"
        :font-size="`${3 * store.size}px`"
        :stroke-width="store.size * 0.05"
      >
        {{ labels[v.index!] }}
      </text>
    </template>
  </svg>
</template>
