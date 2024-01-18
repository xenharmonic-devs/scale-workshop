<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import type { Scale } from 'scale-workshop-core'
import { useModalStore } from '@/stores/modal'

const props = defineProps<{
  scale: Scale
}>()

const emit = defineEmits(['update:scale', 'cancel'])

const modal = useModalStore()

const mode = computed(() => {
  const degrees = [...modal.selected.values()]
  degrees.sort((a, b) => a - b)
  degrees.push(props.scale.size)
  const result = []
  for (let i = 1; i < degrees.length; ++i) {
    result.push(degrees[i] - degrees[i - 1])
  }
  return result.map((gap) => gap.toString()).join(', ')
})

const degrees = computed(() => {
  const degrees = [...modal.selected.values()]
  degrees.sort((a, b) => a - b)
  degrees.shift()
  return degrees.map((degree) => degree.toString()).join(', ') + `, (${props.scale.size})`
})

function modify() {
  const subset = [...modal.selected.values()]
  subset.sort((a, b) => a - b)
  emit('update:scale', props.scale.subset(subset))
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Take subset</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Select a subset from the current scale.</p>
        <label>Selected intervals</label>
        <div class="control">
          <button
            v-for="i of props.scale.size - 1"
            :key="i"
            class="degree"
            :class="{ selected: modal.selected.has(i) }"
            @click="modal.toggleSelected(i)"
          >
            {{ scale.getName(i) }}
          </button>
        </div>
        <div class="control"><label>Mode </label>{{ mode }}</div>
        <div class="control"><label>Degrees </label>{{ degrees }}</div>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.degree.selected {
  color: var(--color-accent-text);
  background-color: var(--color-accent);
}
.degree.selected:hover {
  background-color: var(--color-accent-deeper);
}
</style>
