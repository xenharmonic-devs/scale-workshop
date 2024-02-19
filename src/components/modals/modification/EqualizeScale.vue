<script setup lang="ts">
import { alignCents, misalignment } from '@/analysis';
import Modal from '@/components/ModalDialog.vue'
import { OCTAVE } from '@/constants';
import { useModalStore } from '@/stores/modal'
import { useScaleStore } from '@/stores/scale';
import { computed } from 'vue';
import { valueToCents } from 'xen-dev-utils';
import { linear } from 'sonic-weave';

const emit = defineEmits(['done', 'cancel'])

const modal = useModalStore()
const scale = useScaleStore()

const equalizedScaleData = computed(() => {
  const pitches = [...Array(scale.scale.size).keys()].map(i => valueToCents(Math.abs(scale.scale.getRatio(i + scale.baseMidiNote))))
  const gridCents = valueToCents(scale.scale.equaveRatio) / modal.largeDivisions
  if (modal.errorModel === 'rooted') {
    const error = misalignment(pitches, gridCents)
    return {error, degrees: []}
  }
  return alignCents(pitches, gridCents)
});

function modify(expand = true) {
  if (modal.errorModel === 'rooted') {
    scale.sourceText += `\nequalize(${modal.largeDivisions})`
    if (expand) {
      const {visitor, defaults} = scale.getVisitors()
      scale.sourceText = visitor.expand(defaults)
    }
  } else {
    const degrees = [...equalizedScaleData.value.degrees]
    degrees.shift()
    degrees.push(modal.largeDivisions)
    let postfix = `\\${modal.largeDivisions}`
    const equave = scale.relativeIntervals[scale.relativeIntervals.length - 1]
    if (equave.compare(OCTAVE)) {
      postfix += `<${linear(equave).toString()}>`
    }
    scale.sourceText = degrees.map(d => `${d}${postfix}`).join('\n')
  }
  scale.computeScale();
  emit('done')
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Equalize</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>
          Divides your equave into an equal number of steps, then rounds each interval in your scale
          to the nearest equal step.
        </p>
        <div class="control">
          <label for="divisions">Number of equal divisions</label>
          <input
            id="divisions"
            type="number"
            min="1"
            class="control"
            v-model="modal.largeDivisions"
          />
        </div>
        <div class="control radio-group">
          <label>Error model</label>
          <span>
            <input type="radio" id="error-rooted" value="rooted" v-model="modal.errorModel"/>
            <label for="error-rooted"> Rooted </label>
          </span>
          <span>
            <input type="radio" id="error-free" value="free" v-model="modal.errorModel"/>
            <label for="error-free"> Free </label>
          </span>
        </div>
        <p>Error: {{ equalizedScaleData.error.toFixed(5) }} c</p>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="modify(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="modify(false)" :disabled="modal.errorModel === 'free'">Raw</button>
      </div>
    </template>
  </Modal>
</template>
