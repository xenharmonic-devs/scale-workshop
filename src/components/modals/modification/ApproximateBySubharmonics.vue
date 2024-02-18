<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { useScaleStore } from '@/stores/scale';
import { computed } from 'vue';
import { valueToCents } from 'xen-dev-utils';

const emit = defineEmits(['done', 'cancel'])

const modal = useModalStore()
const scale = useScaleStore()

const error = computed(() => {
  let result = 0;
  for (const ratio of scale.scale.intervalRatios) {
    const denominator = Math.round(modal.largeInteger / ratio)
    const approximation = modal.largeInteger / denominator
    result = Math.max(result, Math.abs(valueToCents(Math.abs(approximation / ratio))))
  }
  return result;
});

function modify(expand = true) {
  scale.sourceText += `\ntoSubharmonics(${modal.largeInteger})`
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
        <p>Error: {{ error.toFixed(5) }} c</p>
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
