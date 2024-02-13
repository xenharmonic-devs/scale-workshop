<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS, OCTAVE } from '@/constants'
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { ExtendedMonzo, Interval, Scale } from 'scale-workshop-core'
import { useModalStore } from '@/stores/modal'
import { setAndReportValidity } from '@/utils'

const props = defineProps<{
  centsFractionDigits: number
  decimalFractionDigits: number
}>()

const emit = defineEmits(['update:scale', 'update:scaleName', 'cancel'])

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

function generate() {
  const lineOptions = {
    centsFractionDigits: props.centsFractionDigits,
    decimalFractionDigits: props.decimalFractionDigits
  }
  if (modal.singleStepOnly) {
    const stepCents = modal.equave.totalCents() / modal.divisions
    const scale = Scale.fromIntervalArray([
      new Interval(
        ExtendedMonzo.fromCents(stepCents, DEFAULT_NUMBER_OF_COMPONENTS),
        'cents',
        undefined,
        lineOptions
      )
    ])
    emit('update:scaleName', `${scale.equave.name} cET`)
    emit('update:scale', scale)
  } else {
    // Implicit use of safeScaleSize. Note that small subsets of huge EDOs cause no issues.
    const scale = Scale.fromEqualTemperamentSubset(
      modal.degrees,
      modal.equave.mergeOptions(lineOptions)
    )
    // Obtain effective divisions from the scale just generated.
    const effectiveDivisions = scale.getInterval(0).options.preferredEtDenominator
    emit('update:scaleName', `${effectiveDivisions} equal divisions of ${modal.equave.toString()}`)
    emit('update:scale', scale)
  }
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
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
  </Modal>
</template>

<style scoped>
label.disabled {
  color: var(--color-text-mute);
}
</style>
