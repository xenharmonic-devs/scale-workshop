<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import type { Scale } from 'scale-workshop-core'
import { useModalStore } from '@/stores/modal'

const props = defineProps<{
  show: boolean
  scale: Scale
}>()

const emit = defineEmits(['update:scale', 'cancel'])

const modal = useModalStore()

function modify() {
  emit('update:scale', props.scale.approximateEqualTemperament(modal.largeDivisions))
}
</script>

<template>
  <Modal :show="show" @confirm="modify" @cancel="$emit('cancel')">
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
  </Modal>
</template>
