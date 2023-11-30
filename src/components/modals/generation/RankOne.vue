<script setup lang="ts">
// This modal is currently unused in the app.
// TODO: Add sanity checks

import { makeRank1 } from '@/tempering'
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import { makeState } from '@/components/modals/tempering-state'

const props = defineProps<{
  centsFractionDigits: number
}>()

const emit = defineEmits(['update:scaleName', 'update:scale', 'cancel'])

// === Component state ===
const state = makeState(ref('vals'), '2.3.5')
const valsString = state.valsString
const subgroupString = state.subgroupString
const showAdvanced = ref(false)
const weightsString = state.weightsString
const subgroupError = state.subgroupError
const error = ref('')
const valElement = ref<HTMLInputElement | null>(null)
const subgroupElement = ref<HTMLInputElement | null>(null)

// === Computed state ===
const vals = state.vals
const subgroup = state.subgroup
const weights = state.weights

// === Watchers ===
watch(subgroupError, (newError) => subgroupElement.value!.setCustomValidity(newError))
watch(error, (newError) => valElement.value!.setCustomValidity(newError))

// === Methods ===
function generate() {
  try {
    if (vals.value.length !== 1) {
      error.value = 'A single val is required'
      return
    }
    const scale = makeRank1(vals.value[0], subgroup.value, weights.value).mergeOptions({
      centsFractionDigits: props.centsFractionDigits
    })
    emit('update:scaleName', `Rank 1 temperament (${vals.value[0]}, ${subgroupString.value})`)
    emit('update:scale', scale)
  } catch (error_) {
    if (error_ instanceof Error) {
      error.value = error_.message
    } else {
      error.value = '' + error_
    }
  }
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate rank 1 temperament</h2>
    </template>
    <template #body>
      <div @click="error = ''">
        <div class="control-group">
          <label for="val">Val</label>
          <input
            type="text"
            ref="valElement"
            id="val"
            placeholder="17c"
            class="control"
            @focus="error = ''"
            v-model="valsString"
          />
          <label for="subgroup">Subgroup / Prime limit</label>
          <input
            type="text"
            ref="subgroupElement"
            id="subgroup"
            class="control"
            @focus="error = ''"
            v-model="subgroupString"
          />
        </div>
        <h3 class="section" :class="{ open: showAdvanced }" @click="showAdvanced = !showAdvanced">
          Advanced options
        </h3>
        <div class="control-group" v-show="showAdvanced">
          <div class="control">
            <label for="weights">Weights</label>
            <textarea
              id="weights"
              class="control"
              @focus="error = ''"
              v-model="weightsString"
            ></textarea>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="generate" :disabled="error.length !== 0 || subgroupError.length !== 0">
          OK
        </button>
        <button @click="$emit('cancel')">Cancel</button>
      </div>
    </template>
  </Modal>
</template>
