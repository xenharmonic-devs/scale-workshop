<script setup lang="ts">
/**
 * Synth configuration view for audio engine parameters and waveform selection.
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import TimeDomainVisualizer from '@/components/TimeDomainVisualizer.vue'
import Modal from '@/components/ModalDialog.vue'
import NumericSlider from '@/components/NumericSlider.vue'
import { APERIODIC_WAVEFORMS, WAVEFORMS } from '@/synth'
import { useAudioStore } from '@/stores/audio'
import { useStateStore } from '@/stores/state'
import { useScaleStore } from '@/stores/scale'

const emit = defineEmits(['panic'])

const state = useStateStore()
const scale = useScaleStore()

const audio = useAudioStore()

type RemappableKey =
  | 'deactivationCode'
  | 'equaveDownCode'
  | 'equaveUpCode'
  | 'degreeDownCode'
  | 'degreeUpCode'

const remappedKey = ref<RemappableKey | ''>('')

type TimeDomainVisualizerHandle = {
  initialize: (analyser: AnalyserNode) => void
}

const timeDomainVisualizer = ref<TimeDomainVisualizerHandle | null>(null)

const analyser = ref<AnalyserNode | null>(null)

const strokeStyle = computed(() => {
  const root = document.documentElement
  if (state.colorScheme) {
    return getComputedStyle(root).getPropertyValue('--color-text').trim()
  }
  return getComputedStyle(root).getPropertyValue('--color-text').trim()
})

function nudgeIsomorphicVertical(delta: number) {
  if (scale.isomorphicVertical.length !== 1) {
    return
  }
  scale.isomorphicVertical = [scale.isomorphicVertical[0] + delta]
}

function nudgeIsomorphicHorizontal(delta: number) {
  if (scale.isomorphicHorizontal.length !== 1) {
    return
  }
  scale.isomorphicHorizontal = [scale.isomorphicHorizontal[0] + delta]
}

function envPresetOrgan() {
  audio.attackTime = 0.01
  audio.decayTime = 0.15
  audio.sustainLevel = 0.8
  audio.releaseTime = 0.01
}

function envPresetPad() {
  audio.attackTime = 0.5
  audio.decayTime = 1.5
  audio.sustainLevel = 0.5
  audio.releaseTime = 0.7
}

function envPresetShort() {
  audio.attackTime = 0.01
  audio.decayTime = 0.125
  audio.sustainLevel = 0.0
  audio.releaseTime = 0.1
}

function envPresetMedium() {
  audio.attackTime = 0.01
  audio.decayTime = 1.5
  audio.sustainLevel = 0.0
  audio.releaseTime = 0.3
}

function envPresetLong() {
  audio.attackTime = 0.01
  audio.decayTime = 4
  audio.sustainLevel = 0.0
  audio.releaseTime = 0.95
}

function dlyPresetBasicMono() {
  audio.pingPongDelayTime = 0.4
  audio.pingPongFeedback = 0.45
  audio.pingPongSeparation = 0.0
  audio.pingPongGain = 0.65
}

function dlyPresetBasicStereo() {
  audio.pingPongDelayTime = 0.4
  audio.pingPongFeedback = 0.45
  audio.pingPongSeparation = 0.8
  audio.pingPongGain = 0.65
}

function dlyPresetIntense() {
  audio.pingPongDelayTime = 0.6
  audio.pingPongFeedback = 0.85
  audio.pingPongSeparation = 0.7
  audio.pingPongGain = 0.7
}

function dlyPresetElastic() {
  audio.pingPongDelayTime = 0.085
  audio.pingPongFeedback = 0.5
  audio.pingPongSeparation = 0.4
  audio.pingPongGain = 0.75
}

function dlyPresetAmbient() {
  audio.pingPongDelayTime = 0.019
  audio.pingPongFeedback = 0.625
  audio.pingPongSeparation = 0.8
  audio.pingPongGain = 0.6
}

function dlyPresetOff() {
  audio.pingPongGain = 0.0
}

function assignCode(event: KeyboardEvent) {
  const key = remappedKey.value
  if (key !== '' && event.code.length) {
    state[key] = event.code
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
          <NumericSlider
            id="volume"
            class="control"
            min="0"
            max="0.4"
            step="any"
            v-model="audio.mainVolume"
          />
          <button
            @click="emit('panic')"
            class="compact-action-button"
            title="Stop all sound at once"
          >
            Panic
          </button>
          <div class="control radio-group">
            <label>Synth type</label>
            <span>
              <input
                type="radio"
                id="type-oscillator"
                value="oscillator"
                v-model="audio.synthType"
              />
              <label for="type-oscillator">Oscillator</label>
            </span>

            <span>
              <input type="radio" id="type-unison" value="unison" v-model="audio.synthType" />
              <label for="type-unison">Unison</label>
            </span>

            <span>
              <input type="radio" id="type-aperiodic" value="aperiodic" v-model="audio.synthType" />
              <label for="type-aperiodic">Aperiodic</label>
            </span>
          </div>
          <template v-if="audio.synthType === 'unison'">
            <div class="control">
              <label for="stack-size">Unison stack size</label>
              <input id="stack-size" min="2" max="9" type="number" v-model="audio.stackSize" />
            </div>
            <label for="unison-spread">Unison spread</label>
            <NumericSlider
              id="unison-spread"
              class="control"
              min="0.01"
              max="100"
              step="any"
              v-model="audio.spread"
            />
          </template>
          <div class="control">
            <label for="waveform">Waveform</label>
            <select
              v-if="audio.synthType === 'aperiodic'"
              class="control"
              v-model="audio.aperiodicWaveform"
            >
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
          <NumericSlider
            id="attack"
            class="control"
            min="0.01"
            max="1.0"
            step="any"
            v-model="audio.attackTime"
          />
          <label for="decay">Decay time</label>
          <NumericSlider
            id="decay"
            class="control"
            min="0.01"
            max="4.0"
            step="any"
            v-model="audio.decayTime"
          />
          <label for="sustain">Sustain level</label>
          <NumericSlider
            id="sustain"
            class="control"
            min="0.0"
            max="1.0"
            step="any"
            v-model="audio.sustainLevel"
          />
          <label for="release">Release time</label>
          <NumericSlider
            id="release"
            class="control"
            min="0.01"
            max="1.0"
            step="any"
            v-model="audio.releaseTime"
          />
          <div class="btn-group">
            <label>Presets</label>
            <button @click="envPresetOrgan">Organ</button>
            <button @click="envPresetPad">Pad</button>
            <button @click="envPresetShort">Percussive (Short)</button>
            <button @click="envPresetMedium">Percussive (Medium)</button>
            <button @click="envPresetLong">Percussive (Long)</button>
          </div>
          <div class="control">
            <label for="polyphony">Max polyphony</label>
            <input id="polyphony" type="number" min="1" max="32" v-model="audio.maxPolyphony" />
          </div>
          <hr />
          <label>Delay Effect</label>
          <label for="ping-pong-delay-time"
            >Delay time ({{ Math.floor(audio.pingPongDelayTime * 1000) }} ms)</label
          >
          <NumericSlider
            id="ping-pong-delay-time"
            class="control"
            min="0.01"
            max="5.0"
            step="any"
            v-model="audio.pingPongDelayTime"
          />
          <label for="ping-pong-feedback">Feedback gain</label>
          <NumericSlider
            id="ping-pong-feedback"
            class="control"
            min="0.0"
            max="1.0"
            step="any"
            v-model="audio.pingPongFeedback"
          />
          <label for="ping-pong-separation">Stereo separation</label>
          <NumericSlider
            id="ping-pong-separation"
            class="control"
            min="0.0"
            max="1.0"
            step="any"
            v-model="audio.pingPongSeparation"
          />
          <label for="ping-pong-gain">Mix</label>
          <NumericSlider
            id="ping-pong-gain"
            class="control"
            min="0.0"
            max="1.0"
            step="any"
            v-model="audio.pingPongGain"
          />
          <button @click="dlyPresetOff" class="compact-action-button" title="Set delay mix to zero">
            Delay Off
          </button>
          <div class="btn-group">
            <label>Presets</label>
            <button @click="dlyPresetBasicMono">Basic (Mono)</button>
            <button @click="dlyPresetBasicStereo">Basic (Stereo)</button>
            <button @click="dlyPresetIntense">Intense</button>
            <button @click="dlyPresetElastic">Elastic</button>
            <button @click="dlyPresetAmbient">Ambient</button>
          </div>
          <hr />
          <label>Advanced</label>
          <label for="audio-delay">Audio delay (reduce pops)</label>
          <NumericSlider
            id="audio-delay"
            class="control"
            min="0.0"
            max="0.1"
            step="any"
            v-model="audio.audioDelay"
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
              <label for="mode-isomorphic">Isomorphic</label>
            </span>
            <span>
              <input type="radio" id="mode-piano" value="piano" v-model="scale.keyboardMode" />
              <label for="mode-piano">Piano-style layers</label>
            </span>
          </div>
          <template v-if="scale.keyboardMode === 'piano'">
            <div class="control radio-group">
              <span>
                <input type="radio" id="mode-asdf" value="Asdf" v-model="scale.pianoMode" />
                <label for="mode-asdf">White on ASDF & black on QWERTY</label>
              </span>
              <span>
                <input type="radio" id="mode-qwe-zxc" value="QweZxc" v-model="scale.pianoMode" />
                <label for="mode-qwe-zxc"
                  >QWERTY & digits + ZXCV & ASDF separated by an equave</label
                >
              </span>
              <span>
                <input type="radio" id="mode-zxc" value="Zxc" v-model="scale.pianoMode" />
                <label for="mode-zxc">ZXCV with split accidentals above</label>
              </span>
            </div>
          </template>
        </div>
        <template v-if="scale.keyboardMode === 'isomorphic'">
          <h2>Keyboard notes</h2>
          <div class="control-group keyboard-notes-options">
            <div class="control checkbox-container">
              <input id="keyboard-show-label" type="checkbox" v-model="state.showKeyboardLabel" />
              <label for="keyboard-show-label">Display label</label>
            </div>
            <div class="control checkbox-container">
              <input id="keyboard-show-cents" type="checkbox" v-model="state.showKeyboardCents" />
              <label for="keyboard-show-cents">Display cents</label>
            </div>
            <div class="control checkbox-container">
              <input id="keyboard-show-ratio" type="checkbox" v-model="state.showKeyboardRatio" />
              <label for="keyboard-show-ratio">Display ratio</label>
            </div>
            <div class="control checkbox-container">
              <input
                id="keyboard-show-frequency"
                type="checkbox"
                v-model="state.showKeyboardFrequency"
              />
              <label for="keyboard-show-frequency">Display frequency</label>
            </div>
          </div>
        </template>
        <template v-if="scale.keyboardMode === 'isomorphic'">
          <h2>Isomorphic key mapping</h2>
          <p>
            Distance between adjacent keys on the horizontal/vertical axes, in scale degrees.
            Affects virtual keyboard (and also typing keyboard if in isomorphic mode). Use
            space-separated integer lists for quasi-isomorphic repeating patterns.
          </p>
          <div class="control-group twin-controls">
            <div class="control">
              <label for="vertical">Vertical</label>
              <div class="spinner-input">
                <input type="text" id="vertical" v-model="scale.isomorphicVerticalText" />
                <div class="spinner-buttons">
                  <button
                    type="button"
                    aria-label="Increase vertical"
                    :disabled="scale.isomorphicVertical.length !== 1"
                    @click="nudgeIsomorphicVertical(1)"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="Decrease vertical"
                    :disabled="scale.isomorphicVertical.length !== 1"
                    @click="nudgeIsomorphicVertical(-1)"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
            <div class="control">
              <label for="horizontal">Horizontal</label>
              <div class="spinner-input">
                <input type="text" id="horizontal" v-model="scale.isomorphicHorizontalText" />
                <div class="spinner-buttons">
                  <button
                    type="button"
                    aria-label="Increase horizontal"
                    :disabled="scale.isomorphicHorizontal.length !== 1"
                    @click="nudgeIsomorphicHorizontal(1)"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="Decrease horizontal"
                    :disabled="scale.isomorphicHorizontal.length !== 1"
                    @click="nudgeIsomorphicHorizontal(-1)"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <h2>Accidental colors</h2>
          <p>These color(s) in your scale will be used to assemble the piano layout.</p>
          <div v-if="scale.pianoMode === 'Zxc'" class="control-group">
            <div class="control">
              <label for="high-accidental-color">high</label>
              <input type="text" id="high-accidental-color" v-model="scale.highAccidentalColor" />
            </div>
            <div class="control">
              <label for="middle-accidental-color">Middle</label>
              <input
                type="text"
                id="middle-accidental-color"
                v-model="scale.middleAccidentalColor"
              />
            </div>
            <div class="control">
              <label for="low-accidental-color">Low</label>
              <input type="text" id="low-accidental-color" v-model="scale.lowAccidentalColor" />
            </div>
          </div>
          <div v-else class="control-group">
            <div class="control">
              <input type="text" id="accidental-color" v-model="scale.accidentalColor" />
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

.compact-action-button {
  max-width: 12rem;
}

.keyboard-notes-options {
  flex-direction: row;
  flex-wrap: wrap;
}

.spinner-input {
  display: flex;
  width: 100%;
}

.spinner-input > input {
  flex: 1;
  min-width: 0;
}

.spinner-buttons {
  display: flex;
  flex-direction: column;
  margin-left: 0.25rem;
}

.spinner-buttons > button {
  line-height: 1;
  min-width: 1.75rem;
  padding: 0.15rem 0.25rem;
}
</style>
