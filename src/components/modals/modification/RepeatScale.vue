<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { useScaleStore } from '@/stores/scale'

const emit = defineEmits(['done', 'cancel'])

const modal = useModalStore()
const scale = useScaleStore()

function modify(expand = true) {
  scale.sourceText += `\nrepeat(${modal.numRepeats})`
  if (expand) {
    const { visitor, defaults } = scale.getUserScopeVisitor()
    scale.sourceText = visitor.expand(defaults)
  }
  scale.computeScale()
  emit('done')
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
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
    <template #footer>
      <div class="btn-group">
        <button @click="modify(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="modify(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>
