<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { OCTAVE } from '@/constants'
import { computedAndError, expandCode, setAndReportValidity } from '@/utils'
import { parseChord } from 'sonic-weave'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

const basisString = ref('3 5 7 11')
const addUnity = ref(false)
const equaveString = ref('2/1')
const equave = ref(OCTAVE)
const basisElement = ref<HTMLInputElement | null>(null)
const [basis, basisError] = computedAndError(() => {
  const chord = parseChord(basisString.value)
  if (chord.length !== 4) {
    throw new Error('Need exactly four basis vectors')
  }
  return chord
}, [])
watch(basisError, (newError) => setAndReportValidity(basisElement.value, newError))

function generate(expand = true) {
  try {
    let source = `octaplex(${basis.value.map((b) => b.toString()).join(', ')}, ${equave.value.toString()}, ${addUnity.value.toString()})`
    if (expand) {
      source = expandCode(source)
    }
    let name = `The Octaplex (${basisString.value}`
    if (addUnity.value) {
      name += ' with 1/1'
    }
    if (!equave.value.equals(OCTAVE)) {
      name += ` over ${equave.value.toString()}`
    }
    name += ')'
    emit('update:scaleName', name)
    emit('update:source', source)
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
      <h2>Generate octaplex (24-cell)</h2>
    </template>
    <template #body>
      <div class="control-group">
        <label for="basis">Basis</label>
        <input
          ref="basisElement"
          id="basis"
          type="text"
          class="control"
          placeholder="3 5 7 11"
          v-model="basisString"
        />
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
    <template #footer>
      <div class="btn-group">
        <button @click="generate(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="generate(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>
