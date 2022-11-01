<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import TimeDomainVisualizer from "@/components/TimeDomainVisualizer.vue";
import Modal from "@/components/ModalDialog.vue";
import { BASIC_WAVEFORMS, CUSTOM_WAVEFORMS } from "@/synth";

const props = defineProps<{
  audioContext: AudioContext;
  audioOutput: AudioNode | null;
  audioDelay: number;
  mainVolume: number;
  keyboardMode: "isomorphic" | "piano";
  pianoMode: "Asdf" | "QweZxc0" | "QweZxc1";
  isomorphicHorizontal: number;
  isomorphicVertical: number;
  equaveShift: number;
  degreeShift: number;
  colorScheme: "light" | "dark";
  deactivationCode: string;
  equaveUpCode: string;
  equaveDownCode: string;
  degreeUpCode: string;
  degreeDownCode: string;
  waveform: string;
  attackTime: number;
  decayTime: number;
  sustainLevel: number;
  releaseTime: number;
  maxPolyphony: number;
  pitchBendDepthCents: number;
}>();

const emit = defineEmits([
  "update:audioDelay",
  "update:mainVolume",
  "update:keyboardMode",
  "update:pianoMode",
  "update:isomorphicHorizontal",
  "update:isomorphicVertical",
  "update:equaveShift",
  "update:degreeShift",
  "update:deactivationCode",
  "update:equaveUpCode",
  "update:equaveDownCode",
  "update:degreeUpCode",
  "update:degreeDownCode",
  "update:waveform",
  "update:attackTime",
  "update:decayTime",
  "update:sustainLevel",
  "update:releaseTime",
  "update:maxPolyphony",
  "update:pitchBendDepthCents",
  "mapAsdf",
  "mapZxcv0",
  "mapZxcv1",
  "panic",
  "pitchBend",
]);

const remappedKey = ref("");

const timeDomainVisualizer = ref<any>(null);

const analyser = ref<AnalyserNode | null>(null);

const audioDelay = computed({
  get: () => props.audioDelay,
  set(newValue: number) {
    if (typeof newValue !== "number") {
      newValue = parseFloat(newValue);
    }
    if (!isNaN(newValue)) {
      emit("update:audioDelay", newValue);
    }
  },
});

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
  set: (newValue: "isomorphic" | "piano") =>
    emit("update:keyboardMode", newValue),
});
const pianoMode = computed({
  get: () => props.pianoMode,
  set: (newValue: "Asdf" | "QweZxc0" | "QweZxc1") =>
    emit("update:pianoMode", newValue),
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

const waveforms = BASIC_WAVEFORMS.concat(Object.keys(CUSTOM_WAVEFORMS));

const waveform = computed({
  get: () => props.waveform,
  set(newValue: string) {
    emit("update:waveform", newValue);
  },
});

const attackTime = computed({
  get: () => props.attackTime,
  set(newValue: number) {
    if (typeof newValue !== "number") {
      newValue = parseFloat(newValue);
    }
    if (!isNaN(newValue)) {
      emit("update:attackTime", newValue);
    }
  },
});

const decayTime = computed({
  get: () => props.decayTime,
  set(newValue: number) {
    if (typeof newValue !== "number") {
      newValue = parseFloat(newValue);
    }
    if (!isNaN(newValue)) {
      emit("update:decayTime", newValue);
    }
  },
});

const sustainLevel = computed({
  get: () => props.sustainLevel,
  set(newValue: number) {
    if (typeof newValue !== "number") {
      newValue = parseFloat(newValue);
    }
    if (!isNaN(newValue)) {
      emit("update:sustainLevel", newValue);
    }
  },
});

const releaseTime = computed({
  get: () => props.releaseTime,
  set(newValue: number) {
    if (typeof newValue !== "number") {
      newValue = parseFloat(newValue);
    }
    if (!isNaN(newValue)) {
      emit("update:releaseTime", newValue);
    }
  },
});

const maxPolyphony = computed({
  get: () => props.maxPolyphony,
  set(newValue: number) {
    emit("update:maxPolyphony", newValue);
  },
});

const pitchBendDepthCents = computed({
  get: () => props.pitchBendDepthCents,
  set(newValue: number) {
    emit("update:pitchBendDepthCents", newValue);
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

function presetOrgan() {
  attackTime.value = 0.01;
  decayTime.value = 0.15;
  sustainLevel.value = 0.8;
  releaseTime.value = 0.01;
}

function presetPad() {
  attackTime.value = 0.5;
  decayTime.value = 1.5;
  sustainLevel.value = 0.5;
  releaseTime.value = 0.7;
}

function presetShort() {
  attackTime.value = 0.002;
  decayTime.value = 0.125;
  sustainLevel.value = 0.0;
  releaseTime.value = 0.1;
}

function presetMedium() {
  attackTime.value = 0.003;
  decayTime.value = 1.5;
  sustainLevel.value = 0.0;
  releaseTime.value = 0.3;
}

function presetLong() {
  attackTime.value = 0.005;
  decayTime.value = 4;
  sustainLevel.value = 0.0;
  releaseTime.value = 0.8;
}

function assignCode(event: KeyboardEvent) {
  if (remappedKey.value.length && event.code.length) {
    emit(("update:" + remappedKey.value) as any, event.code);
    remappedKey.value = "";
  }
}

function pitchBend(event: Event) {
  const amount = parseFloat((event.target as HTMLInputElement).value);
  if (!isNaN(amount)) {
    emit("pitchBend", amount);
  }
}

function resetBend(event: Event) {
  (event.target as HTMLInputElement).value = "0";
  emit("pitchBend", 0.0);
}

// TODO: Set pitch-bend depth or scale awareness

onMounted(() => {
  if (props.audioOutput !== null) {
    analyser.value = props.audioContext.createAnalyser();
    props.audioOutput.connect(analyser.value);
    timeDomainVisualizer.value.initialize(analyser.value);
  }
  window.addEventListener("keydown", assignCode);
});

onUnmounted(() => {
  if (props.audioOutput !== null && analyser.value !== null) {
    props.audioOutput.disconnect(analyser.value);
    analyser.value = null;
  }
  window.removeEventListener("keydown", assignCode);
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
          <label for="pitc-bend">Pitch bend</label>
          <input
            id="pitch-bend"
            class="control"
            type="range"
            value="0"
            min="-1"
            max="1"
            step="any"
            @input="pitchBend"
            @mouseup="resetBend"
          />
          <label for="pitch-bend-depth">Pitch bend depth (cents)</label>
          <input
            id="pitch-bend-depth"
            class="control"
            type="number"
            min="0"
            step="0.1"
            v-model="pitchBendDepthCents"
          />
          <label for="volume">Main volume</label>
          <input
            id="volume"
            class="control"
            type="range"
            min="0"
            max="0.4"
            step="any"
            v-model="mainVolume"
          />
          <button
            @click="emit('panic')"
            style="max-width: 12rem"
            title="Stop all sound at once"
          >
            Panic
          </button>
          <div class="control">
            <label for="waveform">Waveform</label>
            <select id="waveform" class="control" v-model="waveform">
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
            max="4.0"
            step="any"
            v-model="decayTime"
          />
          <label for="sustain">Sustain level</label>
          <input
            id="sustain"
            class="control"
            type="range"
            min="0.0"
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
          <div class="btn-group">
            <label>Presets</label>
            <button @click="presetOrgan">Organ</button>
            <button @click="presetPad">Pad</button>
            <button @click="presetShort">Percussive (Short)</button>
            <button @click="presetMedium">Percussive (Medium)</button>
            <button @click="presetLong">Percussive (Long)</button>
          </div>
          <div class="control">
            <label for="polyphony">Max polyphony</label>
            <input
              id="polyphony"
              type="number"
              min="1"
              max="32"
              v-model="maxPolyphony"
            />
          </div>
          <label for="release">Audio delay (reduce pops)</label>
          <input
            id="audio-delay"
            class="control"
            type="range"
            min="0.0"
            max="0.1"
            step="any"
            v-model="audioDelay"
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
                id="mode-piano"
                value="piano"
                v-model="keyboardMode"
              />
              <label for="mode-piano"> Piano-style layers </label>
            </span>
          </div>
          <template v-if="keyboardMode === 'piano'">
            <div class="control radio-group">
              <span>
                <input
                  type="radio"
                  id="mode-asdf"
                  value="Asdf"
                  v-model="pianoMode"
                />
                <label for="mode-asdf"> ASDF & QWERTY </label>
              </span>
              <span>
                <input
                  type="radio"
                  id="mode-qwezxc1"
                  value="QweZxc1"
                  v-model="pianoMode"
                />
                <label for="mode-qwezxc1"> ZXCV & ASDF + QWERTY & 1234 </label>
              </span>
              <span>
                <input
                  type="radio"
                  id="mode-qwezxc0"
                  value="QweZxc0"
                  v-model="pianoMode"
                />
                <label for="mode-qwezxc0"> ZXCV etc. (shifted left) </label>
              </span>
            </div>
          </template>
        </div>
        <h2>Keyboard equave shift</h2>
        <div class="control-group">
          <p>
            Trigger lower or higher notes. (Default shortcut keys: numpad
            <code>/</code> and <code>*</code>)
          </p>
          <div class="control">
            <input type="number" v-model="equaveShift" />
          </div>
        </div>
        <h2>Keyboard degree shift</h2>
        <div class="control-group">
          <p>
            Shift down/up by one scale degree. (Default shortcut keys: numpad
            <code>-</code> and <code>+</code>).
          </p>
          <div class="control">
            <input type="number" v-model="degreeShift" />
          </div>
        </div>
        <template v-if="keyboardMode === 'isomorphic'">
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
          <p>
            <code @click="remappedKey = 'deactivationCode'">{{
              deactivationCode
            }}</code>
            release sustain, stop all playing notes (click to reassign)
          </p>
          <p>
            <code @click="remappedKey = 'equaveDownCode'">{{
              equaveDownCode
            }}</code>
            equave shift down (click to reassign)
          </p>
          <p>
            <code @click="remappedKey = 'equaveUpCode'">{{
              equaveUpCode
            }}</code>
            equave shift up (click to reassign)
          </p>
          <p>
            <code @click="remappedKey = 'degreeDownCode'">{{
              degreeDownCode
            }}</code>
            degree shift down (click to reassign)
          </p>
          <p>
            <code @click="remappedKey = 'degreeUpCode'">{{
              degreeUpCode
            }}</code>
            degree shift up (click to reassign)
          </p>
        </div>
      </div>
    </div>
    <Teleport to="body">
      <Modal
        :show="remappedKey.length > 0"
        @confirm="remappedKey = ''"
        @cancel="remappedKey = ''"
      >
        <template #header>
          <h2>Press a key...</h2>
        </template>
        <template #body><div></div></template>
        <template #footer>
          <div class="btn-group">
            <button @click="remappedKey = ''">Cancel</button>
          </div>
        </template>
      </Modal>
    </Teleport>
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
