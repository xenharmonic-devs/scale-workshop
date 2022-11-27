<script setup lang="ts">
import { ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
import type { Scale } from "scale-workshop-core";

const props = defineProps<{
  scale: Scale;
}>();

const emit = defineEmits(["update:scale", "cancel"]);

const divisions = ref(22);

function modify() {
  emit(
    "update:scale",
    props.scale.approximateEqualTemperament(divisions.value)
  );
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Equalize</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>
          Divides your equave into an equal number of steps, then rounds each
          interval in your scale to the nearest equal step.
        </p>
        <div class="control">
          <label for="divisions">Number of equal divisions</label>
          <input
            id="divisions"
            type="number"
            min="1"
            class="control"
            v-model="divisions"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
