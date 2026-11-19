<script setup lang="ts">
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import { useStageInput } from '@/rack/stage-input'
import { computed } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { arrayToString } from '@/utils'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['preview', 'done', 'cancel'])

const input = useStageInput()
const modal = useModalStore()

const numDeRoots = computed(() => {
  if (!modal.selected.size) {
    return 0
  }
  return Math.min(...modal.selected.values())
})

const displayedEquaveDegree = computed(() => {
  return input.value.scale.size + numDeRoots.value
})

const mode = computed(() => {
  if (!modal.selected.size) {
    return '(nothing selected)'
  }
  const degrees = [...modal.selected.values()]
  degrees.sort((a, b) => a - b)
  degrees.push(displayedEquaveDegree.value)
  const result = []
  for (let i = 1; i < degrees.length; ++i) {
    result.push(degrees[i] - degrees[i - 1])
  }
  return result.map((gap) => gap.toString()).join(', ')
})

const degrees = computed(() => {
  if (!modal.selected.size) {
    return '(nothing selected)'
  }
  const degrees = [...modal.selected.values()]
  degrees.sort((a, b) => a - b)
  return (
    degrees.map((degree) => degree.toString()).join(', ') + `, (${displayedEquaveDegree.value})`
  )
})

function build(): GeneratorResult {
  let code = ''
  const subset = [...modal.selected.values()]
  subset.sort((a, b) => a - b)
  code += `\nsubset(${arrayToString(subset)})`
  return { source: code.trim(), name: `${modal.selected.size} degrees kept` }
}

useGeneratorPreview(
  build,
  (result) => emit('preview', result),
  () => input.value.code
)
</script>

<template>
  <Modal :show="show" embedded>
    <template #header>
      <h2>Take subset</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Select a subset from the current scale.</p>
        <label>Selected intervals</label>
        <div class="control">
          <button
            v-for="(_, i) of input.scale.size"
            :key="i"
            class="degree"
            :class="{ selected: modal.selected.has(i) }"
            @click="modal.toggleSelected(i)"
          >
            {{ i === 0 ? '(root)' : input.labels[i - 1] }}
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
.degree:not(.selected):hover {
  background-color: var(--color-accent-deepest);
}
</style>
