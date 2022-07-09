<script setup lang="ts">
import type Scale from "@/scale";
import { computed } from "vue";
import { mmod } from "xen-dev-utils";

const props = defineProps<{
  scale: Scale;
}>();

const ticksAndColors = computed(() => {
  const equaveCents = props.scale.equave.totalCents();
  const result = [];

  for (let i = 0; i < props.scale.size; ++i) {
    const cents = props.scale.getMonzo(i).toCents();
    const tick = cents / equaveCents;
    let color = "black";
    if (tick < 0) {
      color = "blue";
    } else if (tick > 1) {
      color = "red";
    }
    if (!isNaN(tick) && isFinite(tick)) {
      result.push([`${0.5 + 99 * mmod(tick, 1)}%`, color]);
    }
  }
  // mmod(1, 1) === 0, so we have to manually push the equave tick
  result.push(["99.5%", "black"]);
  return result;
});
</script>

<template>
  <svg width="100%" height="10">
    <line x1="0.5%" y1="50%" x2="99.5%" y2="50%" style="stroke: black" />
    <line
      v-for="([tick, color], i) of ticksAndColors"
      :key="i"
      :x1="tick"
      y1="5%"
      :x2="tick"
      y2="95%"
      :style="'stroke:' + color + ';'"
    />
  </svg>
</template>
