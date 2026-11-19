<script setup lang="ts">
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import { useStageInput } from '@/rack/stage-input'
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { computed } from 'vue'
import { valueToCents } from 'xen-dev-utils/conversion'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['preview', 'done', 'cancel'])

const modal = useModalStore()
const input = useStageInput()

const error = computed(() => {
  let result = 0
  for (const ratio of input.value.scale.intervalRatios) {
    const denominator = Math.round(modal.largeInteger / ratio)
    const approximation = modal.largeInteger / denominator
    result = Math.max(result, Math.abs(valueToCents(Math.abs(approximation / ratio))))
  }
  return result
})

function build(): GeneratorResult {
  let code = ''
  code += `\ntoSubharmonics(${modal.largeInteger})`
  return { source: code.trim(), name: `Subharmonics down to 1/${modal.largeInteger}` }
}

useGeneratorPreview(
  build,
  (result) => emit('preview', result),
  () => input.value.code
)
</script>

<template>
  <Modal :show="show" embedded>
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
  </Modal>
</template>
