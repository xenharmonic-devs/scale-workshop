<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS, LEFT_MOUSE_BTN } from "@/constants";
import type Scale from "@/scale";
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { PRIMES, mmod, valueToCents, sub } from "xen-dev-utils";

// TODO: Touch interaction

const props = defineProps<{
  scale: Scale;
  keyColors: string[];
}>();

const primeVectors = reactive([
  [0, 0], // 2
  [0, -1], // 3
  [1, 0], // 5
  [-0.7071, 0.7071], // 7
  [0.841, -0.54], // 11
  [-0.902, 0.431], // 13
  [-0.659, -0.752], // 17
  [0.906, 0.423], // 19
  [0.627, -0.779],
  [-0.268, 0.963],
  [-0.954, 0.301],
  [0.8, 0.6],
  [-0.62, -0.78],
  [0.655, 0.755],
  [0.85, 0.52],
  [0.287, 0.958],
  [-0.309, 0.951],
  [0.845, -0.534],
  [-0.776, 0.631],
  [-0.302, 0.953],
  [-0.56, 0.829],
  [0.6, 0.8],
  [-0.8, 0.6],
  [-0.71, -0.71],
  [0.54, 0.841],
]);

const centsVector = reactive([0, 1 / 600]);

const EPSILON = 0.01;
const SNAP_EPSILON = 0.1;

const PRIME_ARROWS_X = 10;
const PRIME_ARROWS_Y = 10;
const PRIME_ARROWS_SHAFT = 5;
const PRIME_ARROWS_TIP = 1;
const PRIME_ARROWS_BREADTH = 0.5;

const primeCoords = computed(() =>
  primeVectors.map((vector) => {
    const h = Math.hypot(vector[0], vector[1]);
    if (h < EPSILON) {
      return {
        x1: `${PRIME_ARROWS_X}`,
        y1: `${PRIME_ARROWS_Y}`,
        x2: `${PRIME_ARROWS_X}`,
        y2: `${PRIME_ARROWS_Y}`,
        tx: `${PRIME_ARROWS_X + 3}`,
        d:
          `M${PRIME_ARROWS_X + PRIME_ARROWS_BREADTH} ${PRIME_ARROWS_Y} ` +
          `L${PRIME_ARROWS_X - PRIME_ARROWS_BREADTH} ${PRIME_ARROWS_Y} ` +
          `L${PRIME_ARROWS_X} ${PRIME_ARROWS_Y + PRIME_ARROWS_TIP} ` +
          "Z",
      };
    }
    const u = vector[0] / h;
    const v = vector[1] / h;
    return {
      x1: `${PRIME_ARROWS_X}`,
      y1: `${PRIME_ARROWS_Y}`,
      x2: `${PRIME_ARROWS_X + PRIME_ARROWS_SHAFT * vector[0]}`,
      y2: `${PRIME_ARROWS_Y + PRIME_ARROWS_SHAFT * vector[1]}`,
      tx: `${PRIME_ARROWS_X + PRIME_ARROWS_SHAFT * vector[0] + 3}`,
      d:
        `M${
          PRIME_ARROWS_X + PRIME_ARROWS_SHAFT * vector[0] + PRIME_ARROWS_TIP * u
        } ${
          PRIME_ARROWS_Y + PRIME_ARROWS_SHAFT * vector[1] + PRIME_ARROWS_TIP * v
        } ` +
        `L${
          PRIME_ARROWS_X +
          PRIME_ARROWS_SHAFT * vector[0] +
          PRIME_ARROWS_BREADTH * v
        } ${
          PRIME_ARROWS_Y +
          PRIME_ARROWS_SHAFT * vector[1] -
          PRIME_ARROWS_BREADTH * u
        } ` +
        `L${
          PRIME_ARROWS_X +
          PRIME_ARROWS_SHAFT * vector[0] -
          PRIME_ARROWS_BREADTH * v
        } ${
          PRIME_ARROWS_Y +
          PRIME_ARROWS_SHAFT * vector[1] +
          PRIME_ARROWS_BREADTH * u
        } ` +
        "Z",
    };
  })
);

const indices = computed<number[]>(() => {
  const result: Set<number> = new Set();
  for (const interval of props.scale.intervals) {
    for (let i = 0; i < DEFAULT_NUMBER_OF_COMPONENTS; ++i) {
      if (!interval.monzo.vector[i].equals(0)) {
        result.add(i);
      }
    }
  }
  for (let i = 0; i < DEFAULT_NUMBER_OF_COMPONENTS; ++i) {
    if (!props.scale.equave.monzo.vector[i].equals(0)) {
      result.add(i);
    }
  }
  return [...result.values()];
});

type LatticeElement = {
  key: number;
  x: number;
  y: number;
  name: string;
  color: string;
  cx?: string;
  cy?: string;
  tx?: string;
};

const connections = computed(() => {
  const monzos = [];
  for (let i = 1; i < props.scale.size + 1; ++i) {
    // TODO: Other equaves than 2?
    monzos.push(
      props.scale
        .getMonzo(i)
        .vector.slice(1)
        .map((f) => f.valueOf())
    );
  }
  const distanceMatrix: number[][] = [];
  for (let i = 0; i < monzos.length; ++i) {
    distanceMatrix.push(Array(monzos.length).fill(Infinity));
  }
  // Find distances
  for (let i = 0; i < monzos.length; ++i) {
    for (let j = i + 1; j < monzos.length; ++j) {
      const distanceSquared = sub(monzos[i], monzos[j])
        .map((diff) => diff * diff)
        .reduce((a, b) => a + b);
      distanceMatrix[i][j] = distanceSquared;
      distanceMatrix[j][i] = distanceSquared;
    }
  }
  // Keep only nearest neighbours
  for (let i = 0; i < monzos.length; ++i) {
    const min = Math.min(...distanceMatrix[i]);
    for (let j = 0; j < monzos.length; ++j) {
      if (distanceMatrix[i][j] > min) {
        distanceMatrix[i][j] = Infinity;
      }
    }
  }
  // Connect neighbours
  const result = [];
  for (let i = 0; i < monzos.length; ++i) {
    for (let j = 0; j < monzos.length; ++j) {
      if (distanceMatrix[i][j] < Infinity) {
        result.push([i, j]);
      }
    }
  }
  return result;
});

// TODO: Optional tiling with commas
// TODO: Highlight played elements
const elements = computed(() => {
  const result: LatticeElement[] = [];
  for (let i = 0; i < props.scale.size + 1; ++i) {
    const monzo = props.scale.getMonzo(i);
    const cents = valueToCents(monzo.residual.valueOf()) + monzo.cents;
    const vector = monzo.vector.map((f) => f.valueOf());
    let x = centsVector[0] * cents;
    let y = centsVector[1] * cents;
    for (let j = 0; j < vector.length; ++j) {
      x += primeVectors[j][0] * vector[j];
      y += primeVectors[j][1] * vector[j];
    }
    const name = i === 0 ? "1/1" : props.scale.getName(i);
    const color = props.keyColors[mmod(i, props.keyColors.length)];
    result.push({ key: i, x, y, name, color });
  }
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const element of result) {
    left = Math.min(left, element.x);
    right = Math.max(right, element.x);
    top = Math.min(top, element.y);
    bottom = Math.max(bottom, element.y);
  }
  if (left === right) {
    left -= 1;
    right += 1;
  }
  if (top === bottom) {
    top -= 1;
    bottom += 1;
  }
  for (const element of result) {
    const cx = ((element.x - left) / (right - left)) * 70 + 15;
    const cy = ((element.y - top) / (bottom - top)) * 70 + 15;
    element.cx = `${cx}`;
    element.cy = `${cy}`;
    element.tx = `${cx + 2 + 0.6 * element.name.length}`;
  }
  // Show unison on the other side to differentiate it from the default octave position.
  result[0].tx = `${parseFloat(result[0].cx!) - 3.5}`;
  return result;
});

type LatticeLine = {
  key: string;
  x1: string;
  y1: string;
  x2: string;
  y2: string;
};

const edges = computed(() => {
  const result: LatticeLine[] = [];
  const elms = elements.value;
  for (const [i, j] of connections.value) {
    result.push({
      key: `${i},${j}`,
      x1: elms[i + 1].cx!,
      y1: elms[i + 1].cy!,
      x2: elms[j + 1].cx!,
      y2: elms[j + 1].cy!,
    });
  }
  return result;
});

const container = ref<SVGGraphicsElement | null>(null);

function getEventPosition(event: MouseEvent, svg: SVGGraphicsElement) {
  const ctm = svg.getCTM();
  if (ctm === null) {
    return {
      x: NaN,
      y: NaN,
    };
  }
  return {
    x: (event.offsetX - ctm.e) / ctm.a,
    y: (event.offsetY - ctm.f) / ctm.d,
  };
}

const activeIndex = ref<number | null>(null);

function moveActive(event: MouseEvent) {
  if (container.value === null || activeIndex.value === null) {
    return;
  }
  const position = getEventPosition(event, container.value);
  const vector = primeVectors[activeIndex.value];
  vector[0] = (position.x - PRIME_ARROWS_X) / PRIME_ARROWS_SHAFT;
  vector[1] = (position.y - PRIME_ARROWS_Y) / PRIME_ARROWS_SHAFT;
  if (Math.hypot(vector[0], vector[1]) < SNAP_EPSILON) {
    vector[0] = 0;
    vector[1] = 0;
  }
}

function onMouseDown(event: MouseEvent) {
  if (event.button !== LEFT_MOUSE_BTN) {
    return;
  }
  const dataset = (event.target! as SVGPathElement).dataset;
  if ("index" in dataset) {
    activeIndex.value = parseInt(dataset["index"] as string);
    moveActive(event);
  }
}

function onMouseMove(event: MouseEvent) {
  moveActive(event);
}

function onMouseUp(event: MouseEvent) {
  if (event.button !== LEFT_MOUSE_BTN) {
    return;
  }
  activeIndex.value = null;
}

onMounted(() => {
  if (container.value === null) {
    return;
  }
  container.value.addEventListener("mousedown", onMouseDown);
  container.value.addEventListener("mousemove", onMouseMove);
  container.value.addEventListener("mouseup", onMouseUp);
});

onUnmounted(() => {
  if (container.value === null) {
    return;
  }
  container.value.removeEventListener("mousedown", onMouseDown);
  container.value.removeEventListener("mousemove", onMouseMove);
  container.value.removeEventListener("mouseup", onMouseUp);
});
</script>

<template>
  <svg ref="container" width="100%" height="100%" viewBox="0 0 100 100">
    <template v-for="index of indices" :key="index">
      <line
        :x1="primeCoords[index].x1"
        :y1="primeCoords[index].y1"
        :x2="primeCoords[index].x2"
        :y2="primeCoords[index].y2"
        stroke="black"
        pointer-events="none"
      />
      <path :d="primeCoords[index].d" stroke="black" :data-index="index" />
      <text
        :x="primeCoords[index].tx"
        :y="primeCoords[index].y2"
        stroke="darkgreen"
        font-size="3"
        stroke-width="0.1"
        text-anchor="middle"
        dominant-baseline="middle"
        pointer-events="none"
        style="user-select: none"
      >
        {{ PRIMES[index] }}
      </text>
    </template>
    <line
      v-for="edge of edges"
      :key="edge.key"
      :x1="edge.x1"
      :y1="edge.y1"
      :x2="edge.x2"
      :y2="edge.y2"
      stroke="gray"
      stroke-width="0.25"
      pointer-events="none"
    />
    <template v-for="element of elements" :key="element.key">
      <circle
        :cx="element.cx"
        :cy="element.cy"
        r="0.7"
        :fill="element.color"
        stroke="darkgray"
        stroke-width="0.25"
        pointer-events="none"
      />
      <text
        :x="element.tx"
        :y="element.cy"
        stroke="darkred"
        font-size="3"
        stroke-width="0.1"
        text-anchor="middle"
        dominant-baseline="middle"
        pointer-events="none"
        style="user-select: none"
      >
        {{ element.name }}
      </text>
    </template>
  </svg>
</template>
