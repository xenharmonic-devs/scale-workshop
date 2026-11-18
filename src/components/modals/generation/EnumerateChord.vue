<script setup lang="ts">
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import Modal from '@/components/ModalDialog.vue'
import { expandCode } from '@/utils'
import { useModalStore } from '@/stores/modal'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['preview', 'update:source', 'update:scaleName', 'cancel'])

const modal = useModalStore()

function build(expand: boolean): GeneratorResult {
  const chordParts = modal.chordIntervals.map((i) => i.toString())
  let source = chordParts.join(':')
  const equalDivisions = Math.max(1, Math.round(modal.equalDivisions))
  let chordTitle = modal.chord
  if (modal.retrovertChord) {
    if (chordParts.length === 1) {
      source = `retrovert(${source})`
    } else {
      const retrovertChord = [...chordParts].reverse().join(':')
      source = `/${retrovertChord}`
      chordTitle = `/${retrovertChord}`
    }
  }
  let name = `Chord ${chordTitle}`
  if (equalDivisions !== 1) {
    source += `\ninterpolate(${equalDivisions})`
    name = `Chord ${equalDivisions}ED(${chordTitle})`
  }
  return { source: expand ? expandCode(source) : source, name }
}

// Wait for a chord rather than wiping the scale.
useGeneratorPreview(
  () => (modal.chord.trim() ? build(true) : undefined),
  (result) => emit('preview', result)
)

function generate(expand = true) {
  try {
    const { source, name } = build(expand)
    emit('update:scaleName', name)
    emit('update:source', source)
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message)
    } else {
      alert(error)
    }
  }
}
</script>

<template>
  <Modal :show="show" docked @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Enumerate chord</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="chord">Chord</label>
          <input
            id="chord"
            type="text"
            class="control"
            placeholder="4:5:6:8"
            v-model="modal.chord"
          />
        </div>
        <div class="control checkbox-container">
          <input type="checkbox" id="integrate-period" v-model="modal.retrovertChord" />
          <label for="integrate-period">Retrovert chord (negative harmony)</label>
        </div>
        <div class="control">
          <label for="chord-equal-divisions">Equal divisions</label>
          <input
            id="chord-equal-divisions"
            type="number"
            min="1"
            step="1"
            class="control"
            v-model="modal.equalDivisions"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="() => generate(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="() => generate(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>
