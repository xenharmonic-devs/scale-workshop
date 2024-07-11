<script setup lang="ts">
import { OCTAVE } from '@/constants'
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { useModalStore } from '@/stores/modal'
import { setAndReportValidity } from '@/utils'
import { useScaleStore } from '@/stores/scale'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

const scale = useScaleStore()
const modal = useModalStore()

const divisionsElement = ref<HTMLInputElement | null>(null)

watch(
  () => modal.divisions,
  (newValue) => {
    if (isNaN(newValue) || newValue === 0) {
      setAndReportValidity(divisionsElement.value, 'Step size is zero')
    } else {
      setAndReportValidity(divisionsElement.value, '')
    }
  }
)

function generate(expand = true) {
  if (modal.singleStepOnly) {
    const stepCents = modal.equave.value.totalCents() / modal.divisions
    const line = stepCents.toFixed(scale.centsFractionDigits)
    emit('update:scaleName', `${line} cET`)
    emit('update:source', line)
  } else {
    emit('update:scaleName', `${modal.divisions} equal divisions of ${modal.equaveString}`)
    let source: string
    if (modal.equave.equals(OCTAVE)) {
      const edo = modal.divisions
      if (expand || !modal.simpleEd) {
        source = modal.degrees.map((steps) => `${steps}\\${edo}`).join('\n')
      } else {
        source = `tet(${edo})`
      }
    } else {
      const ed = modal.divisions
      const ji = modal.equave.toString()
      if (expand || !modal.simpleEd) {
        source = modal.degrees.map((steps) => `${steps}\\${ed}<${ji}>`).join('\n')
      } else {
        source = `tet(${ed}, ${ji})`
      }
    }
    emit('update:source', source)
  }
}
</script>

<template>
  <Modal :show="show" @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate equal temperament</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="divisions">Number of divisions</label>
          <input
            ref="divisionsElement"
            id="divisions"
            type="number"
            step="any"
            v-model="modal.divisions"
            @input="modal.updateFromDivisions"
          />
        </div>
        <div class="control">
          <label for="jumps" :class="{ disabled: modal.singleStepOnly }">Relative steps</label>
          <textarea
            id="jumps"
            v-model="modal.jumpsString"
            :disabled="modal.singleStepOnly"
            @input="modal.updateFromJumps"
          ></textarea>
        </div>
        <div class="control">
          <label for="degrees" :class="{ disabled: modal.singleStepOnly }">Absolute degrees</label>
          <textarea
            id="degrees"
            v-model="modal.degreesString"
            :disabled="modal.singleStepOnly"
            @input="modal.updateFromDegrees"
          ></textarea>
        </div>
        <div class="control">
          <label for="equave">Interval to divide</label>
          <ScaleLineInput
            id="equave"
            @update:value="modal.equave = $event"
            v-model="modal.equaveString"
            :defaultValue="OCTAVE"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="() => generate(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="() => generate(false)" :disabled="!modal.simpleEd">Raw</button>
      </div>
    </template>
  </Modal>
</template>
