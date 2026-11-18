<script setup lang="ts">
import { useScaleStore } from '@/stores/scale'
import { debounce, midiNoteNumberToName } from '@/utils'
import { ref } from 'vue'
import ScaleRule from './ScaleRule.vue'
import palette from '@/character-palette.json'

const scale = useScaleStore()

/**
 * Scale data is output only for now: the Build Scale rack writes it. Hand edits (and the
 * character palette that helps with them) come back with custom editing later.
 */
const SCALE_DATA_EDITABLE = false

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
      <span class="midi-name">{{
        midiNoteNumberToName(scale.baseMidiNote, -1, scale.accidentalPreference)
      }}</span>
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
        aria-label="Undo latest scale data edit"
        :disabled="scale.history.undoDisabled"
        @click="scale.history.undo"
      ></button>
      <button
        class="redo"
        aria-label="Redo latest scale data edit"
        :disabled="scale.history.redoDisabled"
        @click="scale.history.redo"
      ></button>
    </h2>
    <div class="control">
      <label class="sr-only" for="scale-data">Scale data editor</label>
      <textarea
        id="scale-data"
        aria-label="Scale data editor"
        ref="sourceEditor"
        rows="20"
        :readonly="!SCALE_DATA_EDITABLE"
        v-model="scale.sourceText"
        @input="updateScale()"
        @focus="clearPaletteInfo"
      ></textarea>
    </div>
    <ScaleRule :scale="scale.scale" orientation="horizontal" />
    <p v-if="scale.error" class="error">{{ scale.error }}</p>
    <p v-else-if="scale.warning" class="warning">{{ scale.warning }}</p>
    <template v-if="SCALE_DATA_EDITABLE">
      <h3>Character palette</h3>
      <div class="control">
        <button
          v-for="(_, character) of palette"
          :key="character"
          @click="insertFromPalette"
          @mouseenter="updatePaletteInfo"
        >
          {{ character }}
        </button>
      </div>
      <p class="info" v-html="paletteInfo"></p>
    </template>
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
.midi-name {
  width: 1em;
  margin-left: 0.4em;
  margin-right: 0.4em;
}
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

p.error,
p.warning {
  max-height: 12em;
  overflow-y: auto;
}
</style>
