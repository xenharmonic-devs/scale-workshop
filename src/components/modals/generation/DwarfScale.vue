<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from '@/constants'
import Modal from '@/components/ModalDialog.vue'
import { clamp } from 'xen-dev-utils'
import { Scale } from 'scale-workshop-core'
import { useModalStore } from '@/stores/modal'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['update:scale', 'update:scaleName', 'cancel'])

const modal = useModalStore()

function generate() {
  const clampedVal = clamp(1, 512, modal.val)
  const scale = Scale.fromDwarf(clampedVal, modal.integerEquave, DEFAULT_NUMBER_OF_COMPONENTS)
  let name = `Dwarf scale ${clampedVal}`
  if (modal.integerEquave !== 2) {
    name += `<${modal.integerEquave}>`
  }
  emit('update:scaleName', name)
  emit('update:scale', scale)
}
</script>

<template>
  <Modal :show="show" @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate dwarf scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="val">Patent val</label>
          <input id="val" type="number" min="1" max="512" class="control" v-model="modal.val" />
        </div>
        <div class="control">
          <label for="equave">Equave</label>
          <input id="equave" type="number" min="2" class="control" v-model="modal.integerEquave" />
        </div>
      </div>
    </template>
  </Modal>
</template>
