<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { computed } from 'vue'
import { useScaleStore } from '@/stores/scale';

const emit = defineEmits(['done', 'cancel'])

const modal = useModalStore()
const scale = useScaleStore()

const maxDenominator = computed(() => {
  let maxRatio = 1
  for (let i = 0; i < scale.scale.size; ++i) {
    maxRatio = Math.max(maxRatio, Math.abs(scale.scale.getRatio(i)), 1 / Math.abs(scale.scale.getRatio(i)))
  }
  return Math.floor(Number.MAX_SAFE_INTEGER / maxRatio)
})

function modify(expand = true) {
  scale.sourceText += `\ntoHarmonics(${modal.largeInteger})`
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
      <h2>Approximate by harmonics</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="approximate-harmonics-denominator">Denominator</label>
          <input
            id="approximate-harmonics-denominator"
            type="number"
            min="1"
            :max="maxDenominator"
            class="control"
            v-model="modal.largeInteger"
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
