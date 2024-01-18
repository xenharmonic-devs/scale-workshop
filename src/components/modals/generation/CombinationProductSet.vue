<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { OCTAVE } from '@/constants'
import { Scale } from 'scale-workshop-core'
import { useModalStore } from '@/stores/modal'

const emit = defineEmits(['update:scale', 'update:scaleName', 'cancel'])

const modal = useModalStore()

const factorsElement = ref<HTMLInputElement | null>(null)
watch(
  () => modal.factorsError,
  (newError) => factorsElement.value!.setCustomValidity(newError)
)

// It's not obvious that combination count depends on a parsed text element.
// I think it's better that the user can try using invalid values and see red.

function generate() {
  try {
    const scale = Scale.fromCombinations(
      modal.factors,
      modal.numElements,
      modal.addUnity,
      modal.equave
    )
    let name = `CPS (${modal.numElements} of ${modal.factorsString}`
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
      <h2>Generate combination product set</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="factors">Factors</label>
          <input
            ref="factorsElement"
            id="factors"
            type="text"
            class="control"
            placeholder="1 3 5 7"
            v-model="modal.factorsString"
          />
        </div>
        <div class="control">
          <label for="num-elements">Combination count</label>
          <input
            id="num-elements"
            type="number"
            class="control"
            min="1"
            :max="modal.maxElements"
            v-model="modal.numElements"
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
