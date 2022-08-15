<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import Scale from "@/scale";
import { ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
const emit = defineEmits(["update:scale", "update:scaleName", "cancel"]);
const guideTone = ref(45);
const equave = ref(2);
function generate() {
  const scale = Scale.fromEulerGenus(
    guideTone.value,
    equave.value,
    DEFAULT_NUMBER_OF_COMPONENTS
  );
  let name = `Euler-Fokker genus ${guideTone.value}`;
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
      <h2>Generate Euler-Fokker genus</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="guide-tone">Guide Tone</label>
          <input
            id="guide-tone"
            type="number"
            min="1"
            class="control"
            v-model="guideTone"
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
