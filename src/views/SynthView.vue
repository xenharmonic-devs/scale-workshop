<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import TimeDomainVisualizer from "@/components/TimeDomainVisualizer.vue";

const props = defineProps<{
  audioContext: AudioContext;
  audioOutput: AudioNode | null;
  mainVolume: number;
  keyboardMode: "isomorphic" | "mapped";
  isomorphicHorizontal: number;
  isomorphicVertical: number;
  equaveShift: number;
}>();

const emit = defineEmits([
  "update:mainVolume",
  "update:keyboardMode",
  "update:isomorphicHorizontal",
  "update:isomorphicVertical",
  "update:equaveShift",
  "mapAsdf",
  "mapZxcv0",
  "mapZxcv1",
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
const keyboardMode = computed({
  get: () => props.keyboardMode,
  set: (newValue: "isomorphic" | "mapped") =>
    emit("update:keyboardMode", newValue),
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
        <h2>Keyboard mode</h2>
        <div class="control-group">
          <div class="control">
            <span>
              <input
                type="radio"
                id="mode-isomorphic"
                value="isomorphic"
                v-model="keyboardMode"
              />
              <label for="mode-isomorphic"> Isomorphic </label>
            </span>
            <span>
              <input
                type="radio"
                id="mode-mapped"
                value="mapped"
                v-model="keyboardMode"
              />
              <label for="mode-mapped"> Black&white layers </label>
            </span>
          </div>
          <template v-if="keyboardMode === 'mapped'">
            <button @click="$emit('mapAsdf')">
              Assign ASDF & QWERTY from key colors
            </button>
            <button @click="$emit('mapZxcv1')">
              Assign ZXCV & ASDF + QWERTY & 1234 from key colors
            </button>
            <button @click="$emit('mapZxcv0')">
              Same as above, but lowest course shifted left
            </button>
          </template>
        </div>
        <p>"Shift" key toggles sustain for individual keys.</p>
        <p>The key left of digit "1" releases sustain.</p>
        <i>The isomorphic settings affect both typing and virtual keyboards.</i>
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
