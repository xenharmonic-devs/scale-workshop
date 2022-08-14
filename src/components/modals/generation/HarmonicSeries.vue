<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import Scale from "@/scale";
import { ref } from "vue";
import Modal from "@/components/ModalDialog.vue";

const emit = defineEmits(["update:scale", "update:scaleName", "cancel"]);

const lowestHarmonic = ref(8);
const highestHarmonic = ref(16);

function generate() {
  const denominator = lowestHarmonic.value;
  const scale = Scale.fromHarmonicSeries(
    denominator,
    highestHarmonic.value,
    DEFAULT_NUMBER_OF_COMPONENTS
  );
  emit("update:scaleName", `Harmonics ${denominator}-${highestHarmonic.value}`);
  emit("update:scale", scale);
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate harmonic series segment</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="lowest-harmonic">Lowest harmonic</label>
          <input
            id="lowest-harmonic"
            type="number"
            min="1"
            class="control"
            v-model="lowestHarmonic"
          />
        </div>
        <div class="control">
          <label for="highest-harmonic">Highest harmonic</label>
          <input
            id="highest-harmonic"
            type="number"
            min="1"
            class="control"
            v-model="highestHarmonic"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
