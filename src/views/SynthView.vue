<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import TimeDomainVisualizer from "@/components/TimeDomainVisualizer.vue";
import { BASIC_WAVEFORMS, CUSTOM_WAVEFORMS, type Synth } from "@/synth";

const props = defineProps<{
  audioContext: AudioContext;
  audioOutput: AudioNode | null;
  synth: Synth;
  mainVolume: number;
  keyboardMode: "isomorphic" | "mapped";
  isomorphicHorizontal: number;
  isomorphicVertical: number;
  equaveShift: number;
  degreeShift: number;
  colorScheme: "light" | "dark";
}>();

const emit = defineEmits([
  "update:mainVolume",
  "update:keyboardMode",
  "update:isomorphicHorizontal",
  "update:isomorphicVertical",
  "update:equaveShift",
  "update:degreeShift",
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
const degreeShift = computed({
  get: () => props.degreeShift,
  set: (newValue: number) => emit("update:degreeShift", newValue),
});

// Synth parameters not stored in URL because this synth is temporary.
const waveforms = BASIC_WAVEFORMS.concat(Object.keys(CUSTOM_WAVEFORMS));

const attackTime = computed({
  get: () => props.synth.attackTime,
  set(newValue: number) {
    if (typeof newValue !== "number") {
      newValue = parseFloat(newValue);
    }
    if (!isNaN(newValue)) {
      // Whatever, this is a temporary solution...
      // eslint-disable-next-line vue/no-mutating-props
      props.synth.attackTime = newValue;
    }
  },
});

const decayTime = computed({
  get: () => props.synth.decayTime,
  set(newValue: number) {
    if (typeof newValue !== "number") {
      newValue = parseFloat(newValue);
    }
    if (!isNaN(newValue)) {
      // eslint-disable-next-line vue/no-mutating-props
      props.synth.decayTime = newValue;
    }
  },
});

const sustainLevel = computed({
  get: () => props.synth.sustainLevel,
  set(newValue: number) {
    if (typeof newValue !== "number") {
      newValue = parseFloat(newValue);
    }
    if (!isNaN(newValue)) {
      // eslint-disable-next-line vue/no-mutating-props
      props.synth.sustainLevel = newValue;
    }
  },
});

const releaseTime = computed({
  get: () => props.synth.releaseTime,
  set(newValue: number) {
    if (typeof newValue !== "number") {
      newValue = parseFloat(newValue);
    }
    if (!isNaN(newValue)) {
      // eslint-disable-next-line vue/no-mutating-props
      props.synth.releaseTime = newValue;
    }
  },
});

const strokeStyle = computed(() => {
  // Add dependency.
  props.colorScheme;
  // Fetch from document.
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--color-text")
    .trim();
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
        <h2>Synth</h2>
        <div class="control-group">
          <TimeDomainVisualizer
            ref="timeDomainVisualizer"
            class="waveform"
            :width="512"
            :height="128"
            :lineWidth="1.5"
            :strokeStyle="strokeStyle"
            :analyser="analyser"
          />
        </div>
        <div class="control-group">
          <label for="volume">Main volume</label>
          <input
            class="control"
            type="range"
            min="0"
            max="0.4"
            step="any"
            v-model="mainVolume"
          />
          <div class="control">
            <label for="waveform">Waveform</label>
            <!-- eslint-disable-next-line vue/no-mutating-props -->
            <select id="waveform" class="control" v-model="synth.waveform">
              <option
                v-for="waveform of waveforms"
                :value="waveform"
                :key="waveform"
              >
                {{ waveform }}
              </option>
            </select>
          </div>
          <label for="attack">Attack time</label>
          <input
            id="attack"
            class="control"
            type="range"
            min="0.01"
            max="1.0"
            step="any"
            v-model="attackTime"
          />
          <label for="decay">Decay time</label>
          <input
            id="decay"
            class="control"
            type="range"
            min="0.01"
            max="1.0"
            step="any"
            v-model="decayTime"
          />
          <label for="sustain">Sustain level</label>
          <input
            id="sustain"
            class="control"
            type="range"
            min="0.01"
            max="1.0"
            step="any"
            v-model="sustainLevel"
          />
          <label for="release">Release time</label>
          <input
            id="release"
            class="control"
            type="range"
            min="0.01"
            max="1.0"
            step="any"
            v-model="releaseTime"
          />
        </div>
      </div>
      <div class="column keyboard-controls">
        <h2>Keyboard mode</h2>
        <div class="control-group">
          <div class="control radio-group">
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
        <h2>Keyboard equave shift</h2>
        <div class="control-group">
          <p>
            Trigger lower or higher notes. (Shortcut keys: numpad
            <code>/</code> and <code>*</code>)
          </p>
          <div class="control">
            <input type="number" v-model="equaveShift" />
          </div>
        </div>
        <template v-if="keyboardMode === 'isomorphic'">
          <h2>Keyboard degree shift</h2>
          <div class="control-group">
            <p>
              Shift down/up by one scale degree. (Shortcut keys: numpad
              <code>-</code> and <code>+</code>).
            </p>
            <div class="control">
              <input type="number" v-model="degreeShift" />
            </div>
          </div>
          <h2>Isomorphic key mapping</h2>
          <p>
            Distance between adjacent keys on the horizontal/vertical axes, in
            scale degrees. Affects virtual keyboard (and also typing keyboard if
            in isomorphic mode).
          </p>
          <div
            class="control-group"
            style="flex-direction: row; align-items: stretch; flex-wrap: nowrap"
          >
            <div class="control" style="width: 50%">
              <label for="vertical">Vertical</label>
              <input type="number" id="vertical" v-model="isomorphicVertical" />
            </div>
            <div class="control" style="width: 50%">
              <label for="horizontal">Horizontal</label>
              <input
                type="number"
                id="horizontal"
                v-model="isomorphicHorizontal"
              />
            </div>
          </div>
        </template>
        <h2>Keyboard shortcuts</h2>
        <div class="control-group">
          <p><code>Shift</code> sustain currently held keys after release</p>
          <p><code>`</code> release sustain, stop all playing notes</p>
          <p><code>numpad /</code> equave shift down</p>
          <p><code>numpad *</code> equave shift up</p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Content layout */
div.columns-container {
  height: 100%;
  overflow-y: auto;
}
div.column {
  overflow-x: hidden;
}

@media screen and (min-width: 600px) {
  div.columns-container {
    background-color: var(--color-border);
    column-count: 2;
    column-gap: 1px;
    height: 100%;
  }
  div.column {
    height: 100%;
    overflow-y: auto;
    background-color: var(--color-background);
  }
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
  border: 1px solid var(--color-border);
  border-radius: 5px;
}
</style>
