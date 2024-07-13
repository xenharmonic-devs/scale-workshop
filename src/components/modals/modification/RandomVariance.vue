<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { useScaleStore } from '@/stores/scale'
import { centString } from '@/utils'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['done', 'cancel'])

const modal = useModalStore()
const scale = useScaleStore()

function modify(expand = true) {
  scale.sourceText += `\nrandomVariance(${centString(modal.varianceAmount)}, ${modal.varyEquave})\ncents(£, ${scale.centsFractionDigits})`
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
      <h2>Random variance</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Add random amount of detuning to each note of the scale</p>
        <div class="control">
          <label for="amount">Maximum variance in cents</label>
          <input type="number" id="amount" min="0" step="0.1" v-model="modal.varianceAmount" />
        </div>
        <div class="control checkbox-container">
          <input id="vary-equave" type="checkbox" v-model="modal.varyEquave" />
          <label for="vary-equave">Vary the {{ scale.nameOfEquave }}</label>
        </div>
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
