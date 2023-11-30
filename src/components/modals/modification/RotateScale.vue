<script setup lang="ts">
import { ref } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import type { Scale } from 'scale-workshop-core'
const props = defineProps<{
  scale: Scale
}>()
const emit = defineEmits(['update:scale', 'cancel'])
const newUnison = ref(1)
function modify() {
  emit('update:scale', props.scale.rotate(newUnison.value))
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
          <p>Rotates the mode of your scale.</p>
          <p>The resulting scale will be sorted in ascending order.</p>
          <label for="new-unison">New 1/1</label>
          <select id="new-unison" class="control" v-model="newUnison">
            <option v-for="i of props.scale.size - 1" :key="i" :value="i">
              {{ props.scale.getName(i) }}
            </option>
          </select>
        </div>
      </div>
    </template>
  </Modal>
</template>
