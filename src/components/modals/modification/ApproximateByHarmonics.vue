<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import type { Scale } from 'scale-workshop-core'
import { useModalStore } from '@/stores/modal'
import { computed } from 'vue'
import { centsToValue } from 'xen-dev-utils'

const props = defineProps<{
  show: boolean
  scale: Scale
}>()

const emit = defineEmits(['update:scale', 'cancel'])

const modal = useModalStore()

const maxDenominator = computed(() => {
  let maxCents = 0
  for (let i = 0; i < props.scale.size; ++i) {
    maxCents = Math.max(Math.abs(props.scale.getCents(i)))
  }
  return Math.floor(Number.MAX_SAFE_INTEGER / centsToValue(maxCents))
})

function modify() {
  emit('update:scale', props.scale.approximateHarmonics(modal.largeInteger))
}
</script>

<template>
  <Modal :show="show" @confirm="modify" @cancel="$emit('cancel')">
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
  </Modal>
</template>
