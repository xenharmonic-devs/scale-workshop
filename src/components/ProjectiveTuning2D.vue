<script setup lang="ts">
import { computed, reactive } from "vue";

const props = defineProps<{
  vals: { [key: string]: number[] };
  metric: number[];
}>();

const emit = defineEmits<{
  (e: "submit", selected: string[]): void;
}>();

const selected: string[] = reactive([]);

const diagonalYScale = Math.sqrt(0.75);

const points = computed(() =>
  Object.keys(props.vals).map((name) => {
    const val = props.vals[name];
    let a = val[0] * props.metric[0];
    let b = val[1] * props.metric[1];
    let c = val[2] * props.metric[2];
    const norm = Math.sqrt(a * a + b * b + c * c);
    a /= norm;
    b /= norm;
    c /= norm;
    const x = 0.5 * (a + b) - c;
    const y = (a - b) * diagonalYScale;
    return {
      x: x * 20000 + 300,
      y: y * 20000 + 300,
      size: `${1000 / norm}px`,
      fill: selected.includes(name) ? "red" : "black",
      name,
    };
  })
);

function onSelect(name: string) {
  if (selected.includes(name)) {
    selected.splice(selected.indexOf(name), 1);
  } else {
    if (selected.length >= 2) {
      selected.shift();
    }
    selected.push(name);
  }
}

function onSubmit() {
  if (selected.length < 2) {
    return;
  }
  emit("submit", selected);
}
</script>

<template>
  <svg>
    <text
      v-for="point of points"
      v-bind:key="point.name"
      :x="point.x"
      :y="point.y"
      :font-size="point.size"
      @click="onSelect(point.name)"
      text-anchor="middle"
      :fill="point.fill"
    >
      {{ point.name }}
    </text>
  </svg>
  <button @click="onSubmit">Done</button>
</template>

<style scoped>
svg {
  width: 800px;
  height: 800px;
  user-select: none;
}
</style>
