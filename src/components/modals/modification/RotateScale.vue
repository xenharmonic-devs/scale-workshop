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
  code += `\nrotate(${modal.newUnison + 1})`
  return { source: code.trim(), name: `Degree ${modal.newUnison} as the new unison` }
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
      <h2>Rotate</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <p>Rotate the mode of your scale.</p>
          <label for="new-unison">New 1/1</label>
          <select id="new-unison" class="control" v-model="modal.newUnison">
            <option v-for="(label, i) of input.labels" :key="i" :value="i">
              {{ label }}
            </option>
          </select>
        </div>
      </div>
    </template>
  </Modal>
</template>
