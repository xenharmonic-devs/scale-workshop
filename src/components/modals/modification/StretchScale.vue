<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { FIFTH, FIFTH_12TET } from '@/constants'
import { useModalStore } from '@/stores/modal'
import { useScaleStore } from '@/stores/scale'
import { decimalString } from '@/utils'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['done', 'cancel'])

const modal = useModalStore()
const scale = useScaleStore()

function modify(expand = true) {
  scale.sourceText += `\nstretch(${decimalString(modal.stretchAmount)})\ncents(£, ${scale.centsFractionDigits})`
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
      <h2>Stretch/compress scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Stretch or compress the whole scale evenly.</p>
        <p>Entering 1 will cause no change; entering 2 will make every interval twice as large.</p>
        <div class="control">
          <label for="amount">Stretch ratio</label>
          <input
            class="real-valued"
            type="number"
            id="amount"
            min="0.001"
            max="999.999"
            step="0.001"
            v-model="modal.stretchAmount"
          />
        </div>
        <hr />
        <div class="control">
          <label for="reference">Reference interval</label>
          <ScaleLineInput
            id="reference"
            placeholder="7\12"
            :defaultValue="FIFTH_12TET"
            @update:value="modal.reference = $event"
            v-model="modal.referenceString"
          />
        </div>
        <div class="control">
          <label for="reference">Target interval</label>
          <ScaleLineInput
            id="reference"
            placeholder="3/2"
            :defaultValue="FIFTH"
            @update:value="modal.target = $event"
            v-model="modal.targetString"
          />
        </div>
        <div class="control">
          <label for="stretch-into">Stretch reference into target</label>
          <button @click="modal.calculateStretchAmount">Calculate</button>
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

<style scoped>
.real-valued:invalid {
  background-color: var(--color-background);
}
</style>
