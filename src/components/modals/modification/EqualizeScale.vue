<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { useScaleStore } from '@/stores/scale';

const emit = defineEmits(['done', 'cancel'])

const modal = useModalStore()
const scale = useScaleStore()

function modify(expand = true) {
  scale.sourceText += `\nequalize(${modal.largeDivisions})`
  if (expand) {
    const {visitor, defaults} = scale.getVisitors()
    scale.sourceText = visitor.expand(defaults)
  }
  scale.computeScale();
  emit('done')
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Equalize</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>
          Divides your equave into an equal number of steps, then rounds each interval in your scale
          to the nearest equal step.
        </p>
        <div class="control">
          <label for="divisions">Number of equal divisions</label>
          <input
            id="divisions"
            type="number"
            min="1"
            class="control"
            v-model="modal.largeDivisions"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="modify(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="modify(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>
