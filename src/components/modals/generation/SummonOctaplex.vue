<script setup lang="ts">
import { ref, watch } from "vue";
import Modal from "@/components/ModalDialog.vue";
import ScaleLineInput from "@/components/ScaleLineInput.vue";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import { computedAndError, parseChordInput } from "@/utils";
import { ExtendedMonzo, Interval, Scale } from "scale-workshop-core";

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits(["update:scale", "update:scaleName", "cancel"]);
const octave = new Interval(
  ExtendedMonzo.fromFraction(2, DEFAULT_NUMBER_OF_COMPONENTS),
  "ratio"
);
const basisString = ref("3 5 7 11");
const addUnity = ref(false);
const equaveString = ref("2/1");
const equave = ref(octave);
const basisElement = ref<HTMLInputElement | null>(null);
const [basis, basisError] = computedAndError(() => {
  if (!props.show) {
    return [];
  }
  const chord = parseChordInput(basisString.value);
  if (chord.length !== 4) {
    throw new Error("Need exactly four basis vectors");
  }
  return chord;
}, []);
watch(basisError, (newError) =>
  basisElement.value!.setCustomValidity(newError)
);

function generate() {
  try {
    const scale = Scale.fromOctaplex(basis.value, addUnity.value, equave.value);
    let name = `The Octaplex (${basisString.value}`;
    if (addUnity.value) {
      name += " with 1/1";
    }
    if (!equave.value.equals(octave)) {
      name += ` over ${equave.value.toString()}`;
    }
    name += ")";
    emit("update:scaleName", name);
    emit("update:scale", scale);
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    } else {
      alert(error);
    }
  }
}
</script>

<template>
  <Modal :show="show" @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate octaplex (24-cell)</h2>
    </template>
    <template #body>
      <div class="control-group">
        <label for="basis">Basis</label>
        <input
          ref="basisElement"
          id="basis"
          type="text"
          class="control"
          placeholder="3 5 7 11"
          v-model="basisString"
        />
        <div class="control checkbox-container">
          <input type="checkbox" id="add-unity" v-model="addUnity" />
          <label for="add-unity">Include 1/1 (origin)</label>
        </div>
        <div class="control">
          <label for="equave">Equave</label>
          <ScaleLineInput
            id="equave"
            @update:value="equave = $event"
            v-model="equaveString"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
