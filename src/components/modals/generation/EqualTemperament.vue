<script setup lang="ts">
import { OCTAVE } from '@/constants'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import TextSlider from '@/components/TextSlider.vue'
import { MAX_EQUAL_TEMPERAMENT_SIZE, useModalStore } from '@/stores/modal'
import { useScaleStore } from '@/stores/scale'
import { watch } from 'vue'
import { vAutoGrow } from '@/directives/auto-grow'

defineProps<{
  show: boolean
}>()

/**
 * - `preview` (source, name): live update when the card opens and on every change in it. The
 *   parent applies it to the scale without an undo step.
 * - `update:scaleName` + `update:source`: the final result on OK / Raw.
 * - `cancel`: the parent reverts any previewed changes.
 */
const emit = defineEmits<{
  preview: [source: string, name: string]
  'update:source': [source: string]
  'update:scaleName': [name: string]
  cancel: []
}>()

const scale = useScaleStore()
const modal = useModalStore()

// Double-click on the divisions slider resets to this.
const DEFAULT_DIVISIONS = 12

function setDivisions(value: number) {
  modal.divisions = value
  modal.updateFromDivisions()
}

/**
 * SonicWeave source and scale name for the card's current settings.
 * @param expand List every degree instead of the compact `tet(...)` form.
 */
function build(expand: boolean) {
  if (modal.singleStepOnly) {
    const stepCents = modal.equave.value.totalCents() / modal.divisions
    const line = stepCents.toFixed(scale.centsFractionDigits)
    return { source: line, name: `${line} cET` }
  }
  const name = `${modal.divisions} equal divisions of ${modal.equaveString}`
  let source: string
  if (modal.equave.equals(OCTAVE)) {
    const edo = modal.divisions
    if (expand || !modal.simpleEd) {
      source = modal.degrees.map((steps) => `${steps}\\${edo}`).join('\n')
    } else {
      source = `tet(${edo})`
    }
  } else {
    const ed = modal.divisions
    if (expand || !modal.simpleEd) {
      try {
        // Prefer restricted 7\13<3> form
        const ji = modal.equave.toFraction().toFraction()
        source = modal.degrees.map((steps) => `${steps}\\${ed}<${ji}>`).join('\n')
      } catch {
        // Fall back to generic 7\13 ed 1912.3456 form
        source = modal.degrees.map((steps) => `${steps}\\${ed} ed ${modal.equave}`).join('\n')
      }
    } else {
      source = `tet(${ed}, ${modal.equave})`
    }
  }
  return { source, name }
}

/**
 * The live preview, or `undefined` while the settings are mid-edit and don't describe a scale
 * yet (e.g. a half-typed degree list), so the scale isn't flooded with errors while typing.
 */
function buildPreview() {
  if (modal.singleStepOnly) {
    if (!Number.isFinite(modal.equave.value.totalCents() / modal.divisions)) {
      return undefined
    }
  } else if (!modal.degrees.length || modal.degrees.some((steps) => Number.isNaN(steps))) {
    return undefined
  }
  return build(true)
}

// Immediate: opening the card already applies its current settings (Cancel undoes that too).
watch(
  buildPreview,
  (next, previous) => {
    if (!next || (next.source === previous?.source && next.name === previous?.name)) {
      return
    }
    emit('preview', next.source, next.name)
  },
  { immediate: true }
)

function generate(expand = true) {
  const { source, name } = build(expand)
  emit('update:scaleName', name)
  emit('update:source', source)
}
</script>

<template>
  <Modal :show="show" docked @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate equal temperament</h2>
    </template>
    <template #body>
      <!-- Two columns: divisions | interval to divide, then relative steps | absolute degrees. -->
      <div class="control-group et-grid">
        <div class="control">
          <label id="divisions-label">Number of divisions</label>
          <TextSlider
            id="divisions"
            aria-labelledby="divisions-label"
            :modelValue="modal.divisions"
            :min="1"
            :max="MAX_EQUAL_TEMPERAMENT_SIZE"
            :defaultValue="DEFAULT_DIVISIONS"
            :dragScale="0.3"
            @update:modelValue="setDivisions"
          />
        </div>
        <div class="control">
          <label for="equave">Interval to divide</label>
          <ScaleLineInput
            id="equave"
            class="equave-input"
            @update:value="modal.equave = $event"
            v-model="modal.equaveString"
            :defaultValue="OCTAVE"
          />
        </div>
        <div class="control">
          <label for="jumps" :class="{ disabled: modal.singleStepOnly }">Relative steps</label>
          <textarea
            id="jumps"
            v-auto-grow
            v-model="modal.jumpsString"
            :disabled="modal.singleStepOnly"
            @input="modal.updateFromJumps"
          ></textarea>
        </div>
        <div class="control">
          <label for="degrees" :class="{ disabled: modal.singleStepOnly }">Absolute degrees</label>
          <textarea
            id="degrees"
            v-auto-grow
            v-model="modal.degreesString"
            :disabled="modal.singleStepOnly"
            @input="modal.updateFromDegrees"
          ></textarea>
        </div>
      </div>
      <div class="warning">
        <p v-if="modal.singleStepOnly">Warning: Scale will be converted to a single step.</p>
        <p v-else-if="modal.divisions !== modal.safeScaleSize">
          Warning: Scale will be capped at {{ MAX_EQUAL_TEMPERAMENT_SIZE }} notes.
        </p>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="() => generate(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="() => generate(false)" :disabled="!modal.simpleEd">Raw</button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.et-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
}
/* Fields in a row line up even if one label wraps. */
.et-grid > .control {
  align-content: end;
}
/* One line tall like the fields above; v-auto-grow adds lines as needed, then it scrolls. */
.et-grid textarea {
  width: 100%;
  min-height: 2.25rem;
  max-height: 10rem;
  resize: none;
}
/* Match the divisions slider's height so the first row lines up. */
.equave-input {
  height: 2.25rem;
  min-width: 0;
}
</style>
