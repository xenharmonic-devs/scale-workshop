<script setup lang="ts">
import type Scale from "@/scale";
import { ref } from "vue";
import Modal from "@/components/ModalDialog.vue";

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
      <h2>Approximate by equal temperament</h2>
    </template>
    <template #body>
      <p>
        Divides your interval of equivalence into an equal number of steps, then
        rounds each interval in your scale to the nearest equal step.
      </p>
      <div class="control-group">
        <label for="divisions">Equal divisions</label>
        <input
          id="divisions"
          type="number"
          min="1"
          class="control"
          v-model="divisions"
        />
      </div>
    </template>
  </Modal>
</template>
