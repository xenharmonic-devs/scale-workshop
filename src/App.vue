<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { RouterLink, RouterView, useRouter, type LocationQuery } from 'vue-router'
import { NEWLINE_TEST } from '@/constants'
import { ScaleWorkshopOneData } from '@/scale-workshop-one'
import type { Input, Output } from 'webmidi'
import { MidiIn, midiKeyInfo, MidiOut } from 'xen-midi'
import { Keyboard, type CoordinateKeyboardEvent } from 'isomorphic-qwerty'
import { decodeQuery, encodeQuery, type DecodedState } from '@/url-encode'
import { debounce } from '@/utils'
import { version } from '../package.json'
import { useAudioStore } from '@/stores/audio'
import { useStateStore } from './stores/state'
import { useMidiStore } from './stores/midi'

// === Pinia-managed state ===
const audio = useAudioStore()
const state = useStateStore()
const midi = useMidiStore()

// == URL path handling ==
/**
 * Strip away base path such as /scaleworkshop-dev/
 */
function getPath(url: URL) {
  return url.pathname.slice(import.meta.env.BASE_URL.length)
}

// == State encoding ==
const router = useRouter()

// Flags to prevent infinite decode - watch - encode loops
let justEncodedUrl = false
let justDecodedUrl = false

// Debounced to stagger navigation loops if the flags fail
const encodeState = debounce(() => {
  // Navigation loop prevention
  if (justDecodedUrl) {
    justDecodedUrl = false
    return
  }
  justEncodedUrl = true

  const decodedState: DecodedState = {
    scaleName: state.scaleName,
    scaleLines: state.scaleLines,
    baseFrequency: state.scale.baseFrequency,
    baseMidiNote: state.baseMidiNote,
    keyColors: state.keyColors,
    isomorphicHorizontal: state.isomorphicHorizontal,
    isomorphicVertical: state.isomorphicVertical,
    keyboardMode: state.keyboardMode,
    pianoMode: state.pianoMode,
    equaveShift: state.equaveShift,
    degreeShift: state.degreeShift,
    waveform: audio.waveform,
    attackTime: audio.attackTime,
    decayTime: audio.decayTime,
    sustainLevel: audio.sustainLevel,
    releaseTime: audio.releaseTime,
    pingPongDelayTime: audio.pingPongDelayTime,
    pingPongFeedback: audio.pingPongFeedback,
    pingPongSeparation: audio.pingPongSeparation,
    pingPongGain: audio.pingPongGain
  }

  const query = encodeQuery(decodedState) as LocationQuery
  query.version = version

  // XXX: There are some sporadic issues with useRoute().fullPath
  // so we use native URL.pathname.
  const url = new URL(window.location.href)

  router.push({ path: getPath(url), query })
}, 200)

watch(
  () => [
    state.scaleName,
    state.scaleLines,
    state.scale.baseFrequency,
    state.baseMidiNote,
    state.keyColors,
    state.isomorphicHorizontal,
    state.isomorphicVertical,
    state.keyboardMode,
    state.pianoMode,
    state.equaveShift,
    state.degreeShift,
    audio.waveform,
    audio.attackTime,
    audio.decayTime,
    audio.sustainLevel,
    audio.releaseTime,
    audio.pingPongDelayTime,
    audio.pingPongFeedback,
    audio.pingPongSeparation,
    audio.pingPongGain
  ],
  encodeState
)

// == State decoding ==
router.afterEach((to, from) => {
  if (to.fullPath === from.fullPath) {
    return
  }
  // Navigation loop prevention
  if (justEncodedUrl) {
    justEncodedUrl = false
    return
  }

  // XXX: There are some sporadic issues with useRoute().fullPath
  // so we use native URL.searchParams.
  const url = new URL(window.location.href)
  const query = url.searchParams
  if (query.has('version')) {
    try {
      const decodedState = decodeQuery(query)
      justDecodedUrl = true

      state.scaleName = decodedState.scaleName
      state.scale.baseFrequency = decodedState.baseFrequency
      state.baseMidiNote = decodedState.baseMidiNote
      state.keyColors = decodedState.keyColors
      state.isomorphicHorizontal = decodedState.isomorphicHorizontal
      state.isomorphicVertical = decodedState.isomorphicVertical
      state.keyboardMode = decodedState.keyboardMode
      state.pianoMode = decodedState.pianoMode
      state.scaleLines = decodedState.scaleLines
      state.equaveShift = decodedState.equaveShift
      state.degreeShift = decodedState.degreeShift
      audio.waveform = decodedState.waveform
      audio.attackTime = decodedState.attackTime
      audio.decayTime = decodedState.decayTime
      audio.sustainLevel = decodedState.sustainLevel
      audio.releaseTime = decodedState.releaseTime
      audio.pingPongDelayTime = decodedState.pingPongDelayTime
      audio.pingPongFeedback = decodedState.pingPongFeedback
      audio.pingPongSeparation = decodedState.pingPongSeparation
      audio.pingPongGain = decodedState.pingPongGain
    } catch (error) {
      console.error(`Error parsing version ${query.get('version')} URL`, error)
    }
  }
})

// === Tuning table highlighting ===
// We use hacks to bypass Vue state management for real-time gains
function tuningTableKeyOn(index: number) {
  if (index >= 0 && index < 128) {
    let tuningTableRow = (window as any).TUNING_TABLE_ROWS[index]
    if (tuningTableRow === undefined) {
      tuningTableRow = { heldKeys: 0, element: null }
    }
    tuningTableRow.heldKeys++
    if (tuningTableRow.element?._rawValue) {
      tuningTableRow.element._rawValue.classList.add('active')
    }
    ;(window as any).TUNING_TABLE_ROWS[index] = tuningTableRow
  }
  // Virtual keyboard state is too complex so we take the performance hit.
  state.heldNotes.set(index, (state.heldNotes.get(index) ?? 0) + 1)
}

function tuningTableKeyOff(index: number) {
  if (index >= 0 && index < 128) {
    let tuningTableRow = (window as any).TUNING_TABLE_ROWS[index]
    if (tuningTableRow === undefined) {
      tuningTableRow = { heldKeys: 0, element: null }
    }
    tuningTableRow.heldKeys--
    if (tuningTableRow.element?._rawValue) {
      if (!tuningTableRow.heldKeys) {
        tuningTableRow.element._rawValue.classList.remove('active')
      }
      ;(window as any).TUNING_TABLE_ROWS[index] = tuningTableRow
    }
  }
  state.heldNotes.set(index, Math.max(0, (state.heldNotes.get(index) ?? 0) - 1))
}

// === MIDI input / output ===

const midiOut = computed(() => new MidiOut(midi.output as Output, midi.outputChannels))

function sendNoteOn(frequency: number, rawAttack: number) {
  const midiOff = midiOut.value.sendNoteOn(frequency, rawAttack)

  if (audio.synth === null || audio.virtualSynth === null) {
    return midiOff
  }

  // Trigger web audio API synth.
  const synthOff = audio.synth.noteOn(frequency, rawAttack / 127)

  // Trigger virtual synth for per-voice visualization.
  const virtualOff = audio.virtualSynth.voiceOn(frequency)

  const off = (rawRelease: number) => {
    midiOff(rawRelease)
    synthOff()
    virtualOff()
  }

  return off
}

function midiNoteOn(index: number, rawAttack?: number) {
  if (rawAttack === undefined) {
    rawAttack = 80
  }
  let frequency = state.frequencies[index]
  if (!midi.velocityOn) {
    rawAttack = 80
  }

  // Store state to ensure consistent note off.
  const info = midiKeyInfo(index)
  const whiteMode = midi.whiteMode
  const indices = state.whiteIndices

  if (whiteMode === 'off') {
    tuningTableKeyOn(index)
  } else if (whiteMode === 'simple') {
    if (info.whiteNumber === undefined) {
      frequency = NaN
    } else {
      info.whiteNumber += state.whiteModeOffset
      frequency = state.getFrequency(info.whiteNumber)
      tuningTableKeyOn(info.whiteNumber)
    }
  } else if (whiteMode === 'blackAverage') {
    if (info.whiteNumber === undefined) {
      info.flatOf += state.whiteModeOffset
      info.sharpOf += state.whiteModeOffset
      frequency = Math.sqrt(state.getFrequency(info.flatOf) * state.getFrequency(info.sharpOf))
      tuningTableKeyOn(info.flatOf)
      tuningTableKeyOn(info.sharpOf)
    } else {
      info.whiteNumber += state.whiteModeOffset
      frequency = state.getFrequency(info.whiteNumber)
      tuningTableKeyOn(info.whiteNumber)
    }
  } else if (whiteMode === 'keyColors') {
    if (indices.length) {
      if (info.whiteNumber === undefined) {
        // Use a black key if available
        index = indices[info.sharpOf] + 1
        // Eliminate duplicates
        if (index === indices[info.sharpOf + 1]) {
          frequency = NaN
        } else {
          frequency = state.getFrequency(index)
          tuningTableKeyOn(index)
        }
      } else {
        index = indices[info.whiteNumber]
        frequency = state.getFrequency(index)
        tuningTableKeyOn(index)
      }
    } else {
      frequency = NaN
    }
  }

  if (isNaN(frequency)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (rawRelease?: number) => {}
  }

  const noteOff = sendNoteOn(frequency, rawAttack)
  return (rawRelease?: number) => {
    if (rawRelease === undefined) {
      rawRelease = 80
    }
    if (!midi.velocityOn) {
      rawRelease = 80
    }
    if (whiteMode === 'simple') {
      if (info.whiteNumber !== undefined) {
        tuningTableKeyOff(info.whiteNumber)
      }
    } else if (whiteMode === 'blackAverage') {
      if (info.whiteNumber === undefined) {
        tuningTableKeyOff(info.flatOf)
        tuningTableKeyOff(info.sharpOf)
      } else {
        tuningTableKeyOff(info.whiteNumber)
      }
    } else {
      tuningTableKeyOff(index)
    }
    noteOff(rawRelease)
  }
}

const midiInputChannels = reactive(new Set([1]))

const midiIn = new MidiIn(midiNoteOn, midiInputChannels)

const RESERVED_MESSAGES = ['noteon', 'noteoff', 'pitchbend']
watch(
  () => midi.input,
  (newValue, oldValue) => {
    if (oldValue !== null) {
      midiIn.unlisten(oldValue as Input)
    }
    if (newValue !== null) {
      midiIn.listen(newValue as Input)

      // Pass everything else through and distrubute among the channels
      ;(newValue as Input).addListener('midimessage', (event) => {
        if (!RESERVED_MESSAGES.includes(event.message.type) && midi.output !== null) {
          if (event.message.isChannelMessage) {
            if (midiInputChannels.has(event.message.channel)) {
              const status = event.message.statusByte & 0b11110000
              for (const channel of midi.outputChannels) {
                const data = [...event.message.data]
                data[0] = status | (channel - 1)
                midi.output.send(data)
              }
            }
          } else {
            midi.output.send(event.message)
          }
        }
      })
    }
  }
)

// === Virtual and typing keyboard ===
function keyboardNoteOn(index: number) {
  tuningTableKeyOn(index)
  const noteOff = sendNoteOn(state.getFrequency(index), 80)
  function keyOff() {
    tuningTableKeyOff(index)
    return noteOff(80)
  }
  return keyOff
}

// === Typing keyboard state ===
function windowKeydownOrUp(event: KeyboardEvent | MouseEvent) {
  // Audio context must be initialized as a response to user gesture
  audio.initialize()

  const target = event.target
  // Keep typing activated while adjusting sliders
  if (target instanceof HTMLInputElement && ['range', 'radio', 'checkbox'].includes(target.type)) {
    state.typingActive = true
    return
  }
  // Disable typing for other types of input elements
  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement
  ) {
    state.typingActive = false
  } else {
    state.typingActive = true
  }
}

// === Handle special keys ===
function windowKeydown(event: KeyboardEvent) {
  // Currently editing the scale, bail out
  if (!state.typingActive) {
    return
  }

  // Disable browser specific features like quick find on Firefox,
  // but allow normal copy & paste.
  if (!event.ctrlKey && !event.altKey && !event.metaKey) {
    event.preventDefault()
  }

  // The key left of Digit1 releases sustained keys
  if (event.code === state.deactivationCode) {
    typingKeyboard.deactivate()
    return
  }

  // "Octave" keys
  if (event.code === state.equaveUpCode) {
    state.equaveShift++
    return
  }
  if (event.code === state.equaveDownCode) {
    state.equaveShift--
    return
  }

  // "Transpose" keys
  if (event.code === state.degreeUpCode) {
    state.degreeShift++
    return
  }
  if (event.code === state.degreeDownCode) {
    state.degreeShift--
    return
  }

  typingKeyboard.keydown(event)
}

// Keyups don't make new sounds so they can be passed through.
function windowKeyup(event: KeyboardEvent) {
  typingKeyboard.keyup(event)
}

// === Typing keyboard input ===
const typingKeyboard = new Keyboard()

function emptyKeyup() {}

function typingKeydown(event: CoordinateKeyboardEvent) {
  // Key not mapped to layers, bail out
  if (event.coordinates === undefined) {
    return emptyKeyup
  }

  const [x, y, z] = event.coordinates

  // Key not in the layer with digits and letters, bail out
  if (z !== 1) {
    return emptyKeyup
  }

  let index = state.baseMidiNote + state.scale.size * state.equaveShift

  if (state.keyboardMode === 'isomorphic') {
    index += state.degreeShift + x * state.isomorphicHorizontal + (2 - y) * state.isomorphicVertical
  } else {
    if (state.keyboardMapping.has(event.code)) {
      index = state.keyboardMapping.get(event.code)!
    } else {
      // No user mapping for the key, bail out
      return emptyKeyup
    }
  }

  return keyboardNoteOn(index)
}

// === Lifecycle ===
onMounted(() => {
  window.addEventListener('keyup', windowKeyup)
  window.addEventListener('keydown', windowKeydownOrUp)
  window.addEventListener('keyup', windowKeydownOrUp)
  window.addEventListener('mousedown', windowKeydownOrUp)
  window.addEventListener('keydown', windowKeydown)
  window.addEventListener('touchstart', audio.initialize)
  typingKeyboard.addKeydownListener(typingKeydown)

  const url = new URL(window.location.href)
  const query = url.searchParams

  // Special handling for the empty app state so that
  // the browser's back button can undo to the clean state.
  if (![...query.keys()].length) {
    router.push({ path: getPath(url), query: { version } })
  }
  // Scale Workshop 1 compatibility
  else if (!query.has('version')) {
    try {
      const scaleWorkshopOneData = new ScaleWorkshopOneData()

      state.scaleName = scaleWorkshopOneData.name
      state.scale.baseFrequency = scaleWorkshopOneData.freq
      state.baseMidiNote = scaleWorkshopOneData.midi
      state.isomorphicHorizontal = scaleWorkshopOneData.horizontal
      state.isomorphicVertical = scaleWorkshopOneData.vertical
      if (scaleWorkshopOneData.colors !== undefined) {
        state.keyColors = scaleWorkshopOneData.colors.split(' ')
      }

      if (scaleWorkshopOneData.data !== undefined) {
        // Check that the scale is valid by attempting a parse
        scaleWorkshopOneData.parseTuningData()
        // Store raw text lines
        state.scaleLines = scaleWorkshopOneData.data.split(NEWLINE_TEST)
      }

      audio.waveform = scaleWorkshopOneData.waveform || 'semisine'
      audio.attackTime = scaleWorkshopOneData.attackTime
      audio.decayTime = scaleWorkshopOneData.decayTime
      audio.sustainLevel = scaleWorkshopOneData.sustainLevel
      audio.releaseTime = scaleWorkshopOneData.releaseTime
    } catch (error) {
      console.error('Error parsing version 1 URL', error)
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', windowKeydown)
  window.removeEventListener('keyup', windowKeyup)
  window.removeEventListener('keydown', windowKeydownOrUp)
  window.removeEventListener('keyup', windowKeydownOrUp)
  window.removeEventListener('mousedown', windowKeydownOrUp)
  window.removeEventListener('touchstart', audio.initialize)
  typingKeyboard.removeEventListener(typingKeydown)
  if (midi.input !== null) {
    midi.input.removeListener()
  }
  audio.unintialize()
})

function panic() {
  console.log('Firing global key off.')
  typingKeyboard.deactivate()
  midiIn.deactivate()
  if (midi.output !== null) {
    midi.output.sendAllNotesOff({
      channels: [...midi.outputChannels]
    })
  }
  if (audio.synth !== null) {
    audio.synth.allNotesOff()
  }
}
</script>

<template>
  <nav id="app-navigation">
    <ul id="app-tabs">
      <li>
        <RouterLink to="/about"><strong>Sw</strong></RouterLink>
      </li>
      <li><RouterLink to="/">Build Scale</RouterLink></li>
      <li><RouterLink to="/analysis">Analysis</RouterLink></li>
      <li><RouterLink to="/lattice">Lattice</RouterLink></li>
      <li><RouterLink to="/vk">Virtual Keyboard</RouterLink></li>
      <li v-if="state.showVirtualQwerty">
        <RouterLink to="/qwerty">Virtual QWERTY</RouterLink>
      </li>
      <li><RouterLink to="/synth">Synth</RouterLink></li>
      <li><RouterLink to="/midi">MIDI I/O</RouterLink></li>
      <li><RouterLink to="/prefs">Preferences</RouterLink></li>
    </ul>
    <div id="app-tray" class="hidden-sm">
      <ul>
        <template v-if="state.typingActive">
          <li title="Type on your computer keyboard to hear the synth">
            <span class="typing-info active">Key</span>
          </li>
        </template>
        <template v-else>
          <li title="Synth will not respond to keypresses until you click outside the input field">
            <span class="typing-info">Key</span>
          </li>
        </template>
      </ul>
    </div>
  </nav>
  <RouterView
    :noteOn="keyboardNoteOn"
    :midiInputChannels="midiInputChannels"
    :typingKeyboard="typingKeyboard"
    @panic="panic"
  />
</template>

<style>
@import '@/assets/base.css';

#app {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100vh;
}

nav#app-navigation {
  flex: 0 0 auto;
  display: flex;
}

#app > main {
  flex: 1 1 auto;
  overflow-y: hidden;
}

/* Navigation tabs */
nav#app-navigation {
  background-color: var(--color-accent);
  color: white;
  max-width: 100%;
  overflow-x: auto;
}
ul#app-tabs {
  padding: 0px;
  margin: 0px;
  white-space: nowrap;
}
nav#app-navigation ul li {
  list-style-type: none;
  display: inline-block;
}
nav#app-navigation ul li a {
  display: inline-block;
  padding: 0.75rem 1rem;
  color: white;
  text-decoration: none;
  cursor: default;
}

nav#app-navigation ul#app-tabs li a:hover {
  background-color: var(--color-accent-deeper);
}

nav#app-navigation ul#app-tabs li a.router-link-exact-active,
nav#app-navigation ul#app-tabs li a.router-link-exact-active:hover {
  background-color: var(--color-background);
  color: var(--color-text);
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

/* Status indicator tray */
#app-tray {
  width: 100%;
  text-align: right;
  cursor: default;
}

#app-tray ul {
  display: inline-block;
  padding: 0.75rem 1rem;
  background-color: var(--color-accent-deeper);
}

#app-tray ul li {
  color: var(--color-accent);
}

#app-tray ul li .active {
  color: var(--color-accent-text);
}
</style>
