<script setup lang="ts">
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import { useStageInput } from '@/rack/stage-input'
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['preview', 'done', 'cancel'])

const modal = useModalStore()
const input = useStageInput()

function build(): GeneratorResult {
  let code = ''
  const divisions = Math.max(1, Math.round(Number(modal.interpolationDivisions) || 1))
  const method = modal.interpolateLinearly ? 'interpolateLinear' : 'interpolate'
  code += `\n${method}(${divisions})`
  return {
    source: code.trim(),
    name: `${Math.max(1, Math.round(Number(modal.interpolationDivisions) || 1))} steps per step${modal.interpolateLinearly ? ', linear' : ''}`
  }
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
      <h2>Interpolate scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Insert interpolated notes between each adjacent pair of scale tones.</p>
        <div class="control">
          <label for="interpolation-divisions">Equal divisions</label>
          <input
            id="interpolation-divisions"
            type="number"
            min="1"
            step="1"
            v-model="modal.interpolationDivisions"
          />
        </div>
        <div class="control checkbox-container">
          <input type="checkbox" id="interpolate-linearly" v-model="modal.interpolateLinearly" />
          <label for="interpolate-linearly">Interpolate linearly</label>
        </div>
      </div>
    </template>
  </Modal>
</template>
