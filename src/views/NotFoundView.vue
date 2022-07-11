<script setup lang="ts">
/**
 * 404 page with an easter egg for generating an octaplex scale
 */

import OctaplexPortal from "@/components/modals/generation/SummonOctaplex.vue";
import type Scale from "@/scale";
import { encodeQuery } from "@/url-encode";
import { nextTick, ref } from "vue";
import { useRouter, type LocationQuery } from "vue-router";
import { version } from "../../package.json";

const props = defineProps<{
  scaleName: string;
  scaleLines: string[];
  baseMidiNote: number;
  keyColors: string[];

  scale: Scale;

  isomorphicHorizontal: number;
  isomorphicVertical: number;
}>();

const emit = defineEmits(["update:scale", "update:scaleName"]);

const ritualInProgress = ref(false);

const router = useRouter();

function openTheGates(scale: Scale) {
  emit("update:scale", scale);

  // Unfortunately we need to encode the state here.
  // Simply navigating to "/" triggers decoding of the default empty state.
  nextTick(() => {
    const state = {
      scaleName: props.scaleName,
      scaleLines: props.scaleLines,
      baseFrequency: props.scale.baseFrequency,
      baseMidiNote: props.baseMidiNote,
      keyColors: props.keyColors,
      isomorphicHorizontal: props.isomorphicHorizontal,
      isomorphicVertical: props.isomorphicVertical,
    };

    const query = encodeQuery(state) as LocationQuery;
    query.version = version;

    router.push({ path: "/", query });
  });
}
</script>

<template>
  <main>
    <div class="columns-container">
      <div class="column labyrinth">
        <h1>Not found</h1>
        <p>
          We couldn't find what you were looking for, but
          <a href="#" @click="ritualInProgress = true">here's an octaplex</a>.
        </p>
      </div>
    </div>
    <Teleport to="body">
      <OctaplexPortal
        :show="ritualInProgress"
        @update:scaleName="emit('update:scaleName', $event)"
        @update:scale="openTheGates"
        @cancel="ritualInProgress = false"
      />
    </Teleport>
  </main>
</template>

<style scoped>
div.columns-container {
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-border);
  column-count: 1;
}
div.column {
  background-color: var(--color-background);
  overflow-x: hidden;
  height: 100%;
}
div.labyrinth {
  padding: 1rem;
}
</style>
