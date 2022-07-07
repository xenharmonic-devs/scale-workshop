<script setup lang="ts">
import type Scale from "@/scale";
import { ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
const props = defineProps<{
  scale: Scale;
  centsFractionDigits: number;
  decimalFractionDigits: number;
}>();
const emit = defineEmits(["update:scale", "cancel"]);
const amount = ref(1.005);

function modify() {
  emit(
    "update:scale",
    props.scale.stretch(amount.value).mergeOptions({
      centsFractionDigits: props.centsFractionDigits,
      decimalFractionDigits: props.decimalFractionDigits,
    })
  );
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Stretch/compress scale</h2>
    </template>
    <template #body>
      <p>Stretch or compress the whole scale evenly.</p>
      <p>
        Entering 1 will cause no change; entering 2 will make every interval
        twice as large.
      </p>
      <div class="control-group">
        <div class="control">
          <label for="amount">Stretch ratio</label>
          <input
            type="number"
            id="amount"
            min="0.001"
            max="999.999"
            step="0.001"
            v-model="amount"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
