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

const maxDenominator = computed(() => {
  let maxRatio = 1
  for (const ratio of input.value.scale.intervalRatios) {
    maxRatio = Math.max(maxRatio, Math.abs(ratio), 1 / Math.abs(ratio))
  }
  return Math.floor(Number.MAX_SAFE_INTEGER / maxRatio)
})

const error = computed(() => {
  let result = 0
  for (const ratio of input.value.scale.intervalRatios) {
    const approximand = Math.abs(ratio * modal.largeInteger)
    const harmonic = Math.round(approximand)
    result = Math.max(result, Math.abs(valueToCents(approximand / harmonic)))
  }
  return result
})

function build(): GeneratorResult {
  let code = ''
  code += `\ntoHarmonics(${modal.largeInteger})`
  return { source: code.trim(), name: `Harmonics up to ${modal.largeInteger}` }
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
        <p>Error: {{ error.toFixed(5) }} c</p>
      </div>
    </template>
  </Modal>
</template>
