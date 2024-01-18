<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from '@/constants'
import Modal from '@/components/ModalDialog.vue'
import { clamp } from 'xen-dev-utils'
import { Scale } from 'scale-workshop-core'
import { useModalStore } from '@/stores/modal'

const emit = defineEmits(['update:scale', 'update:scaleName', 'cancel'])

const modal = useModalStore()

function generate() {
  const clampedTone = Math.round(clamp(1, 1000000000, modal.guideTone))
  const scale = Scale.fromEulerGenus(clampedTone, modal.integerEquave, DEFAULT_NUMBER_OF_COMPONENTS)
  let name = `Euler-Fokker genus ${clampedTone}`
  if (modal.integerEquave !== 2) {
    name += `<${modal.integerEquave}>`
  }
  emit('update:scaleName', name)
  emit('update:scale', scale)
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate Euler-Fokker genus</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="guide-tone">Guide Tone</label>
          <input
            id="guide-tone"
            type="number"
            min="1"
            max="1000000000"
            class="control"
            v-model="modal.guideTone"
          />
        </div>
        <div class="control">
          <label for="equave">Equave</label>
          <input id="equave" type="number" min="2" class="control" v-model="modal.integerEquave" />
        </div>
      </div>
    </template>
  </Modal>
</template>
