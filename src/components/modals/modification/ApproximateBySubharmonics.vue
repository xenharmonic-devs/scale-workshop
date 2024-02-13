<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import type { Scale } from 'scale-workshop-core'
import { useModalStore } from '@/stores/modal'

const props = defineProps<{
  scale: Scale
}>()

const emit = defineEmits(['update:scale', 'cancel'])

const modal = useModalStore()

function modify() {
  emit('update:scale', props.scale.approximateSubharmonics(modal.largeInteger))
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Approximate by subharmonics</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="approximate-subharmonics-numerator">Numerator</label>
          <input
            id="approximate-subharmonics-numerator"
            type="number"
            min="1"
            :max="Number.MAX_SAFE_INTEGER"
            class="control"
            v-model="modal.largeInteger"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
