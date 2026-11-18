<script setup lang="ts">
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import Modal from '@/components/ModalDialog.vue'
import { clamp } from 'xen-dev-utils/core'
import { useModalStore } from '@/stores/modal'
import { expandCode } from '@/utils'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['preview', 'update:source', 'update:scaleName', 'cancel'])

const modal = useModalStore()

function build(expand: boolean): GeneratorResult {
  const denominator = Math.max(1, Math.round(modal.lowInteger))
  const greatestNumerator = clamp(
    denominator + 1,
    denominator + 1000,
    Math.round(modal.highInteger)
  )
  let source = `${denominator}::${greatestNumerator}`
  const equalDivisions = Math.max(1, Math.round(modal.equalDivisions))
  const titleRange = `${denominator}-${greatestNumerator}`
  let name = `Harmonics ${titleRange}`
  if (equalDivisions !== 1) {
    source += `\ninterpolate(${equalDivisions})`
    name = `Harmonics ${equalDivisions}ED(${titleRange})`
  }
  if (expand) {
    source = expandCode(source)
  }
  return { source, name }
}

useGeneratorPreview(
  () => build(false),
  (result) => emit('preview', result)
)

function generate(expand = true) {
  const { source, name } = build(expand)
  emit('update:scaleName', name)
  emit('update:source', source)
}
</script>

<template>
  <Modal :show="show" embedded @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate harmonic series segment</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="lowest-harmonic">Lowest harmonic</label>
          <input
            id="lowest-harmonic"
            type="number"
            min="1"
            class="control"
            v-model="modal.lowInteger"
          />
        </div>
        <div class="control">
          <label for="highest-harmonic">Highest harmonic</label>
          <input
            id="highest-harmonic"
            type="number"
            min="1"
            class="control"
            v-model="modal.highInteger"
          />
        </div>
        <div class="control">
          <label for="harmonic-equal-divisions">Equal divisions</label>
          <input
            id="harmonic-equal-divisions"
            type="number"
            min="1"
            step="1"
            class="control"
            v-model="modal.equalDivisions"
          />
        </div>
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
