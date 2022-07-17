<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import TimeDomainVisualizer from "@/components/TimeDomainVisualizer.vue";

const props = defineProps<{
  audioContext: AudioContext;
  audioOutput: AudioNode | null;
  mainVolume: number;
  equaveShift: number;
  isomorphicHorizontal: number;
  isomorphicVertical: number;
}>();

const emit = defineEmits([
  "update:equaveShift",
  "update:mainVolume",
  "update:isomorphicHorizontal",
  "update:isomorphicVertical",
]);

const timeDomainVisualizer = ref<any>(null);

const analyser = ref<AnalyserNode | null>(null);

const mainVolume = computed({
  get: () => props.mainVolume,
  set(newValue: number) {
    // There's something wrong with how input ranges are handled.
    if (typeof newValue !== "number") {
      newValue = parseFloat(newValue);
    }
    if (!isNaN(newValue)) {
      emit("update:mainVolume", newValue);
    }
  },
});
const isomorphicVertical = computed({
  get: () => props.isomorphicVertical,
  set: (newValue: number) => emit("update:isomorphicVertical", newValue),
});
const isomorphicHorizontal = computed({
  get: () => props.isomorphicHorizontal,
  set: (newValue: number) => emit("update:isomorphicHorizontal", newValue),
});
const equaveShift = computed({
  get: () => props.equaveShift,
  set: (newValue: number) => emit("update:equaveShift", newValue),
});

onMounted(() => {
  if (props.audioOutput !== null) {
    analyser.value = props.audioContext.createAnalyser();
    props.audioOutput.connect(analyser.value);
    timeDomainVisualizer.value.initialize(analyser.value);
  }
});

onUnmounted(() => {
  if (props.audioOutput !== null && analyser.value !== null) {
    props.audioOutput.disconnect(analyser.value);
    analyser.value = null;
  }
});
</script>

<template>
  <main>
    <div class="columns-container">
      <div class="column synth-controls">
        <h1>Synth</h1>
        <div class="control-group">
          <label for="volume">Main volume</label>
          <input
            type="range"
            min="0"
            max="0.5"
            step="any"
            v-model="mainVolume"
          />
        </div>
        <h2>Waveform</h2>
        <TimeDomainVisualizer
          ref="timeDomainVisualizer"
          class="waveform"
          :width="512"
          :height="192"
          :lineWidth="1.5"
          strokeStyle="black"
          :analyser="analyser"
        />
      </div>
      <div class="column keyboard-controls">
        <h1>Keyboard</h1>
        <h2>Isomorphic key mapping</h2>
        <p>
          Distance (in scale degrees) between adjacent keys on the
          horizontal/vertical axes.
        </p>
        <div class="control-group">
          <div class="control">
            <label for="vertical">Vertical</label>
            <input type="number" id="vertical" v-model="isomorphicVertical" />
          </div>
          <div class="control">
            <label for="horizontal">Horizontal</label>
            <input
              type="number"
              id="horizontal"
              v-model="isomorphicHorizontal"
            />
          </div>
        </div>
        <h2>Octave/equave shift</h2>
        <p>
          Trigger lower/higher notes. Also mapped to numpad division " / " and
          multiply " * ".
        </p>
        <div class="control-group">
          <div class="control">
            <input type="number" v-model="equaveShift" />
          </div>
        </div>
        <p>"Shift" key toggles sustain for individual keys.</p>
        <p>The key left of digit "1" releases sustain.</p>
        <i>These settings affect both typing and virtual keyboards.</i>
      </div>
    </div>
  </main>
</template>

<style scoped>
div.columns-container {
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-border);
  column-count: 2;
  column-gap: 1px;
}
div.column {
  background-color: var(--color-background);
  overflow-x: hidden;
  height: 100%;
}
div.synth-controls {
  padding: 1rem;
}
div.keyboard-controls {
  padding: 1rem;
}

.waveform {
  width: 100%;
  height: auto;
}

/* TODO: media queries left for a later UI pass */
</style>
