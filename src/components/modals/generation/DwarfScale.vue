<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import { ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
import { clamp } from "xen-dev-utils";
import { Scale } from "scale-workshop-core";
const emit = defineEmits(["update:scale", "update:scaleName", "cancel"]);
const val = ref(12);
const equave = ref(2);
function generate() {
  const clampedVal = clamp(1, 512, val.value);
  const scale = Scale.fromDwarf(
    clampedVal,
    equave.value,
    DEFAULT_NUMBER_OF_COMPONENTS
  );
  let name = `Dwarf scale ${clampedVal}`;
  if (equave.value !== 2) {
    name += `<${equave.value}>`;
  }
  emit("update:scaleName", name);
  emit("update:scale", scale);
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate dwarf scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="val">Patent val</label>
          <input
            id="val"
            type="number"
            min="1"
            max="512"
            class="control"
            v-model="val"
          />
        </div>
        <div class="control">
          <label for="equave">Equave</label>
          <input
            id="equave"
            type="number"
            min="2"
            class="control"
            v-model="equave"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
