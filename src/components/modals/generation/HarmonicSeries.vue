<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { clamp } from 'xen-dev-utils'
import { useModalStore } from '@/stores/modal'
import { expandCode } from '@/utils'

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

const modal = useModalStore()

function generate(expand = true) {
  const denominator = Math.max(1, Math.round(modal.lowInteger))
  const greatestNumerator = clamp(
    denominator + 1,
    denominator + 1000,
    Math.round(modal.highInteger)
  )
  let source = `${denominator}::${greatestNumerator}`
  if (expand) {
    source = expandCode(source)
  }
  emit('update:scaleName', `Harmonics ${denominator}-${greatestNumerator}`)
  emit('update:source', source)
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
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
    <template #footer>
      <div class="btn-group">
        <button @click="() => generate(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="() => generate(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>
