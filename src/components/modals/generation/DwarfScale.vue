<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import Scale from "@/scale";
import { ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
const emit = defineEmits(["update:scale", "update:scaleName", "cancel"]);
const val = ref(12);
const equave = ref(2);
function generate() {
  const scale = Scale.fromDwarf(
    val.value,
    equave.value,
    DEFAULT_NUMBER_OF_COMPONENTS
  );
  let name = `Dwarf scale ${val.value}`;
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
        <label for="val">Patent val</label>
        <input id="val" type="number" min="1" class="control" v-model="val" />
        <label for="equave">Equave</label>
        <input
          id="equave"
          type="number"
          min="2"
          class="control"
          v-model="equave"
        />
      </div>
    </template>
  </Modal>
</template>
