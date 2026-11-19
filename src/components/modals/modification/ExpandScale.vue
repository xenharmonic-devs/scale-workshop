<script setup lang="ts">
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import { useStageInput } from '@/rack/stage-input'
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['preview', 'done', 'cancel'])

const input = useStageInput()
const modal = useModalStore()

function build(): GeneratorResult {
  let code = ''
  if (modal.simplify) {
    code += '\nsimplify'
  }
  if (modal.bleach) {
    code += '\nbleach'
  }
  return {
    source: code.trim(),
    name:
      [modal.simplify ? 'Simplified' : '', modal.bleach ? 'bleached' : '']
        .filter(Boolean)
        .join(', ') || 'Unchanged'
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
      <h2>Expand</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Expand your scale to individual lines.</p>
        <div class="control checkbox-container">
          <input type="checkbox" id="simplify" v-model="modal.simplify" />
          <label for="simplify">Remove formatting</label>
        </div>
        <div class="control checkbox-container">
          <input type="checkbox" id="bleach" v-model="modal.bleach" />
          <label for="bleach">Remove colors and labels</label>
        </div>
      </div>
    </template>
  </Modal>
</template>
