<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { evaluateCode } from '@/utils'
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import { useStageInput } from '@/rack/stage-input'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['preview', 'done', 'cancel'])

const modal = useModalStore()
const input = useStageInput()

const FORMS = {
  overtonal: {
    label: 'Overtonal',
    steps: 'elevate();simplify;map(repr)',
    write: (tones: string[]) => tones.join(':')
  },
  undertonal: {
    label: 'Undertonal',
    steps: 'reflect();elevate();simplify;map(repr)',
    write: (tones: string[]) => '/' + tones.join(':')
  },
  retroversion: {
    label: 'Retroversion',
    steps: 'retrovert();elevate();simplify;map(repr)',
    write: (tones: string[]) => `retrovert(${tones.join(':')})`
  },
  revposition: {
    label: 'Reversed overtonal',
    steps: 'revpose();elevate();simplify;map(repr)',
    write: (tones: string[]) => `revpose(${tones.join(':')})`
  }
}

/** Rewrites the input as one enumerated chord, which replaces it: baked from the input. */
function build(): GeneratorResult {
  const form = FORMS[modal.enumerateForm]
  const tones = evaluateCode(`${input.value.code}\n${form.steps}`).map((i) => i.label)
  return { source: `clear()\n${form.write(tones)}`, name: form.label, bakesInput: true }
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
      <h2>Enumerate</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Convert your scale to an enumeration.</p>
        <div class="control radio-group">
          <label>Form</label>
          <span v-for="(form, key) of FORMS" :key="key">
            <input
              type="radio"
              :id="`enumerate-${key}`"
              :value="key"
              v-model="modal.enumerateForm"
            />
            <label :for="`enumerate-${key}`">{{ form.label }}</label>
          </span>
        </div>
      </div>
    </template>
  </Modal>
</template>
