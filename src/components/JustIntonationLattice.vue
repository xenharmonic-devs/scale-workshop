<script setup lang="ts">
import type Scale from "@/scale";
import { computed } from "vue";

const props = defineProps<{
  scale: Scale;
  labels: string[];
}>();

const axisAngles = [0, 90, 135, 150, 220, 307].map(
  (degrees) => (degrees * Math.PI) / 180
);

const axes = axisAngles.map((theta) => [Math.cos(theta), Math.sin(theta)]);
axes.unshift([0, 0]); // Don't map prime 2

function distance(i: number, j: number) {
  const v1 = props.scale.getMonzo(i).vector;
  const v2 = props.scale.getMonzo(j).vector;
  let norm = 0;
  for (let k = 1; k < v1.length; ++k) {
    norm += v1[k].sub(v2[k]).pow(2).valueOf();
  }
  return Math.sqrt(norm);
}

function point(i: number) {
  const v = props.scale.getMonzo(i).vector;
  let x = 0;
  let y = 0;
  for (let k = 1; k < v.length; ++k) {
    x += axes[k][0] * v[k].valueOf();
    y += axes[k][1] * v[k].valueOf();
  }
  x = 700 + x * 170;
  y = 150 + y * 200;
  return { x, y };
}

const lines = computed(() => {
  const minDistances = [];
  for (let i = 0; i < props.scale.size; ++i) {
    let minDistance = Infinity;
    for (let j = 0; j < props.scale.size; ++j) {
      if (i === j) {
        continue;
      }
      const d = distance(i, j);
      minDistance = Math.min(minDistance, d);
    }
    minDistances.push(minDistance);
  }
  const result = [];
  for (let i = 0; i < props.scale.size; ++i) {
    for (let j = i + 1; j < props.scale.size; ++j) {
      const d = distance(i, j);
      if (d == minDistances[i] || d == minDistances[j]) {
        const p1 = point(i);
        const p2 = point(j);
        result.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
      }
    }
  }
  return result;
});

const intervals = computed(() => {
  const result = [];
  for (let i = 0; i < props.labels.length; ++i) {
    const p = point(i);
    result.push({
      text: props.labels[i],
      x: p.x,
      y: p.y,
    });
  }
  return result;
});
</script>

<template>
  <svg>
    <line
      v-for="(line, i) of lines"
      :key="i"
      v-bind="line"
      stroke="#236"
    ></line>
    <text
      v-for="(interval, i) of intervals"
      :key="i"
      :x="interval.x"
      :y="interval.y"
      text-anchor="middle"
      fill="white"
      stroke="#2b1"
    >
      {{ interval.text }}
    </text>
  </svg>
</template>

<style scoped>
svg {
  width: 800px;
  height: 800px;
  background: black;
}
</style>
