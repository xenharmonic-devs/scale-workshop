<script setup lang="ts">
import type Scale from "@/scale";
import { ref } from "vue";
import Modal from "../../ModalDialog.vue";
const props = defineProps<{
  scale: Scale;
}>();
const emit = defineEmits(["update:scaleLines", "cancel"]);
const numerator = ref(128);
function modify() {
  emit(
    "update:scaleLines",
    props.scale
      .approximateSubharmonics(numerator.value)
      .toScaleLines({ preferredNumerator: numerator.value })
  );
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Approximate by subharmonics</h2>
    </template>
    <template #body>
      <div class="control-group">
        <label for="approximate-subharmonics-numerator">Numerator</label>
        <input
          id="approximate-subharmonics-numerator"
          type="number"
          min="1"
          class="control"
          v-model="numerator"
        />
      </div>
    </template>
  </Modal>
</template>
