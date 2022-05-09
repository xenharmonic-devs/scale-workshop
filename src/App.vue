<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <nav id="app-navigation">
    <ul>
      <li>
        <RouterLink to="/about">
          <img
            alt="Vue logo"
            class="logo"
            src="@/assets/logo.svg"
            width="25"
            height="25"
          />

          Scale Workshop
        </RouterLink>
      </li>
      <li><RouterLink to="/">Build Scale</RouterLink></li>
      <li><a href="#">Analysis</a></li>
      <li><a href="#">Virtual Keyboard</a></li>
      <li><a href="#">Synth</a></li>
      <li><a href="#">MIDI I/O</a></li>
      <li><a href="#">Preferences</a></li>
      <li><RouterLink to="/guide">User Guide</RouterLink></li>
    </ul>
  </nav>
  <RouterView />
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

.app-content-container {
  flex: 1 1 auto;
  overflow-y: hidden;
}

/* Navigation tabs */
nav#app-navigation {
  background-color: #555;
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
  padding: 1rem;
  color: white;
  text-decoration: none;
  cursor: default;
}

nav#app-navigation ul li a.router-link-exact-active {
  background-color: white;
  color: black;
}

nav#app-navigation ul li a:hover {
  background-color: #888;
}

.logo {
  display: inline-block;
  float: left;
  margin: 0;
}

a,
.green {
  text-decoration: none;
  color: hsla(160, 100%, 37%, 1);
  transition: 0.4s;
}

@media (hover: hover) {
  a:hover {
    background-color: hsla(160, 100%, 37%, 0.2);
  }
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
