<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { useScaleStore } from '@/stores/scale'

const emit = defineEmits(['done', 'cancel'])

const modal = useModalStore()
const scale = useScaleStore()

function modify(expand = true) {
  scale.sourceText += `\nrotate(${modal.newUnison + 1})`
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
      <h2>Rotate</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <p>Rotate the mode of your scale.</p>
          <label for="new-unison">New 1/1</label>
          <select id="new-unison" class="control" v-model="modal.newUnison">
            <option v-for="(label, i) of scale.labels" :key="i" :value="i">
              {{ label }}
            </option>
          </select>
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
