<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { OCTAVE } from '@/constants'
import { computedAndError, parseChordInput } from '@/utils'
import { Scale } from 'scale-workshop-core'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['update:scale', 'update:scaleName', 'cancel'])

const factorsString = ref('')
const numElements = ref(2)
const addUnity = ref(false)
const equaveString = ref('2/1')
const equave = ref(OCTAVE)

const factorsElement = ref<HTMLInputElement | null>(null)
const [factors, factorsError] = computedAndError(() => {
  if (!props.show) {
    return []
  }
  return parseChordInput(factorsString.value)
}, [])
watch(factorsError, (newError) => factorsElement.value!.setCustomValidity(newError))

const maxElements = computed(() => Math.max(1, factors.value.length))

// It's not obvious that combination count depends on a parsed text element.
// I think it's better that the user can try using invalid values and see red.
// Anyway, here's the enforcing watcher if you need it.
// watch(maxElements, (newValue) => numElements.value = Math.min(numElements.value, newValue));

function generate() {
  try {
    const scale = Scale.fromCombinations(
      factors.value,
      numElements.value,
      addUnity.value,
      equave.value
    )
    let name = `CPS (${numElements.value} of ${factorsString.value}`
    if (addUnity.value) {
      name += ' with 1/1'
    }
    if (!equave.value.equals(OCTAVE)) {
      name += ` over ${equave.value.toString()}`
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
  <Modal :show="show" @confirm="generate" @cancel="$emit('cancel')">
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
            v-model="factorsString"
          />
        </div>
        <div class="control">
          <label for="num-elements">Combination count</label>
          <input
            id="num-elements"
            type="number"
            class="control"
            min="1"
            :max="maxElements"
            v-model="numElements"
          />
        </div>
        <div class="control checkbox-container">
          <input type="checkbox" id="add-unity" v-model="addUnity" />
          <label for="add-unity">Include 1/1 (origin)</label>
        </div>
        <div class="control">
          <label for="equave">Equave</label>
          <ScaleLineInput
            id="equave"
            @update:value="equave = $event"
            v-model="equaveString"
            :defaultValue="OCTAVE"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
