<script setup lang="ts">
import { ref } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import type { Scale } from 'scale-workshop-core'

const props = defineProps<{
  scale: Scale
}>()

const emit = defineEmits(['update:scale', 'cancel'])

const denominator = ref(128)

function modify() {
  emit('update:scale', props.scale.approximateHarmonics(denominator.value))
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
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
            class="control"
            v-model="denominator"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
