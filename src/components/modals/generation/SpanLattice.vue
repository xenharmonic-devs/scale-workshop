<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import Modal from "@/components/ModalDialog.vue";
import ScaleLineInput from "@/components/ScaleLineInput.vue";
import { parseChord } from "@/parser";
import Scale from "@/scale";
import { Interval } from "@/interval";
import ExtendedMonzo from "@/monzo";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import { computedAndError } from "@/utils";

const emit = defineEmits(["update:scale", "update:scaleName", "cancel"]);

const octave = new Interval(
  ExtendedMonzo.fromNumber(2, DEFAULT_NUMBER_OF_COMPONENTS),
  "ratio"
);

const basisString = ref("");
const dimensions = reactive<number[]>([]);
const equaveString = ref("2/1");
const equave = ref(octave);

const basisElement = ref<HTMLInputElement | null>(null);
const [basis, basisError] = computedAndError(() => {
  const input = basisString.value;
  const separator = input.includes(":") ? ":" : /\s/;
  return parseChord(input, separator);
}, []);
watch(basisError, (newError) =>
  basisElement.value!.setCustomValidity(newError)
);

watch(basis, () => {
  while (dimensions.length < basis.value.length) {
    dimensions.push(2);
  }
});

function updateDimension(index: number, event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value);
  dimensions[index] = value;
}

function generate() {
  try {
    const scale = Scale.fromLattice(basis.value, dimensions, equave.value);
    let name = `Lattice (${dimensions.slice(0, basis.value.length)} of ${
      basisString.value
    }`;
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
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate lattice</h2>
    </template>
    <template #body>
      <div class="control-group">
        <label for="basis">Generators</label>
        <input
          ref="basisElement"
          id="basis"
          type="text"
          class="control"
          placeholder="3 5 7"
          v-model="basisString"
        />
        <label>Generators up from 1/1</label>
        <div
          class="control"
          v-for="(dimension, i) of dimensions.slice(0, basis.length)"
          :key="i"
        >
          <label>Generator {{ basis[i] }}</label>
          <input
            type="number"
            min="1"
            max="99"
            :value="dimension"
            @input="updateDimension(i, $event)"
          />
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
