<script setup lang="ts">
import type { Interval, Scale } from 'scale-workshop-core'
import { computed, onMounted, type ComputedRef, ref, onUnmounted } from 'vue'
import { monzoEuclideanDistance } from '@/utils'
import { dot, kCombinations } from 'xen-dev-utils'
const props = defineProps<{
  scale: Scale
  heldScaleDegrees: Set<number>
}>()

type Node = {
  x: number
  y: number
  label: string
  index: number
  fill: string
}

// Based on Kraig Grady's coordinate system https://anaphoria.com/wilsontreasure.html
// X-coordinates for every prime up to 23.
const horizontalCoords = [-23, 40, 0, 13, -14, -8, -5, 7, 20]
// Y-coordinates for every prime up to 23.
const verticalCoords = [-45, 0, -40, -11, -18, -4, -32, -25, -6]

const container = ref<HTMLDivElement | null>(null)

const adjustLatticeSize = () => {
  if (container.value) {
    const containerBox = container.value.getBoundingClientRect()
    const containerHeight = window.innerHeight - containerBox.top
    const image: HTMLElement | null = container.value.querySelector('#lattice')

    if (container.value && image) {
      image.style.width = `100%`
      image.style.height = `${containerHeight}px`
    }
  }
}

onMounted(() => {
  adjustLatticeSize()
  window.addEventListener('resize', adjustLatticeSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', adjustLatticeSize)
})

// === Computed state ===

const canLatticePrimes = computed(() => {
  try {
    return props.scale.intervals.reduce(
      (canLattice: boolean, interval: Interval) =>
        canLattice &&
        interval.monzo
          .toIntegerMonzo()
          .slice(9) // hardcoded for now to the 23-limit
          .reduce((isZero: boolean, component: number) => isZero && component === 0, true),
      true
    )
  } catch {
    return false
  }
})

function maybeGetPrimeEquave(equave: Interval): number | null {
  try {
    const intergerMonzo: number[] = equave.monzo.toIntegerMonzo()
    return intergerMonzo.reduce(
      (primeIndex: number | null, component: number, i: number): number | null => {
        if (component === 1 && !primeIndex) {
          return i
        }
        if (component !== 0) {
          throw new Error('Equave is not a prime number')
        }
        if (component === 0) {
          return primeIndex
        }
        return null
      },
      null
    )
  } catch {
    return null
  }
}

const equavePrimeIndex = computed(() => maybeGetPrimeEquave(props.scale.equave))

const nodes: ComputedRef<Node[] | string> = computed(() => {
  try {
    if (equavePrimeIndex.value === null) {
      return 'The lattice only supports scales with a prime equave'
    }
    if (props.scale.intervals.length <= 1) {
      return 'A scale must contain at least two intervals'
    }
    return props.scale.intervals.map(({ monzo, name: label }, index: number) => {
      const vector = monzo.toIntegerMonzo()
      // Make the interval of equivalence disappear.
      vector[equavePrimeIndex.value!] = 0
      return {
        label,
        x: dot(horizontalCoords, vector),
        y: dot(verticalCoords, vector),
        fill: 'white',
        index
      }
    })
  } catch {
    return 'Cannot make lattice of non JI scale.'
  }
})

const nodesByLabel: ComputedRef<{ [key: string]: Node }> = computed(() =>
  Array.isArray(nodes.value)
    ? nodes.value.reduce((acc, node) => ({ ...acc, [node.label]: node }), {})
    : {}
)

const edges = computed(() => {
  try {
    if (!Array.isArray(nodes.value)) {
      return []
    }

    const combinations = kCombinations(props.scale.intervals, 2)
    return combinations
      .map(([a, b]) => {
        return {
          distance: monzoEuclideanDistance(
            equavePrimeIndex.value ?? -1, //adding a type check outside of this map doesn't seem to work so passing in -1
            a.monzo.toIntegerMonzo(),
            b.monzo.toIntegerMonzo()
          ),
          pair: [a.name, b.name]
        }
      })
      .filter(({ distance }) => distance === 1)
  } catch {
    return []
  }
})

const svgElement = ref<HTMLElement | null>(null)

const viewBox = computed(() => {
  if (svgElement.value) {
    return [
      ...svgElement.value.querySelectorAll('text'),
      ...svgElement.value.querySelectorAll('circle')
    ].reduce(
      ({ minX, maxX, minY, maxY }, el) => {
        const { x, y, width, height } = el.getBBox({
          stroke: true,
          fill: true
        })
        return {
          minX: Math.min(minX, x),
          minY: Math.min(minY, y),
          maxX: Math.max(maxX, x + width),
          maxY: Math.max(maxY, y + height)
        }
      },
      {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
      }
    )
  }
  return {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0
  }
})

function isNodeErrorMessage(nodeValue: any): nodeValue is string {
  return typeof nodeValue === 'string'
}

const error = computed(() => {
  if (!canLatticePrimes.value) {
    return 'Can only make lattice of JI scales up to 23-limit'
  }
  if (isNodeErrorMessage(nodes.value)) {
    return (
      nodes.value ||
      'There was an unknown error while making this lattice, please try again or with another scale.'
    )
  }
  return null
})
</script>

<template>
  <div ref="container" class="container">
    <div v-if="error">
      <p>{{ error }}</p>
    </div>
    <div v-else>
      <svg
        v-if="Array.isArray(nodes)"
        ref="svgElement"
        id="lattice"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        :viewBox="
          [
            viewBox.minX,
            viewBox.minY,
            viewBox.maxX - viewBox.minX,
            viewBox.maxY - viewBox.minY
          ].join(' ')
        "
      >
        <line
          v-for="edge of edges"
          class="edge"
          :key="edge.pair.join()"
          :x1="nodesByLabel[edge.pair[0]].x"
          :x2="nodesByLabel[edge.pair[1]].x"
          :y1="nodesByLabel[edge.pair[0]].y"
          :y2="nodesByLabel[edge.pair[1]].y"
        />
        <circle
          v-for="(node, index) of nodes"
          :key="index"
          :cx="node.x"
          :cy="node.y"
          r="2.5"
          :class="{ node: true, heldDegree: heldScaleDegrees.has(node.index) }"
        />
        <!-- Separating the iteration of the labels so that circles don't overlap any text -->
        <text
          v-for="(node, index) of nodes"
          :key="index"
          class="node-text"
          :x="node.x"
          :y="node.y - 4"
        >
          {{ node.label }}
        </text>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.container {
  flex-grow: 1;
}
svg {
  background-color: transparent;
}
.edge {
  stroke: var(--color-text);
  stroke-width: 0.5;
}

.node {
  fill: var(--color-text);
}

.node.heldDegree {
  fill: var(--color-accent);
}

.node-text {
  font-family: sans-serif;
  font-size: 7px;
  fill: var(--color-accent-text-btn);
  text-anchor: middle;
  stroke: var(--color-background);
  stroke-width: 0.2;
}
</style>
