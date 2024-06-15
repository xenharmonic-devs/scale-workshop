<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { clamp } from 'xen-dev-utils'
import { useModalStore } from '@/stores/modal'
import { expandCode } from '@/utils'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

const modal = useModalStore()

function generate(expand = true) {
  const numerator = Math.max(1, Math.round(modal.lowInteger))
  const greatestDenominator = clamp(numerator + 1, numerator + 1000, Math.round(modal.highInteger))
  let source = `/${greatestDenominator}::${numerator}`
  if (expand) {
    source = expandCode(source)
  }
  emit('update:scaleName', `Subharmonics ${numerator}-${greatestDenominator}`)
  emit('update:source', source)
}
</script>

<template>
  <Modal :show="show" @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate subharmonic series segment</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="lowest-subharmonic">Lowest subharmonic</label>
          <input
            id="lowest-subharmonic"
            type="number"
            min="1"
            class="control"
            v-model="modal.lowInteger"
          />
        </div>
        <div class="control">
          <label for="highest-subharmonic">Highest subharmonic</label>
          <input
            id="highest-subharmonic"
            type="number"
            min="1"
            class="control"
            v-model="modal.highInteger"
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
