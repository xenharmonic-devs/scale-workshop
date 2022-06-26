<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import Scale from "@/scale";
import { ref } from "vue";
import Modal from "../../ModalDialog.vue";

const emit = defineEmits(["update:scaleLines", "cancel"]);

const lowestHarmonic = ref<HTMLInputElement | null>(null);
const highestHarmonic = ref<HTMLInputElement | null>(null);

function generate() {
  const denominator = parseInt(lowestHarmonic.value!.value);
  const scale = Scale.fromHarmonicSeries(
    denominator,
    parseInt(highestHarmonic.value!.value),
    DEFAULT_NUMBER_OF_COMPONENTS
  );
  emit(
    "update:scaleLines",
    scale.toScaleLines({ preferredDenominator: denominator })
  );
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate harmonic series segment</h2>
    </template>
    <template #body>
      <div class="control-group">
        <label for="lowest-harmonic">Lowest harmonic</label>
        <input
          ref="lowestHarmonic"
          id="lowest-harmonic"
          type="number"
          value="8"
          min="1"
          class="control"
        />
        <label for="highest-harmonic">Highest harmonic</label>
        <input
          ref="highestHarmonic"
          id="highest-harmonic"
          type="number"
          value="16"
          min="1"
          class="control"
        />
      </div>
    </template>
  </Modal>
</template>
