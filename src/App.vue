<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { NEWLINE_TEST } from "./constants";
import { ScaleWorkshopOneData } from "./scaleWorkshopOne";

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
    @update:scaleName="scaleName = $event"
    @update:scaleLines="scaleLines = $event"
    @update:baseMidiNote="baseMidiNote = $event"
    @update:baseFrequency="baseFrequency = $event"
    @update:keyColors="keyColors = $event"
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
