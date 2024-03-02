<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { OCTAVE } from '@/constants'
import { Scale } from 'scale-workshop-core'
import { useModalStore } from '@/stores/modal'
import { setAndReportValidity } from '@/utils'

const emit = defineEmits(['update:scale', 'update:scaleName', 'cancel'])

const modal = useModalStore()

const basisElement = ref<HTMLInputElement | null>(null)
watch(
  () => modal.factorsError,
  (newError) => setAndReportValidity(basisElement.value, newError)
)

function generate() {
  try {
    const scale = Scale.fromCrossPolytope(modal.factors, modal.addUnity, modal.equave)
    let name = `Cross-polytope (${modal.factorsString}`
    if (modal.addUnity) {
      name += ' with 1/1'
    }
    if (!modal.equave.equals(OCTAVE)) {
      name += ` over ${modal.equave.toString()}`
    }
    name += ')'
    emit('update:scaleName', name)
    emit('update:scale', scale)
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message)
    } else {
      alert(error)
    }
  }
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate cross-polytope (hyperoctahedron)</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="basis">Basis</label>
          <input
            ref="basisElement"
            id="basis"
            type="text"
            class="control"
            placeholder="3 5 7 11"
            v-model="modal.factorsString"
          />
        </div>
        <div class="control checkbox-container">
          <input type="checkbox" id="add-unity" v-model="modal.addUnity" />
          <label for="add-unity">Include 1/1 (origin)</label>
        </div>
        <div class="control">
          <label for="equave">Equave</label>
          <ScaleLineInput
            id="equave"
            @update:value="modal.equave = $event"
            v-model="modal.equaveString"
            :defaultValue="OCTAVE"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
