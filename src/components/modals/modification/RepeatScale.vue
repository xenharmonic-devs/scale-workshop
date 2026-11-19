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
  code += `\nrepeat(${modal.numRepeats})`
  return { source: code.trim(), name: `× ${modal.numRepeats}` }
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
      <h2>Repeat scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Repeatedly stack the scale on top of itself.</p>
        <div class="control">
          <label for="num-repeats">Number of repeats</label>
          <input type="number" id="num-repeats" min="0" step="1" v-model="modal.numRepeats" />
        </div>
      </div>
    </template>
  </Modal>
</template>
