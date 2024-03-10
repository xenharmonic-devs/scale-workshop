<script setup lang="ts">
import { useScaleStore } from '@/stores/scale'
import { debounce } from '@/utils'
import { ref } from 'vue'
import ScaleRule from './ScaleRule.vue'
import palette from '@/character-palette.json'

const scale = useScaleStore()

const updateScale = debounce(scale.computeScale)

const sourceEditor = ref<HTMLTextAreaElement | null>(null)

const paletteInfo = ref('')

function updatePaletteInfo(event: Event) {
  const character = (event.target as HTMLButtonElement).textContent!
  paletteInfo.value = (palette as Record<string, string>)[character] ?? ''
}

function clearPaletteInfo() {
  paletteInfo.value = ''
}

function insertFromPalette(event: Event) {
  if (!sourceEditor.value) {
    return
  }
  const character = (event.target as HTMLButtonElement).textContent
  const start = sourceEditor.value.selectionStart
  const end = sourceEditor.value.selectionEnd
  scale.sourceText =
    scale.sourceText.substring(0, start) +
    character +
    scale.sourceText.substring(end, scale.sourceText.length)
}

function focus() {
  if (!sourceEditor.value) {
    return
  }
  sourceEditor.value.focus()
}

defineExpose({ focus, clearPaletteInfo })
</script>

<template>
  <div class="control-group">
    <div class="control">
      <label for="base-midi-note">MIDI note for base frequency</label>
      <input
        id="base-midi-note"
        type="number"
        step="1"
        v-model="scale.baseMidiNote"
        @input="updateScale"
      />
    </div>
    <div class="control">
      <label for="enharmonic">Pythagorean enharmonic</label>
      <select id="enharmonic" v-model="scale.enharmonic" @input="updateScale">
        <option v-for="e of scale.enharmonics" :key="e" :value="e">{{ e }}</option>
      </select>
    </div>

    <div class="control">
      <label for="base-frequency">Base frequency</label>
      <input
        id="base-frequency"
        type="number"
        step="any"
        v-model="scale.baseFrequency"
        :disabled="scale.autoFrequency"
        @input="updateScale"
      />
    </div>
    <div class="control checkbox-container">
      <input
        id="auto-frequency"
        type="checkbox"
        v-model="scale.autoFrequency"
        @input="updateScale"
      /><label for="auto-frequency">Automatic base frequency</label>
    </div>
    <div class="control radio-group">
      <label>Automatic Colors</label>
      <span>
        <input
          type="radio"
          id="colors-silver"
          value="silver"
          v-model="scale.autoColors"
          @input="updateScale"
        />
        <label for="colors-silver"> Silver </label>
      </span>

      <span>
        <input
          type="radio"
          id="colors-cents"
          value="cents"
          v-model="scale.autoColors"
          @input="updateScale"
        />
        <label for="colors-cents"> Cents </label>
      </span>

      <span>
        <input
          type="radio"
          id="colors-factors"
          value="factors"
          v-model="scale.autoColors"
          @input="updateScale"
        />
        <label for="colors-factors"> Factors </label>
      </span>
    </div>
  </div>

  <div class="control-group">
    <h2>Scale data</h2>
    <div class="control">
      <textarea
        ref="sourceEditor"
        rows="20"
        v-model="scale.sourceText"
        @input="updateScale"
        @focus="clearPaletteInfo"
      ></textarea>
    </div>
    <ScaleRule :scale="scale.scale" />
    <p class="error">{{ scale.error }}</p>
    <h3>Character palette</h3>
    <div class="control">
      <button
        v-for="(_, character, i) of palette"
        :key="i"
        @click="insertFromPalette"
        @mouseenter="updatePaletteInfo"
      >
        {{ character }}
      </button>
    </div>
    <p class="info" v-html="paletteInfo"></p>
  </div>
</template>

<style scoped>
.info {
  height: 3em;
  overflow-y: hidden;
}
</style>
