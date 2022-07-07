Interval
<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { RouterLink, RouterView } from "vue-router";
import type { Input, Output } from "webmidi";
import { NEWLINE_TEST, NUMBER_OF_NOTES } from "@/constants";
import { ScaleWorkshopOneData } from "@/scale-workshop-one";
import Scale from "@/scale";
import { parseLine } from "@/parser";
import { bendRangeInSemitones, MidiIn, MidiOut } from "@/midi";
import { Keyboard, type CoordinateKeyboardEvent } from "@/keyboard";
import type { Interval } from "@/interval";

// === Application state ===
const scaleName = ref("");
const scaleLines = ref<string[]>([]);
const scale = reactive(Scale.fromIntervalArray([parseLine("1/1")]));
const baseMidiNote = ref(69);
const keyColors = ref([
  "white",
  "black",
  "white",
  "white",
  "black",
  "white",
  "black",
  "white",
  "white",
  "black",
  "white",
  "black",
]);
const isomorphicVertical = ref(5);
const isomorphicHorizontal = ref(1);
// TODO: Implement user preferences and make cents precision configurable
const centsFractionDigits = ref(3);
const decimalFractionDigits = ref(5);
const equaveShift = ref(0);
const typingActive = ref(true);
const midiInput = ref<Input | null>(null);
const midiOutput = ref<Output | null>(null);

// === Computed state ===
const frequencies = computed(() =>
  [...Array(NUMBER_OF_NOTES).keys()].map((i) =>
    scale.getFrequency(i - baseMidiNote.value)
  )
);

function updateFromScaleLines(lines: string[]) {
  scaleLines.value = lines;
  const intervals: Interval[] = [];
  lines.forEach((line) => {
    try {
      const interval = parseLine(line);
      intervals.push(interval);
    } catch {}
  });
  if (!intervals.length) {
    intervals.push(parseLine("1/1"));
  }

  const surrogate = Scale.fromIntervalArray(intervals);
  scale.intervals = surrogate.intervals;
  scale.equave = surrogate.equave;
}

function updateFromScale(surrogate: Scale) {
  scale.intervals = surrogate.intervals;
  scale.equave = surrogate.equave;
  scaleLines.value = scale.toStrings();
}

// ===  Version 1 backwards compatibility ===
try {
  const scaleWorkshopOneData = new ScaleWorkshopOneData();

  scaleName.value = scaleWorkshopOneData.name;
  scale.baseFrequency = scaleWorkshopOneData.freq;
  baseMidiNote.value = scaleWorkshopOneData.midi;
  isomorphicHorizontal.value = scaleWorkshopOneData.horizontal;
  isomorphicVertical.value = scaleWorkshopOneData.vertical;

  if (scaleWorkshopOneData.colors !== undefined) {
    keyColors.value = scaleWorkshopOneData.colors.split(" ");
  }

  if (scaleWorkshopOneData.data !== undefined) {
    // Check that the scale is valid by attempting a parse
    scaleWorkshopOneData.parseTuningData();
    // Store raw text lines
    updateFromScaleLines(scaleWorkshopOneData.data.split(NEWLINE_TEST));
  }
} catch (error) {
  console.error("Error parsing URL", error);
}

// === MIDI input / output ===
function getFrequency(index: number) {
  if (index >= 0 && index < frequencies.value.length) {
    return frequencies.value[index];
  } else {
    // Support more than 128 notes with some additional computational cost
    return scale.getFrequency(index - baseMidiNote.value);
  }
}

const midiOut = computed(() => {
  return new MidiOut(midiOutput.value as Output);
});

function sendNoteOn(frequency: number, rawAttack: number) {
  return midiOut.value.sendNoteOn(frequency, rawAttack);
}

const midiIn = new MidiIn(getFrequency, sendNoteOn);

watch(midiInput, (newValue, oldValue) => {
  if (oldValue !== null) {
    oldValue.removeListener();
  }
  if (newValue !== null) {
    newValue.addListener("noteon", midiIn.noteOn.bind(midiIn));
    newValue.addListener("noteoff", midiIn.noteOff.bind(midiIn));
  }
});

watch(midiOutput, (newValue) => {
  if (newValue !== null) {
    newValue.channels[1].sendPitchBendRange(bendRangeInSemitones, 0);
  }
});

// === Virtual and typing keyboard ===
function keyboardNoteOn(index: number) {
  const noteOff = sendNoteOn(getFrequency(index), 80);
  function keyOff() {
    return noteOff(80);
  }
  return keyOff;
}

// === Typing keyboard state ===
function windowKeydownOrUp(event: KeyboardEvent | MouseEvent) {
  const target = event.target;
  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement
  ) {
    typingActive.value = false;
  } else {
    typingActive.value = true;
  }
}

// === Typing keyboard input ===
const typingKeyboad = new Keyboard();

function emptyKeyup() {}

function typingKeydown(event: CoordinateKeyboardEvent) {
  // Currently editing the scale, bail out
  if (!typingActive.value) {
    return emptyKeyup;
  }
  // The key left of Digit1 releases sustained keys
  if (event.code === "Backquote") {
    typingKeyboad.deactivate();
    return emptyKeyup;
  }

  // "Octave" keys
  if (event.code === "NumpadMultiply") {
    equaveShift.value++;
    return emptyKeyup;
  }
  if (event.code === "NumpadDivide") {
    equaveShift.value--;
    return emptyKeyup;
  }

  // Key not mapped to layers, bail out
  if (event.coordinates === undefined) {
    return emptyKeyup;
  }

  const [x, y, z] = event.coordinates;

  // Key not in the layer with digits and letters, bail out
  if (z !== 1) {
    return emptyKeyup;
  }

  const index =
    baseMidiNote.value +
    scale.size * equaveShift.value +
    x * isomorphicHorizontal.value +
    (2 - y) * isomorphicVertical.value;

  return keyboardNoteOn(index);
}

// === Lifecycle ===
onMounted(() => {
  window.addEventListener("keydown", windowKeydownOrUp);
  window.addEventListener("keyup", windowKeydownOrUp);
  window.addEventListener("mousedown", windowKeydownOrUp);
  typingKeyboad.addKeydownListener(typingKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", windowKeydownOrUp);
  window.removeEventListener("keyup", windowKeydownOrUp);
  window.removeEventListener("mousedown", windowKeydownOrUp);
  typingKeyboad.removeEventListener(typingKeydown);
  if (midiInput.value !== null) {
    midiInput.value.removeListener();
  }
});
</script>

<template>
  <nav id="app-navigation">
    <ul>
      <li><RouterLink to="/about">Scale Workshop</RouterLink></li>
      <li><RouterLink to="/">Build Scale</RouterLink></li>
      <li><RouterLink to="/analysis">Analysis</RouterLink></li>
      <li><RouterLink to="/vk">Virtual Keyboard</RouterLink></li>
      <li><RouterLink to="/synth">Synth</RouterLink></li>
      <li><RouterLink to="/midi">MIDI I/O</RouterLink></li>
      <li><RouterLink to="/prefs">Preferences</RouterLink></li>
      <li><RouterLink to="/guide">User Guide</RouterLink></li>
      <span class="typing-info"
        >Keyboard
        <template v-if="typingActive">
          enabled <i>(press QWERTY keys to play)</i>
        </template>
        <template v-else> disabled <i>(click to enable)</i> </template>
      </span>
    </ul>
  </nav>
  <RouterView
    :scaleName="scaleName"
    :scaleLines="scaleLines"
    :baseMidiNote="baseMidiNote"
    :keyColors="keyColors"
    :scale="scale"
    :frequencies="frequencies"
    :isomorphicHorizontal="isomorphicHorizontal"
    :isomorphicVertical="isomorphicVertical"
    :centsFractionDigits="centsFractionDigits"
    :decimalFractionDigits="decimalFractionDigits"
    :equaveShift="equaveShift"
    :midiInput="midiInput"
    :midiOutput="midiOutput"
    :noteOn="keyboardNoteOn"
    @update:scaleName="scaleName = $event"
    @update:scaleLines="updateFromScaleLines"
    @update:scale="updateFromScale"
    @update:baseMidiNote="baseMidiNote = $event"
    @update:baseFrequency="scale.baseFrequency = $event"
    @update:keyColors="keyColors = $event"
    @update:isomorphicVertical="isomorphicVertical = $event"
    @update:isomorphicHorizontal="isomorphicHorizontal = $event"
    @update:equaveShift="equaveShift = $event"
    @update:midiInput="midiInput = $event"
    @update:midiOutput="midiOutput = $event"
  />
</template>

<style>
@import "@/assets/base.css";

#app {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100vh;
}

nav#app-navigation {
  flex: 0 0 auto;
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
nav#app-navigation ul {
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

nav#app-navigation ul li a:hover {
  background-color: var(--color-accent-deeper);
}

nav#app-navigation ul li a.router-link-exact-active,
nav#app-navigation ul li a.router-link-exact-active:hover {
  background-color: white;
  color: black;
}

.logo {
  float: left;
  margin: 0;
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

.typing-info {
  background-color: var(--color-accent-deeper);
}
</style>
