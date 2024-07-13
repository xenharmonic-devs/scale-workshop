<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from '@/constants'
import Modal from '@/components/ModalDialog.vue'
import { clamp } from 'xen-dev-utils'
import { Scale } from 'scale-workshop-core'
import { useModalStore } from '@/stores/modal'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['update:scale', 'update:scaleName', 'cancel'])

const modal = useModalStore()

function generate() {
  const denominator = Math.max(1, Math.round(modal.lowInteger))
  const greatestNumerator = clamp(
    denominator + 1,
    denominator + 1000,
    Math.round(modal.highInteger)
  )
  const scale = Scale.fromHarmonicSeries(
    denominator,
    greatestNumerator,
    DEFAULT_NUMBER_OF_COMPONENTS
  )
  emit('update:scaleName', `Harmonics ${denominator}-${greatestNumerator}`)
  emit('update:scale', scale)
}
</script>

<template>
  <Modal :show="show" @confirm="generate" @cancel="$emit('cancel')">
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
      </div>
    </template>
  </Modal>
</template>
