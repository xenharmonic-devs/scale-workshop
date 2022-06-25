<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { NEWLINE_TEST, NUMBER_OF_NOTES } from "./constants";
import { ScaleWorkshopOneData } from "./scale-workshop-one";
import type { Input, Output } from "webmidi";
import Scale from "./scale";
import type ExtendedMonzo from "./monzo";
import { parseLine } from "./parser";
import { bendRangeInSemitones, MidiIn, MidiOut } from "./midi";

// Application state
const scaleName = ref("");
const scaleLines = ref<string[]>([]);
const baseFrequency = ref(440);
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
const midiInput = ref<Input | null>(null);
const midiOutput = ref<Output | null>(null);

// Computed state
const scaleAndNames = computed<[Scale, string[]]>(() => {
  const intervals: ExtendedMonzo[] = [];
  const names: string[] = [];
  scaleLines.value.forEach((line) => {
    try {
      intervals.push(parseLine(line));
      names.push(line);
    } catch {}
  });
  if (!intervals.length) {
    intervals.push(parseLine("1/1"));
    names.push("1/1");
  }
  return [Scale.fromIntervalArray(intervals, baseFrequency.value), names];
});

const frequencies = computed(() =>
  [...Array(NUMBER_OF_NOTES).keys()].map((i) =>
    scaleAndNames.value[0].getFrequency(i - baseMidiNote.value)
  )
);

// Lifecycle
onUnmounted(() => {
  if (midiInput.value !== null) {
    midiInput.value.removeListener();
  }
});

try {
  const scaleWorkshopOneData = new ScaleWorkshopOneData();

  scaleName.value = scaleWorkshopOneData.name;
  baseFrequency.value = scaleWorkshopOneData.freq;
  baseMidiNote.value = scaleWorkshopOneData.midi;
  if (scaleWorkshopOneData.colors !== undefined) {
    keyColors.value = scaleWorkshopOneData.colors.split(" ");
  }

  if (scaleWorkshopOneData.data !== undefined) {
    // Check that the scale is valid by attempting a parse
    scaleWorkshopOneData.parseTuningData();
    // Store raw text lines
    scaleLines.value = scaleWorkshopOneData.data.split(NEWLINE_TEST);
  }
} catch (error) {
  console.error("Error parsing URL", error);
}

const midiOut = computed(() => {
  return new MidiOut(midiOutput.value as Output);
});

function sendNoteOn(frequency: number, rawAttack: number) {
  return midiOut.value.sendNoteOn(frequency, rawAttack);
}

const midiIn = new MidiIn((i) => frequencies.value[i], sendNoteOn);

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
    </ul>
  </nav>
  <RouterView
    :scaleName="scaleName"
    :scaleLines="scaleLines"
    :baseFrequency="baseFrequency"
    :baseMidiNote="baseMidiNote"
    :keyColors="keyColors"
    :scale="scaleAndNames[0]"
    :names="scaleAndNames[1]"
    :frequencies="frequencies"
    :midiInput="midiInput"
    :midiOutput="midiOutput"
    @update:scaleName="scaleName = $event"
    @update:scaleLines="scaleLines = $event"
    @update:baseMidiNote="baseMidiNote = $event"
    @update:baseFrequency="baseFrequency = $event"
    @update:keyColors="keyColors = $event"
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
</style>
