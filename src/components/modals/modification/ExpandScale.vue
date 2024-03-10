<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { useScaleStore } from '@/stores/scale'
import { ref } from 'vue'

const emit = defineEmits(['done', 'cancel'])

const scale = useScaleStore()

// TODO: Move to modal store
const simplify = ref(false)
const bleach = ref(false)

function modify() {
  if (simplify.value) {
    scale.sourceText += ';simplify'
  }
  if (bleach.value) {
    scale.sourceText += ';bleach'
  }
  const { visitor, defaults } = scale.getVisitors()
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
          <input type="checkbox" id="simplify" v-model="simplify" />
          <label for="simplify"> Remove formatting</label>
        </div>
        <div class="control checkbox-container">
          <input type="checkbox" id="bleach" v-model="bleach" />
          <label for="bleach"> Remove colors and labels</label>
        </div>
      </div>
    </template>
  </Modal>
</template>
