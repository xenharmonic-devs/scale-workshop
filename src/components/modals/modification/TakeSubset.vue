<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { useScaleStore } from '@/stores/scale';
import { arrayToString } from '@/utils';

const emit = defineEmits(['done', 'cancel'])

const scale = useScaleStore()
const modal = useModalStore()

const mode = computed(() => {
  const degrees = [...modal.selected.values()]
  degrees.sort((a, b) => a - b)
  degrees.push(scale.scale.size)
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
  return degrees.map((degree) => degree.toString()).join(', ') + `, (${scale.scale.size})`
})

function modify(expand = true) {
  const subset = [...modal.selected.values()]
  subset.sort((a, b) => a - b)
  scale.sourceText += `\nsubset(${arrayToString(subset)})`
  if (expand) {
    const {visitor, defaults} = scale.getVisitors()
    scale.sourceText = visitor.expand(defaults)
  }
  scale.computeScale();
  emit('done')
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
            v-for="_, i of scale.scale.size"
            :key="i"
            class="degree"
            :class="{ selected: modal.selected.has(i) }"
            @click="modal.toggleSelected(i)"
          >
            {{ scale.labels[i] }}
          </button>
        </div>
        <div class="control"><label>Mode </label>{{ mode }}</div>
        <div class="control"><label>Degrees </label>{{ degrees }}</div>
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
.degree.selected {
  color: var(--color-accent-text);
  background-color: var(--color-accent);
}
.degree.selected:hover {
  background-color: var(--color-accent-deeper);
}
</style>
