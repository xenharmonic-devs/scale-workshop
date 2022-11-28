<script setup lang="ts">
import { ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
import ScaleLineInput from "@/components/ScaleLineInput.vue";
import { parseLine, type Scale } from "scale-workshop-core";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";

const props = defineProps<{
  scale: Scale;
}>();

const emit = defineEmits(["update:scale", "cancel"]);

const offset = ref(parseLine("5/4", DEFAULT_NUMBER_OF_COMPONENTS));
const offsetString = ref("");
// Overflow = "none" is too similar to "reduce" to be included in the UI.
const overflowType = ref<"none" | "intuitive" | "filter" | "reduce">("filter");

function modify() {
  let transposed = props.scale.transpose(offset.value);
  if (overflowType.value === "filter") {
    transposed = transposed.filter();
  } else if (overflowType.value === "reduce") {
    transposed = transposed.reduce();
  }
  const scale = props.scale.merge(transposed);
  if (overflowType.value === "intuitive") {
    if (scale.intervals.length) {
      const highest = scale.intervals.pop()!;
      const equave = scale.equave;
      if (highest.compare(equave) > 0) {
        scale.intervals.push(equave);
        scale.equave = highest;
        scale.sortInPlace();
      }
    }
  }
  emit("update:scale", scale);
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Merge an offset copy of the scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>
          Clone the scale, transpose it by the offset and merge back in with the
          original.
        </p>
        <div class="control">
          <label for="offset">Offset</label>
          <ScaleLineInput
            id="offset"
            placeholder="5/4"
            v-model="offsetString"
            @update:value="offset = $event"
          />
        </div>
        <div class="control radio-group">
          <label>Overflow</label>
          <span>
            <input
              type="radio"
              id="overflow-intuitive"
              value="intuitive"
              v-model="overflowType"
            />
            <label for="overflow-intuitive"> Keep </label>
          </span>

          <span>
            <input
              type="radio"
              id="overflow-filter"
              value="filter"
              v-model="overflowType"
            />
            <label for="method-vals"> Drop </label>
          </span>

          <span>
            <input
              type="radio"
              id="overflow-reduce"
              value="reduce"
              v-model="overflowType"
            />
            <label for="overflow-reduce"> Wrap </label>
          </span>
        </div>
      </div>
    </template>
  </Modal>
</template>
