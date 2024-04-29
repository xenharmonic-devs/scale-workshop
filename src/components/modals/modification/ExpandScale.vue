<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { useScaleStore } from '@/stores/scale'

const emit = defineEmits(['done', 'cancel'])

const scale = useScaleStore()
const modal = useModalStore()

function modify() {
  if (modal.simplify) {
    scale.sourceText += ';simplify'
  }
  if (modal.bleach) {
    scale.sourceText += ';bleach'
  }
  const { visitor, defaults } = scale.getUserScopeVisitor()
  scale.sourceText = visitor.expand(defaults)
  scale.computeScale()
  emit('done')
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Expand</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Expand your scale to individual lines.</p>
        <div class="control checkbox-container">
          <input type="checkbox" id="simplify" v-model="modal.simplify" />
          <label for="simplify">Remove formatting</label>
        </div>
        <div class="control checkbox-container">
          <input type="checkbox" id="bleach" v-model="modal.bleach" />
          <label for="bleach">Remove colors and labels</label>
        </div>
      </div>
    </template>
  </Modal>
</template>
