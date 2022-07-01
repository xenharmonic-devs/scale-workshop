<script setup lang="ts">
import type Scale from "@/scale";
import { centsToNats } from "@/utils";
import { computed, ref } from "vue";
import Modal from "../../ModalDialog.vue";
import { adjustedLine } from "./utils";

const EPSILON = 1e-6;

const props = defineProps<{
  scaleLines: string[];
  scale: Scale;
}>();
const emit = defineEmits(["update:scaleLines", "cancel"]);
const amount = ref(10);
const varyEquave = ref(false);

const equave = computed(() => {
  if (Math.abs(props.scale.equave.totalNats() - Math.LN2) < EPSILON) {
    return "octave";
  }
  return "equave";
});

// TODO: Advanced options for precision
function modify() {
  const result: string[] = [];
  const maxIndex = varyEquave.value
    ? props.scaleLines.length
    : props.scaleLines.length - 1;
  for (let i = 0; i < maxIndex; ++i) {
    const monzo = props.scale.getMonzo(i + 1);
    const varied = monzo.clone();
    varied.nats += centsToNats(amount.value) * (Math.random() * 2 - 1);
    result.push(adjustedLine(props.scaleLines[i], monzo, varied));
  }
  if (!varyEquave.value) {
    result.push(props.scaleLines[props.scaleLines.length - 1]);
  }

  emit("update:scaleLines", result);
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Random variance</h2>
    </template>
    <template #body>
      <p>Add random amount of detuning to each note of the scale</p>
      <div class="control-group">
        <div class="control">
          <label for="amount">Maximum variance in cents</label>
          <input
            type="number"
            id="amount"
            min="0"
            step="0.1"
            v-model="amount"
          />
        </div>
        <div class="control">
          <input id="vary-equave" type="checkbox" v-model="varyEquave" />
          <label for="vary-equave">Vary the {{ equave }}</label>
        </div>
      </div>
    </template>
  </Modal>
</template>
