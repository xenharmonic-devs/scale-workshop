<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import TimeDomainVisualizer from '@/components/TimeDomainVisualizer.vue'
import Modal from '@/components/ModalDialog.vue'
import { APERIODIC_WAVEFORMS, WAVEFORMS } from '@/synth'
import { useAudioStore } from '@/stores/audio'
import { useStateStore } from '@/stores/state'
import { useScaleStore } from '@/stores/scale'

const emit = defineEmits(['panic'])

const state = useStateStore()
const scale = useScaleStore()

const audio = useAudioStore()

const remappedKey = ref('')

const timeDomainVisualizer = ref<any>(null)

const analyser = ref<AnalyserNode | null>(null)

// These really should be direct v-models, but there's
// something wrong with how input ranges are handled.
const audioDelay = computed({
  get: () => audio.audioDelay,
  set(newValue: number) {
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      audio.audioDelay = newValue
    }
  }
})

const mainVolume = computed({
  get: () => audio.mainVolume,
  set(newValue: number) {
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      audio.mainVolume = newValue
    }
  }
})

const attackTime = computed({
  get: () => audio.attackTime,
  set(newValue: number) {
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      audio.attackTime = newValue
    }
  }
})

const decayTime = computed({
  get: () => audio.decayTime,
  set(newValue: number) {
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      audio.decayTime = newValue
    }
  }
})

const sustainLevel = computed({
  get: () => audio.sustainLevel,
  set(newValue: number) {
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      audio.sustainLevel = newValue
    }
  }
})

const releaseTime = computed({
  get: () => audio.releaseTime,
  set(newValue: number) {
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      audio.releaseTime = newValue
    }
  }
})

const unisonSpread = computed({
  get: () => audio.spread,
  set(newValue: number) {
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      audio.spread = newValue
    }
  }
})

const pingPongDelayTime = computed({
  get: () => audio.pingPongDelayTime,
  set(newValue: number) {
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      audio.pingPongDelayTime = newValue
    }
  }
})

const pingPongFeedback = computed({
  get: () => audio.pingPongFeedback,
  set(newValue: number) {
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      audio.pingPongFeedback = newValue
    }
  }
})

const pingPongSeparation = computed({
  get: () => audio.pingPongSeparation,
  set(newValue: number) {
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      audio.pingPongSeparation = newValue
    }
  }
})

const pingPongGain = computed({
  get: () => audio.pingPongGain,
  set(newValue: number) {
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      audio.pingPongGain = newValue
    }
  }
})

const strokeStyle = computed(() => {
  // Add dependency.
  state.colorScheme
  // Fetch from document.
  return getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim()
})

function presetOrgan() {
  attackTime.value = 0.01
  decayTime.value = 0.15
  sustainLevel.value = 0.8
  releaseTime.value = 0.01
}

function presetPad() {
  attackTime.value = 0.5
  decayTime.value = 1.5
  sustainLevel.value = 0.5
  releaseTime.value = 0.7
}

function presetShort() {
  attackTime.value = 0.002
  decayTime.value = 0.125
  sustainLevel.value = 0.0
  releaseTime.value = 0.1
}

function presetMedium() {
  attackTime.value = 0.003
  decayTime.value = 1.5
  sustainLevel.value = 0.0
  releaseTime.value = 0.3
}

function presetLong() {
  attackTime.value = 0.005
  decayTime.value = 4
  sustainLevel.value = 0.0
  releaseTime.value = 0.8
}

function assignCode(event: KeyboardEvent) {
  if (remappedKey.value.length && event.code.length) {
    ;(state as any)[remappedKey.value] = event.code
    remappedKey.value = ''
  }
}

watch(
  () => [audio.context, audio.mainGain, timeDomainVisualizer.value],
  () => {
    if (audio.context === null || audio.mainGain === null || timeDomainVisualizer.value === null) {
      return
    }
    analyser.value = audio.context.createAnalyser()
    audio.mainGain.connect(analyser.value)
    timeDomainVisualizer.value.initialize(analyser.value)
  },
  { immediate: true }
)

onMounted(() => {
  window.addEventListener('keydown', assignCode)
})

onUnmounted(() => {
  if (audio.mainGain !== null && analyser.value !== null) {
    audio.mainGain.disconnect(analyser.value)
    analyser.value = null
  }
  window.removeEventListener('keydown', assignCode)
})
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
          <input class="control" type="range" min="0" max="0.4" step="any" v-model="mainVolume" />
          <button @click="emit('panic')" style="max-width: 12rem" title="Stop all sound at once">
            Panic
          </button>
          <div class="control radio-group">
            <label>Synth type</label>
            <span>
              <input type="radio" id="type-oscillator" value="oscillator" v-model="audio.synthType" />
              <label for="type-oscillator"> Oscillator </label>
            </span>

            <span>
              <input type="radio" id="type-unison" value="unison" v-model="audio.synthType" />
              <label for="type-unison"> Unison </label>
            </span>

            <span>
              <input type="radio" id="type-aperiodic" value="aperiodic" v-model="audio.synthType" />
              <label for="type-aperiodic"> Aperiodic </label>
            </span>
          </div>
          <template v-if="audio.synthType === 'unison'">
            <div class="control">
              <label for="stack-size">Unison stack size</label>
              <input id="stack-size" min="2" max="9" type="number" v-model="audio.stackSize">
            </div>
            <label for="unison-spread">Unison spread</label>
            <input id="unison-spread" class="control" type="range" min="0.01" max="100" step="any" v-model="unisonSpread">
          </template>
          <div class="control">
            <label for="waveform">Waveform</label>
            <select v-if="audio.synthType === 'aperiodic'" class="control" v-model="audio.aperiodicWaveform">
              <option v-for="waveform of APERIODIC_WAVEFORMS" :value="waveform" :key="waveform">
                {{ waveform }}
              </option>
            </select>
            <select v-else id="waveform" class="control" v-model="audio.waveform">
              <option v-for="waveform of WAVEFORMS" :value="waveform" :key="waveform">
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
            <input id="polyphony" type="number" min="1" max="32" v-model="audio.maxPolyphony" />
          </div>
          <hr />
          <label>Delay Effect</label>
          <label for="ping-pong-delay-time"
            >Delay time ({{ Math.floor(pingPongDelayTime * 1000) }} ms)</label
          >
          <input
            id="ping-pong-delay-time"
            class="control"
            type="range"
            min="0.01"
            max="5.0"
            step="any"
            v-model="pingPongDelayTime"
          />
          <label for="ping-pong-feedback">Feedback gain</label>
          <input
            id="ping-pong-feedback"
            class="control"
            type="range"
            min="0.0"
            max="1.0"
            step="any"
            v-model="pingPongFeedback"
          />
          <label for="ping-pong-separation">Stereo separation</label>
          <input
            id="ping-pong-separation"
            class="control"
            type="range"
            min="0.0"
            max="1.0"
            step="any"
            v-model="pingPongSeparation"
          />
          <label for="ping-pong-gain">Mix</label>
          <input
            id="ping-pong-gain"
            class="control"
            type="range"
            min="0.0"
            max="1.0"
            step="any"
            v-model="pingPongGain"
          />
          <hr />
          <label>Advanced</label>
          <label for="audio-delay">Audio delay (reduce pops)</label>
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
                v-model="scale.keyboardMode"
              />
              <label for="mode-isomorphic"> Isomorphic </label>
            </span>
            <span>
              <input type="radio" id="mode-piano" value="piano" v-model="scale.keyboardMode" />
              <label for="mode-piano"> Piano-style layers </label>
            </span>
          </div>
          <template v-if="scale.keyboardMode === 'piano'">
            <div class="control radio-group">
              <span>
                <input type="radio" id="mode-asdf" value="Asdf" v-model="scale.pianoMode" />
                <label for="mode-asdf"> White on ASDF & black on QWERTY </label>
              </span>
              <span>
                <input type="radio" id="mode-qwe-zxc" value="QweZxc" v-model="scale.pianoMode" />
                <label for="mode-zxc"> QWERTY & digits + ZXCV & ASDF separated by an equave</label>
              </span>
              <span>
                <input type="radio" id="mode-zxc" value="Zxc" v-model="scale.pianoMode" />
                <label for="mode-zxc"> ZXCV with split accidentals above</label>
              </span>
            </div>
          </template>
        </div>
        <template v-if="scale.keyboardMode === 'isomorphic'">
          <h2>Isomorphic key mapping</h2>
          <p>
            Distance between adjacent keys on the horizontal/vertical axes, in scale degrees.
            Affects virtual keyboard (and also typing keyboard if in isomorphic mode).
          </p>
          <div
            class="control-group"
            style="flex-direction: row; align-items: stretch; flex-wrap: nowrap"
          >
            <div class="control" style="width: 50%">
              <label for="vertical">Vertical</label>
              <input type="number" id="vertical" v-model="state.isomorphicVertical" />
            </div>
            <div class="control" style="width: 50%">
              <label for="horizontal">Horizontal</label>
              <input type="number" id="horizontal" v-model="state.isomorphicHorizontal" />
            </div>
          </div>
        </template>
        <template v-else>
          <h2>Accidental colors</h2>
          <p>These color(s) in your scale will be used to assemble the piano layout.</p>
          <div v-if="scale.pianoMode === 'Zxc'" class="control-group">
            <div class="control">
              <label for="high-accidental-color">high</label>
              <input type="text" id="high-accidental-color" v-model="scale.highAccidentalColor"/>
            </div>
            <div class="control">
              <label for="middle-accidental-color">Middle</label>
              <input type="text" id="middle-accidental-color" v-model="scale.middleAccidentalColor"/>
            </div>
            <div class="control">
              <label for="low-accidental-color">Low</label>
              <input type="text" id="low-accidental-color" v-model="scale.lowAccidentalColor"/>
            </div>
          </div>
          <div v-else class="control-group">
            <div class="control">
              <input type="text" id="accidental-color" v-model="scale.accidentalColor"/>
            </div>
          </div>
        </template>
        <h2>Keyboard equave shift</h2>
        <div class="control-group">
          <p>
            Trigger lower or higher notes. (Default shortcut keys: numpad
            <code>/</code> and <code>*</code>)
          </p>
          <div class="control">
            <input type="number" v-model="scale.equaveShift" />
          </div>
        </div>
        <h2>Keyboard degree shift</h2>
        <div class="control-group">
          <p>
            Shift down/up by one scale degree. (Default shortcut keys: numpad
            <code>-</code> and <code>+</code>).
          </p>
          <div class="control">
            <input type="number" v-model="scale.degreeShift" />
          </div>
        </div>
        <h2>Keyboard shortcuts</h2>
        <div class="control-group">
          <p><code>Shift</code> sustain currently held keys after release</p>
          <p>
            <code @click="remappedKey = 'deactivationCode'">{{ state.deactivationCode }}</code>
            release sustain, stop all playing notes (click to reassign)
          </p>
          <p>
            <code @click="remappedKey = 'equaveDownCode'">{{ state.equaveDownCode }}</code>
            equave shift down (click to reassign)
          </p>
          <p>
            <code @click="remappedKey = 'equaveUpCode'">{{ state.equaveUpCode }}</code>
            equave shift up (click to reassign)
          </p>
          <p>
            <code @click="remappedKey = 'degreeDownCode'">{{ state.degreeDownCode }}</code>
            degree shift down (click to reassign)
          </p>
          <p>
            <code @click="remappedKey = 'degreeUpCode'">{{ state.degreeUpCode }}</code>
            degree shift up (click to reassign)
          </p>
        </div>
      </div>
    </div>
    <Teleport to="body">
      <Modal :show="remappedKey.length > 0" @confirm="remappedKey = ''" @cancel="remappedKey = ''">
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
