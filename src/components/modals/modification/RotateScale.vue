<script setup lang="ts">
import type Scale from "@/scale";
import { ref } from "vue";
import Modal from "../../ModalDialog.vue";
const props = defineProps<{
  scaleLines: string[];
  scale: Scale;
}>();
const emit = defineEmits(["update:scaleLines", "cancel"]);
const newUnison = ref<HTMLSelectElement | null>(null);
function modify() {
  let edo: number | undefined;
  for (let i = 0; i < props.scaleLines.length; ++i) {
    const line = props.scaleLines[i];
    if (!line.includes("\\") || line.includes("<")) {
      continue;
    }
    const lineEdo = parseInt(line.split("\\")[1]);
    if (edo === undefined) {
      edo = lineEdo;
    } else if (edo !== lineEdo) {
      edo = undefined;
      break;
    }
  }
  const numSteps = parseInt(newUnison.value!.value);
  emit(
    "update:scaleLines",
    props.scale.rotate(numSteps).toScaleLines({ preferredEdo: edo })
  );
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
          <option
            v-for="(line, i) of scaleLines.slice(0, -1)"
            :key="i"
            :value="i"
          >
            {{ line }}
          </option>
        </select>
      </div>
    </template>
  </Modal>
</template>
