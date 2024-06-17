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
  updateScale()
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
        @input="updateScale()"
      />
    </div>

    <div class="control">
      <label for="base-frequency">Base frequency</label>
      <input
        id="base-frequency"
        type="number"
        step="any"
        v-model="scale.baseFrequencyDisplay"
        :disabled="scale.autoFrequency"
        @input="updateScale()"
      />
    </div>
    <div class="control checkbox-container">
      <input
        id="auto-frequency"
        type="checkbox"
        v-model="scale.autoFrequency"
        @input="updateScale()"
      /><label for="auto-frequency">Automatic base frequency</label>
    </div>
  </div>

  <div class="control-group">
    <h2>
      <span class="scale-data-header">Scale data</span>
      <button
        class="undo"
        :disabled="scale.history.undoDisabled"
        @click="scale.history.undo"
      ></button>
      <button
        class="redo"
        :disabled="scale.history.redoDisabled"
        @click="scale.history.redo"
      ></button>
    </h2>
    <div class="control">
      <textarea
        id="scale-data"
        ref="sourceEditor"
        rows="20"
        v-model="scale.sourceText"
        @input="updateScale()"
        @focus="clearPaletteInfo"
      ></textarea>
    </div>
    <ScaleRule :scale="scale.scale" orientation="horizontal" />
    <p v-if="scale.error" class="error">{{ scale.error }}</p>
    <p v-else-if="scale.warning" class="warning">{{ scale.warning }}</p>
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
  <div class="control-group">
    <div class="control radio-group">
      <label>Automatic Colors</label>
      <span>
        <input
          type="radio"
          id="colors-silver"
          value="silver"
          v-model="scale.autoColors"
          @input="updateScale()"
        />
        <label for="colors-silver">Silver</label>
      </span>

      <span>
        <input
          type="radio"
          id="colors-cents"
          value="cents"
          v-model="scale.autoColors"
          @input="updateScale()"
        />
        <label for="colors-cents">Cents</label>
      </span>

      <span>
        <input
          type="radio"
          id="colors-factors"
          value="factors"
          v-model="scale.autoColors"
          @input="updateScale()"
        />
        <label for="colors-factors">Factors</label>
      </span>
    </div>
  </div>
</template>

<style scoped>
.info {
  height: 3em;
  overflow-y: hidden;
}
.scale-data-header {
  pointer-events: none;
  user-select: none;
}
.undo,
.redo {
  color: var(--color-text);
  background: none;
  border: none;
  margin-left: 1em;
}
.undo:disabled,
.undo:disabled:hover,
.redo:disabled,
.redo:disabled:hover {
  cursor: default;
  background: none;
  color: var(--color-text-mute);
}
</style>
