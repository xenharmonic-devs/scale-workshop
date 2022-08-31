<script setup lang="ts">
/**
 * 404 page with an easter egg for generating an octaplex scale
 */

import OctaplexPortal from "@/components/modals/generation/SummonOctaplex.vue";
import type Scale from "@/scale";
import type { Synth } from "@/synth";
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

  keyboardMode: "isomorphic" | "mapped";
  keyboardMapping: Map<string, number>;

  equaveShift: number;
  degreeShift: number;

  synth: Synth;
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
      keyboardMode: props.keyboardMode,
      keyboardMapping: props.keyboardMapping,
      equaveShift: props.equaveShift,
      degreeShift: props.degreeShift,

      waveform: props.synth.waveform,
      attackTime: props.synth.attackTime,
      decayTime: props.synth.decayTime,
      sustainLevel: props.synth.sustainLevel,
      releaseTime: props.synth.releaseTime,
    };

    const query = encodeQuery(state) as LocationQuery;
    query.version = version;

    router.push({ path: "/", query });
  });
}
</script>

<template>
  <main>
    <div class="labyrinth">
      <h2>Not found</h2>
      <p>
        We couldn't find what you were looking for, but
        <a href="#" @click="ritualInProgress = true">here's an octaplex</a>.
      </p>
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
.labyrinth {
  height: 100%;
  padding: 1rem;
}
.labyrinth > * {
  max-width: 30rem;
}
</style>
