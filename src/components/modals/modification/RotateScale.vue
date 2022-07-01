<script setup lang="ts">
import type Scale from "@/scale";
import { ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
const props = defineProps<{
  scale: Scale;
}>();
const emit = defineEmits(["update:scale", "cancel"]);
const newUnison = ref<HTMLSelectElement | null>(null);
function modify() {
  const numSteps = parseInt(newUnison.value!.value);
  emit("update:scale", props.scale.rotate(numSteps));
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Rotate</h2>
    </template>
    <template #body>
      <p>Rotates the mode of your scale.</p>
      <p>The resulting scale will be sort ascendingly.</p>
      <div class="control-group">
        <label for="new-unison">New 1/1</label>
        <select ref="newUnison" id="new-unison" class="control">
          <option v-for="i of props.scale.size" :key="i" :value="i">
            {{ props.scale.getName(i) }}
          </option>
        </select>
      </div>
    </template>
  </Modal>
</template>
