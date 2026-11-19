<script setup lang="ts">
import { alignCents, misalignment } from '@/analysis'
import Modal from '@/components/ModalDialog.vue'
import { OCTAVE } from '@/constants'
import { useModalStore } from '@/stores/modal'
import { computed } from 'vue'
import { valueToCents } from 'xen-dev-utils/conversion'
import { linear } from 'sonic-weave/stdlib'
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import { useStageInput } from '@/rack/stage-input'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['preview', 'done', 'cancel'])

const modal = useModalStore()
const input = useStageInput()

const equalizedScaleData = computed(() => {
  const scale = input.value.scale
  const pitches = [...Array(scale.size).keys()].map((i) =>
    valueToCents(Math.abs(scale.getRatio(i + scale.baseMidiNote)))
  )
  const gridCents = valueToCents(scale.equaveRatio) / modal.safeLargeDivisions
  if (modal.errorModel === 'rooted') {
    const error = misalignment(pitches, gridCents)
    return { error, degrees: [] }
  }
  return alignCents(pitches, gridCents)
})

/**
 * Rooted equalization is SonicWeave's own `equalize()`, live on whatever arrives. The free model
 * aligns the whole input to the grid here, so its degrees are baked from the input.
 */
function build(): GeneratorResult {
  const divisions = modal.safeLargeDivisions
  if (modal.errorModel === 'rooted') {
    return { source: `equalize(${divisions})`, name: `${divisions} equal steps, rooted` }
  }
  const degrees = [...equalizedScaleData.value.degrees]
  degrees.shift()
  degrees.push(divisions)
  let postfix = `\\${divisions}`
  const intervals = input.value.relativeIntervals
  const equave = intervals[intervals.length - 1]
  if (equave.compare(OCTAVE)) {
    postfix += `ed ${linear(equave).toString()}`
  }
  return {
    source: ['clear()', ...degrees.map((d) => `${d}${postfix}`)].join('\n'),
    name: `${divisions} equal steps, free`,
    bakesInput: true
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
            <input type="radio" id="error-rooted" value="rooted" v-model="modal.errorModel" />
            <label for="error-rooted">Rooted</label>
          </span>
          <span>
            <input type="radio" id="error-free" value="free" v-model="modal.errorModel" />
            <label for="error-free">Free</label>
          </span>
        </div>
        <p>Error: {{ equalizedScaleData.error.toFixed(5) }} c</p>
      </div>
    </template>
  </Modal>
</template>
