<script setup lang="ts">
import type Scale from "@/scale";
import { ref } from "vue";
import Modal from "../../ModalDialog.vue";

const props = defineProps<{
  scale: Scale;
}>();

const emit = defineEmits(["update:scaleLines", "cancel"]);

const denominatorInput = ref<HTMLInputElement | null>(null);

function modify() {
  const denominator = parseInt(denominatorInput.value!.value);
  emit(
    "update:scaleLines",
    props.scale
      .approximateHarmonics(denominator)
      .toScaleLines({ preferredDenominator: denominator })
  );
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Approximate by harmonics</h2>
    </template>
    <template #body>
      <div class="control-group">
        <label for="approximate-harmonics-denominator">Denominator</label>
        <input
          ref="denominatorInput"
          id="approximate-harmonics-denominator"
          type="number"
          value="128"
          min="1"
          class="control"
        />
      </div>
    </template>
  </Modal>
</template>
