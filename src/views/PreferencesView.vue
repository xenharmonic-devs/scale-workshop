<script setup lang="ts">
import { UNIX_NEWLINE, WINDOWS_NEWLINE } from '@/constants'

import { useStateStore } from '@/stores/state'
import { useScaleStore } from '@/stores/scale'

const state = useStateStore()
const scale = useScaleStore()
</script>

<template>
  <main>
    <div class="columns-container">
      <div class="column">
        <h2>File export</h2>
        <div class="control-group">
          <div class="control">
            <label for="newline">Line endings format</label>
            <select
              id="newline"
              class="control"
              title="If your exported tuning files didn't work right on macOS synths, try changing this option to Unix."
              v-model="state.newline"
            >
              <option :value="WINDOWS_NEWLINE">Microsoft (Windows/MS-DOS)</option>
              <option :value="UNIX_NEWLINE">Unix (Mac/Linux)</option>
            </select>
          </div>
        </div>
        <h2>QWERTY layout</h2>
        <div class="control-group">
          <div class="control checkbox-container">
            <input id="has-left-of-z" type="checkbox" v-model="scale.hasLeftOfZ" />
            <label for="has-left-of-z" class="right-of-checkbox">There's a key between left Shift and 'Z'</label>
          </div>
        </div>
        <h2>Advanced</h2>
        <div class="control-group">
          <div class="control checkbox-container">
            <input id="virtual-qwerty" type="checkbox" v-model="state.showVirtualQwerty" />
            <label for="virtual-qwerty" class="right-of-checkbox">Virtual QWERTY in top menu</label>
          </div>
          <div class="control">
            <label for="gas">Computational budget (gas)</label>
            <input id="gas" type="number" min="1" v-model="scale.gas" />
          </div>
        </div>
      </div>
      <div class="column">
        <h2>Appearance</h2>
        <div class="control-group">
          <h3>Color Scheme</h3>
          <div class="control radio-group">
            <span>
              <input type="radio" id="scheme-light" value="light" v-model="state.colorScheme" />
              <label for="scheme-light" class="right-of-radio">Light </label>
            </span>
            <span>
              <input type="radio" id="scheme-dark" value="dark" v-model="state.colorScheme" />
              <label for="scheme-dark" class="right-of-radio">Dark </label>
            </span>
          </div>
          <h3>Accidentals</h3>
          <div class="control radio-group">
            <span>
              <input
                type="radio"
                id="accidentals-double"
                value="double"
                v-model="scale.accidentalPreference"
              />
              <label for="accidentals-double" class="right-of-radio">Double 𝄫/𝄪</label>
            </span>
            <span>
              <input
                type="radio"
                id="accidentals-single"
                value="single"
                v-model="scale.accidentalPreference"
              />
              <label for="accidentals-single" class="right-of-radio">Single ♭♭/♯♯</label>
            </span>
            <span>
              <input
                type="radio"
                id="accidentals-ascii"
                value="ASCII"
                v-model="scale.accidentalPreference"
              />
              <label for="accidentals-single" class="right-of-radio">ASCII bb/##</label>
            </span>
          </div>
        </div>
      </div>
      <div class="column">
        <h2>Precision</h2>
        <div class="control-group">
          <div class="control">
            <label for="cents">Cents digits after decimal point</label>
            <input
              id="cents"
              type="number"
              class="control"
              min="0"
              v-model="state.centsFractionDigits"
            />
          </div>
          <div class="control">
            <label for="decimal">Decimal digits after decimal comma</label>
            <input
              id="decimal"
              type="number"
              class="control"
              min="0"
              v-model="state.decimalFractionDigits"
            />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
div.columns-container {
  height: 100%;
  overflow-y: auto;
}
div.column {
  overflow-x: hidden;
  padding: 1rem;
}

@media screen and (min-width: 860px) {
  div.columns-container {
    background-color: var(--color-border);
    column-count: 3;
    column-gap: 1px;
    height: 100%;
  }
  div.column {
    height: 100%;
    overflow-y: auto;
    background-color: var(--color-background);
  }
}
</style>
