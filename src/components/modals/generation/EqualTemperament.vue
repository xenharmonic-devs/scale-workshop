<script setup lang="ts">
import { OCTAVE } from '@/constants'
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { MAX_EQUAL_TEMPERAMENT_SIZE, useModalStore } from '@/stores/modal'
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
      if (expand || !modal.simpleEd) {
        try {
          // Prefer restricted 7\13<3> form
          const ji = modal.equave.toFraction().toFraction()
          source = modal.degrees.map((steps) => `${steps}\\${ed}<${ji}>`).join('\n')
        } catch {
          // Fall back to generic 7\13 ed 1912.3456 form
          source = modal.degrees.map((steps) => `${steps}\\${ed} ed ${modal.equave}`).join('\n')
        }
      } else {
        source = `tet(${ed}, ${modal.equave})`
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
      <div class="warning">
        <p v-if="modal.singleStepOnly">Warning: Scale will be converted to a single step.</p>
        <p v-else-if="modal.divisions !== modal.safeScaleSize">
          Warning: Scale will be capped at {{ MAX_EQUAL_TEMPERAMENT_SIZE }} notes.
        </p>
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
