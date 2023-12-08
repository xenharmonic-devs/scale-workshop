<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { OCTAVE } from '@/constants'
import { computedAndError, parseChordInput } from '@/utils'
import { Scale } from 'scale-workshop-core'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['update:scale', 'update:scaleName', 'cancel'])

const basisString = ref('')
const addUnity = ref(true)
const equaveString = ref('2/1')
const equave = ref(OCTAVE)
const basisElement = ref<HTMLInputElement | null>(null)
const [basis, basisError] = computedAndError(() => {
  if (!props.show) {
    return []
  }
  return parseChordInput(basisString.value)
}, [])
watch(basisError, (newError) => basisElement.value!.setCustomValidity(newError))

function generate() {
  try {
    const scale = Scale.fromCrossPolytope(basis.value, addUnity.value, equave.value)
    let name = `Cross-polytope (${basisString.value}`
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
            v-model="basisString"
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
