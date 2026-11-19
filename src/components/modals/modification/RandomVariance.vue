<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { useScaleStore } from '@/stores/scale'
import { centString } from '@/utils'
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import { useStageInput } from '@/rack/stage-input'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['preview', 'done', 'cancel'])

const modal = useModalStore()
const scale = useScaleStore()
const input = useStageInput()

/** A repeatable number in [0, 1) for a seed and a degree, so a roll survives recomputes. */
function unitNoise(seed: number, index: number) {
  let t = (seed + Math.imul(index + 1, 0x9e3779b9)) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/**
 * SonicWeave's `randomVariance()` rolls again every time the scale is evaluated, so the rack
 * bakes one roll instead: an offset in cents per degree of the input, from the stored seed.
 */
function build(): GeneratorResult {
  const size = input.value.relativeIntervals.length
  const offsets = [...Array(size).keys()].map((i) =>
    !modal.varyEquave && i === size - 1
      ? 0
      : modal.varianceAmount * (2 * unitNoise(modal.varianceSeed, i) - 1)
  )
  return {
    source: `$ ~*= [${offsets.map((o) => centString(o, scale.centsFractionDigits)).join(', ')}]\ncents(£, ${scale.centsFractionDigits})`,
    name: `Up to ${modal.varianceAmount} ¢`,
    bakesInput: true
  }
}

function reroll() {
  modal.varianceSeed = Math.floor(Math.random() * 2 ** 31)
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
      <h2>Random variance</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Add random amount of detuning to each note of the scale</p>
        <div class="control">
          <label for="amount">Maximum variance in cents</label>
          <input type="number" id="amount" min="0" step="0.1" v-model="modal.varianceAmount" />
        </div>
        <div class="control checkbox-container">
          <input id="vary-equave" type="checkbox" v-model="modal.varyEquave" />
          <label for="vary-equave">Vary the {{ scale.nameOfEquave }}</label>
        </div>
        <button @click="reroll">Roll again</button>
      </div>
    </template>
  </Modal>
</template>
