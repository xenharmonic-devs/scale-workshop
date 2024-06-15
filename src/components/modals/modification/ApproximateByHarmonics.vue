<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { computed } from 'vue'
import { useScaleStore } from '@/stores/scale'
import { valueToCents } from 'xen-dev-utils'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['done', 'cancel'])

const modal = useModalStore()
const scale = useScaleStore()

const maxDenominator = computed(() => {
  let maxRatio = 1
  for (const ratio of scale.scale.intervalRatios) {
    maxRatio = Math.max(maxRatio, Math.abs(ratio), 1 / Math.abs(ratio))
  }
  return Math.floor(Number.MAX_SAFE_INTEGER / maxRatio)
})

const error = computed(() => {
  let result = 0
  for (const ratio of scale.scale.intervalRatios) {
    const approximand = Math.abs(ratio * modal.largeInteger)
    const harmonic = Math.round(approximand)
    result = Math.max(result, Math.abs(valueToCents(approximand / harmonic)))
  }
  return result
})

function modify(expand = true) {
  scale.sourceText += `\ntoHarmonics(${modal.largeInteger})`
  if (expand) {
    const { visitor, defaults } = scale.getUserScopeVisitor()
    scale.sourceText = visitor.expand(defaults)
  }
  scale.computeScale()
  emit('done')
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
        <p>Error: {{ error.toFixed(5) }} c</p>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="modify(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="modify(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>
