<script setup lang="ts">
import { computed } from 'vue'

const TAGLINES = [
  ['Because there are more than 12 notes.', 'Sean Archibald'],
  ['Electric Tunaloo', ''],
  ['Powered by TypeScript', ''],
  ['Powered by Vue', ''],
  ['Powered by SonicWeave', ''],
  ['We are friends now, right?', 'dotuXil'],
  ["Any JI scale is a NEJI if you're brave enough.", 'fredg999'],
  ['Ranting about ordinals is such a 0st world problem...', 'Lumi Pakkanen'],
  ['You should put spoob in the credits as well.', 'Puhts'],
  ['yknow, if you just changed how long a second is, everything can become 432hz', 'Ropal'],
  ['some eyes are exotemperaments', 'akselai'],

  ['Also Try Scala!', ''],
  ['Also Try XenPaper!', ''],
  ['Also Try Xen-calc!', '']
]

const tagline = computed(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)])
</script>

<template>
  <div class="about">
    <img alt="Scale Workshop logo" class="logo" src="@/assets/logo.svg" width="100" height="100" />
    <h1>Scale Workshop 3</h1>
    <blockquote :class="{ cited: !!tagline[1] }">{{ tagline[0] }}</blockquote>
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
        Wilckerson Ganda - <i>developer</i> <br />
        Marc Sabat - <i>developer / notation-hardware advisor</i> <br />
        Arsenii 0.5° - <i>developer</i> <br />
        Kraig Grady - <i>lattice advisor</i> <br />
        Abnormality - <i>quality assurance</i> <br />
        Kite Giedraitis - <i>notation advisor</i> <br />
        Scott Dakota - <i>lattice advisor / generator sequence advisor</i> <br />
        Richie Greene - <i>quality assurance</i> <br />
        Akselai - <i>quality assurance</i> <br />
        <span class="spoob">Spoob<img src="@/assets/img/spoob.png" /></span> -
        <i>emotional support</i>
      </p>
    </div>
    <hr />
    <div id="documentation">
      <h2>Documentation</h2>
      <p>
        The programming language used to create scales is called
        <a href="https://github.com/xenharmonic-devs/sonic-weave">SonicWeave</a>. See the project's
        <a href="https://github.com/xenharmonic-devs/sonic-weave/blob/main/documentation/dsl.md"
          >DSL documentation</a
        >
        to learn more.
      </p>
    </div>
    <hr />
    <div id="about">
      <h2>About Scale Workshop</h2>
      <p>Scale Workshop is MIT licensensed open source.</p>
      <p>
        Feel free to check out the
        <a href="https://github.com/xenharmonic-devs/scale-workshop">source code on GitHub</a>. You
        are free to modify and sell copies of the software as allowed by the
        <a href="https://opensource.org/license/mit">MIT license</a>.
      </p>
      <p>
        Many of the xenharmonic utilities used by the project are published on
        <a href="https://www.npmjs.com/">npm</a>. See
        <a href="https://github.com/xenharmonic-devs/">Xenharmonic Developer's GitHub profile</a>
        for the source code.
      </p>
    </div>
  </div>
</template>

<style scoped>
.about {
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
#contributors,
#documentation {
  margin-bottom: 1em;
}

h2 {
  border: unset;
  text-align: center;
}
.spoob > img {
  display: none;
}
.spoob:hover > img {
  display: inline;
  position: absolute;
  bottom: 0;
  z-index: 1;
}
</style>
