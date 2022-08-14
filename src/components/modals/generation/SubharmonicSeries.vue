<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import Scale from "@/scale";
import { ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
const emit = defineEmits(["update:scale", "update:scaleName", "cancel"]);
const lowestSubharmonic = ref(8);
const highestSubharmonic = ref(16);
function generate() {
  const numerator = highestSubharmonic.value;
  const scale = Scale.fromSubharmonicSeries(
    numerator,
    lowestSubharmonic.value,
    DEFAULT_NUMBER_OF_COMPONENTS
  );
  emit(
    "update:scaleName",
    `Subharmonics ${lowestSubharmonic.value}-${highestSubharmonic.value}`
  );
  emit("update:scale", scale);
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate subharmonic series segment</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="lowest-subharmonic">Lowest subharmonic</label>
          <input
            id="lowest-subharmonic"
            type="number"
            min="1"
            class="control"
            v-model="lowestSubharmonic"
          />
        </div>
        <div class="control">
          <label for="highest-subharmonic">Highest subharmonic</label>
          <input
            id="highest-subharmonic"
            type="number"
            min="1"
            class="control"
            v-model="highestSubharmonic"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
