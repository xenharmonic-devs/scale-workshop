<script setup lang="ts">
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import { ref } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import { debounce, expandCode } from '@/utils'
import { evaluateExpression } from 'sonic-weave/parser'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['preview', 'update:source', 'update:scaleName', 'cancel'])

const scaleData = ref('')
const total = ref('1/1')

function computeTotal() {
  const source = scaleData.value + '\nstr(sanitize(prod($)))'
  try {
    total.value = evaluateExpression(source) as string
  } catch {
    /* empty */
  }
}

const updateTotal = debounce(computeTotal)

function build(expand: boolean): GeneratorResult | undefined {
  if (!scaleData.value.trim()) {
    return undefined
  }
  const source = scaleData.value + '\nstack()'
  return { source: expand ? expandCode(source) : source, name: 'Custom steps' }
}

useGeneratorPreview(
  () => build(false),
  (result) => emit('preview', result)
)

function generate(expand = true) {
  const source = scaleData.value + '\nstack()'
  emit('update:scaleName', 'Custom steps')
  emit('update:source', expand ? expandCode(source) : source)
}
</script>

<template>
  <Modal :show="show" embedded @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Stack relative scale steps</h2>
    </template>
    <template #body>
      <div class="control-group">
        <h3>Scale data</h3>
        <div class="control">
          <textarea
            rows="20"
            v-model="scaleData"
            placeholder="9/8&#10;10/9&#10;6/5&#10;10/9&#10;6/5"
            @input="updateTotal"
          ></textarea>
        </div>
        <label>Total: {{ total }}</label>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="() => generate(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="() => generate(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>
