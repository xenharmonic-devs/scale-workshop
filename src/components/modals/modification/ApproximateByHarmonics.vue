<script setup lang="ts">
import type Scale from "@/scale";
import { ref } from "vue";
import Modal from "../../ModalDialog.vue";

const props = defineProps<{
  scale: Scale;
}>();

const emit = defineEmits(["update:scaleLines", "cancel"]);

const denominator = ref(128);

function modify() {
  emit(
    "update:scaleLines",
    props.scale
      .approximateHarmonics(denominator.value)
      .toScaleLines({ preferredDenominator: denominator.value })
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
          id="approximate-harmonics-denominator"
          type="number"
          min="1"
          class="control"
          v-model="denominator"
        />
      </div>
    </template>
  </Modal>
</template>
