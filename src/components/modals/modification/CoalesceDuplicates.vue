<script setup lang="ts">
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import { useStageInput } from '@/rack/stage-input'
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { centString } from '@/utils'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['preview', 'done', 'cancel'])

const modal = useModalStore()
const input = useStageInput()

function build(): GeneratorResult {
  let code = ''
  code += `\ncoalesce(${centString(modal.tolerance)}, '${modal.coalescingAction}', ${modal.preserveBoundary})`
  return {
    source: code.trim(),
    name: `Within ${modal.tolerance} ¢, keeping ${modal.coalescingAction}`
  }
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
      <h2>Coalesce duplicates</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>
          Coalesce groups of intervals within the given tolerance to a single interval based on the
          given rule.
        </p>
        <div class="control">
          <label for="tolerance">Tolerance in cents</label>
          <input
            id="tolerance"
            type="number"
            min="0"
            step="0.5"
            class="control"
            v-model="modal.tolerance"
          />
        </div>
        <div class="control radio-group">
          <label>How to convert duplicates to a single interval:</label>
          <label>Keep (which)</label>
          <span>
            <input
              type="radio"
              id="action-simplest"
              value="simplest"
              v-model="modal.coalescingAction"
            />
            <label for="action-simplest">Simplest</label>
          </span>

          <span>
            <input
              type="radio"
              id="action-lowest"
              value="lowest"
              v-model="modal.coalescingAction"
            />
            <label for="action-lowest">Lowest</label>
          </span>

          <span>
            <input
              type="radio"
              id="action-highest"
              value="highest"
              v-model="modal.coalescingAction"
            />
            <label for="action-highest">Highest</label>
          </span>
          <label>Replace with (which) average</label>
          <span>
            <input type="radio" id="action-avg" value="avg" v-model="modal.coalescingAction" />
            <label for="action-avg">Arithmetic</label>
          </span>
          <span>
            <input type="radio" id="action-havg" value="havg" v-model="modal.coalescingAction" />
            <label for="action-havg">Harmonic</label>
          </span>
          <span>
            <input
              type="radio"
              id="action-geoavg"
              value="geoavg"
              v-model="modal.coalescingAction"
            />
            <label for="action-geoavg">Geometric</label>
          </span>
        </div>
        <div class="control checkbox-container">
          <input type="checkbox" id="preserve-boundary" v-model="modal.preserveBoundary" />
          <label for="preserve-boundary">Preserve small intervals near unison</label>
        </div>
      </div>
    </template>
  </Modal>
</template>
