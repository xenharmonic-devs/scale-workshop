<script setup lang="ts">
import type Scale from "@/scale";
import { ref } from "vue";
import Modal from "../../ModalDialog.vue";
import { adjustedLine } from "./utils";
const props = defineProps<{
  scaleLines: string[];
  scale: Scale;
}>();
const emit = defineEmits(["update:scaleLines", "cancel"]);
const amount = ref(1.005);
// TODO: Advanced options for precision
function modify() {
  const result: string[] = [];
  for (let i = 0; i < props.scaleLines.length; ++i) {
    const monzo = props.scale.getMonzo(i + 1);
    const stretched = monzo.stretch(amount.value);
    result.push(adjustedLine(props.scaleLines[i], monzo, stretched));
  }

  emit("update:scaleLines", result);
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
