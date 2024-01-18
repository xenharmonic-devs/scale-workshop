<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import type { Scale } from 'scale-workshop-core'
import { useModalStore } from '@/stores/modal'

const EPSILON = 1e-6

const props = defineProps<{
  scale: Scale
  centsFractionDigits: number
  decimalFractionDigits: number
}>()

const emit = defineEmits(['update:scale', 'cancel'])

const modal = useModalStore()

const equave = computed(() => {
  if (Math.abs(props.scale.equave.totalCents() - 1200) < EPSILON) {
    return 'octave'
  }
  return 'equave'
})

function modify() {
  emit(
    'update:scale',
    props.scale.vary(modal.varianceAmount, modal.varyEquave).mergeOptions({
      centsFractionDigits: props.centsFractionDigits,
      decimalFractionDigits: props.decimalFractionDigits
    })
  )
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Random variance</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Add random amount of detuning to each note of the scale</p>
        <div class="control">
          <label for="amount">Maximum variance in cents</label>
          <input type="number" id="amount" min="0" step="0.1" v-model="modal.varianceAmount" />
        </div>
        <div class="control checkbox-container">
          <input id="vary-equave" type="checkbox" v-model="modal.varyEquave" />
          <label for="vary-equave"> Vary the {{ equave }}</label>
        </div>
      </div>
    </template>
  </Modal>
</template>
