<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { expandCode } from '@/utils'
import { useModalStore } from '@/stores/modal'

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

const modal = useModalStore()

function generate(expand = true) {
  try {
    let source = modal.chordIntervals.map((i) => i.toString()).join(':')
    emit('update:scaleName', `Chord ${modal.chord}`)
    if (modal.retrovertChord) {
      source = `retroverted(${source})`
    }
    if (expand) {
      emit('update:source', expandCode(source))
    } else {
      emit('update:source', source)
    }
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
  <Modal @confirm="generate" @cancel="$emit('cancel')">
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
