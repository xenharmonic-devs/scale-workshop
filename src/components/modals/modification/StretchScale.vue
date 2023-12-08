<script setup lang="ts">
import { ref } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { ExtendedMonzo, Interval, type Scale } from 'scale-workshop-core'
import { DEFAULT_NUMBER_OF_COMPONENTS, FIFTH } from '@/constants'
const props = defineProps<{
  scale: Scale
  centsFractionDigits: number
  decimalFractionDigits: number
}>()
const emit = defineEmits(['update:scale', 'cancel'])
const amount = ref(1.005)

const equallyTemperedFifth = new Interval(
  ExtendedMonzo.fromEqualTemperament('7/12', '2/1', DEFAULT_NUMBER_OF_COMPONENTS),
  'equal temperament'
)

const referenceString = ref('')
const reference = ref(FIFTH)

const targetString = ref('')
const target = ref(FIFTH)

function calculateAmount() {
  const calculated = target.value.totalCents() / reference.value.totalCents()
  if (calculated >= 0.001 && calculated <= 999.999) {
    amount.value = calculated
  }
}

function modify() {
  emit(
    'update:scale',
    props.scale.stretch(amount.value).mergeOptions({
      centsFractionDigits: props.centsFractionDigits,
      decimalFractionDigits: props.decimalFractionDigits
    })
  )
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Stretch/compress scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Stretch or compress the whole scale evenly.</p>
        <p>Entering 1 will cause no change; entering 2 will make every interval twice as large.</p>
        <div class="control">
          <label for="amount">Stretch ratio</label>
          <input
            class="real-valued"
            type="number"
            id="amount"
            min="0.001"
            max="999.999"
            step="0.001"
            v-model="amount"
          />
        </div>
        <hr />
        <div class="control">
          <label for="reference">Reference interval</label>
          <ScaleLineInput
            id="reference"
            placeholder="7\12"
            :defaultValue="equallyTemperedFifth"
            @update:value="reference = $event"
            v-model="referenceString"
          />
        </div>
        <div class="control">
          <label for="reference">Target interval</label>
          <ScaleLineInput
            id="reference"
            placeholder="3/2"
            :defaultValue="FIFTH"
            @update:value="target = $event"
            v-model="targetString"
          />
        </div>
        <div class="control">
          <label for="stretch-into">Stretch reference into target</label>
          <button @click="calculateAmount">Calculate</button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.real-valued:invalid {
  background-color: var(--color-background);
}
</style>
