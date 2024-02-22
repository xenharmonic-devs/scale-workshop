<script setup lang="ts">
import { computed } from 'vue';

const TAGLINES = [
  ["Because there are more than 12 notes.", "Sean Archibald"],
  ["Electric Tunaloo", ""],
  ["Powered by SonicWeave", ""],
  ["We are friends now, right?", "dotu_mtr"],
  ["Any JI scale is a NEJI if you're brave enough.", "fredg999"],
  ["Ranting about ordinals is such a 0st world problem...", "Lumi Pakkanen"],
];

const tagline = computed(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)])
</script>

<template>
  <div class="about">
    <img alt="Scale Workshop logo" class="logo" src="@/assets/logo.svg" width="100" height="100" />
    <h1>Scale Workshop 3</h1>
    <blockquote :class="{cited: !!tagline[1]}">{{ tagline[0] }}</blockquote>
    <cite v-if="tagline[1]">&mdash; {{ tagline[1] }}</cite>
    <div class="control-group">
      <div class="control centered">
        <a
          class="btn"
          href="https://github.com/xenharmonic-devs/scale-workshop/wiki"
          target="_blank"
          >User guide</a
        >
        <a class="btn" href="https://discord.gg/9nFzvpHJWn">Discord</a>
        <a class="btn" href="https://github.com/xenharmonic-devs/scale-workshop">GitHub</a>
        <a class="btn" href="https://github.com/xenharmonic-devs/scale-workshop/issues"
          >Report an issue</a
        >
      </div>
    </div>
    <hr />
    <div id="contributors">
      <h2>Contributors</h2>
      <p>
        Lumi Pakkanen - <i>lead developer</i><br />
        Sevish - <i>UI/UX designer</i><br />
        Vincenzo Sicurella - <i>developer</i><br />
        Lajos Mészáros - <i>developer</i><br />
        Forrest Cahoon - <i>developer</i> <br />
        Videco - <i>developer</i> <br />
        Inthar - <i>developer</i> <br />
        Kraig Grady - <i>lattice advisor</i>
        Kite Giedraitis - <i>notation advisor</i>
        Scott Dakota - <i>lattice advisor / generator sequence advisor</i>
      </p>
    </div>
  </div>
</template>

<style scoped>
.about {
  height: 100vh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.centered {
  justify-content: center;
}
.cited::before {
  content: open-quote;
}
.cited::after {
  content: close-quote;
}
hr {
  width: 100%;
  margin-bottom: 1rem;
}
.about > * {
  max-width: 30rem;
}
#contributors h2 {
  border: unset;
  text-align: center;
}
</style>
