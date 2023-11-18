<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS, OCTAVE } from "@/constants";
import { computed, ref, watch } from "vue";
import Modal from "@/components/ModalDialog.vue";
import ScaleLineInput from "@/components/ScaleLineInput.vue";
import { clamp } from "xen-dev-utils";
import { ExtendedMonzo, Interval, Scale } from "scale-workshop-core";
import { splitText } from "@/utils";

const props = defineProps<{
  centsFractionDigits: number;
  decimalFractionDigits: number;
}>();

const emit = defineEmits(["update:scale", "update:scaleName", "cancel"]);

const divisions = ref(5);
const equaveString = ref("2/1");
const equave = ref(OCTAVE);

const jumpsString = ref("1 1 1 1 1");
const degreesString = ref("1 2 3 4 5");

const divisionsElement = ref<HTMLInputElement | null>(null);

const singleStepOnly = computed(
  () => divisions.value !== Math.round(divisions.value) || divisions.value < 1
);

const safeScaleSize = computed(() =>
  Math.round(clamp(1, 1024, divisions.value))
);

watch(divisions, (newValue) => {
  if (isNaN(newValue) || newValue === 0) {
    divisionsElement.value!.setCustomValidity("Step size is zero");
  } else {
    divisionsElement.value!.setCustomValidity("");
  }
});

const jumps = computed(() =>
  splitText(jumpsString.value).map((token) => parseInt(token))
);
const degrees = computed(() =>
  splitText(degreesString.value).map((token) => parseInt(token))
);

function updateFromDivisions() {
  if (singleStepOnly.value) {
    jumpsString.value = "";
    degreesString.value = "";
  } else {
    jumpsString.value = Array(safeScaleSize.value).fill("1").join(" ");
    degreesString.value = [...Array(safeScaleSize.value).keys()]
      .map((k) => (k + 1).toString())
      .join(" ");
  }
}

function updateFromJumps() {
  if (jumps.value.includes(NaN)) {
    return;
  }
  const degrees_: string[] = [];
  let degree = 0;
  jumps.value.forEach((jump) => {
    degree += jump;
    degrees_.push(degree.toString());
  });
  divisions.value = degree;
  degreesString.value = degrees_.join(" ");
}

function updateFromDegrees() {
  if (degrees.value.includes(NaN)) {
    return;
  }
  const jumps_: string[] = [];
  let previous = 0;
  degrees.value.forEach((degree) => {
    jumps_.push((degree - previous).toString());
    previous = degree;
  });
  divisions.value = previous;
  jumpsString.value = jumps_.join(" ");
}

function generate() {
  const lineOptions = {
    centsFractionDigits: props.centsFractionDigits,
    decimalFractionDigits: props.decimalFractionDigits,
  };
  if (singleStepOnly.value) {
    const stepCents = equave.value.totalCents() / divisions.value;
    const scale = Scale.fromIntervalArray([
      new Interval(
        ExtendedMonzo.fromCents(stepCents, DEFAULT_NUMBER_OF_COMPONENTS),
        "cents",
        undefined,
        lineOptions
      ),
    ]);
    emit("update:scaleName", `${scale.equave.name} cET`);
    emit("update:scale", scale);
  } else {
    // Implicit use of safeScaleSize. Note that small subsets of huge EDOs cause no issues.
    const scale = Scale.fromEqualTemperamentSubset(
      degrees.value,
      equave.value.mergeOptions(lineOptions)
    );
    // Obtain effective divisions from the scale just generated.
    const effectiveDivisions =
      scale.getInterval(0).options.preferredEtDenominator;
    emit(
      "update:scaleName",
      `${effectiveDivisions} equal divisions of ${equave.value.toString()}`
    );
    emit("update:scale", scale);
  }
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate equal temperament</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="divisions">Number of divisions</label>
          <input
            ref="divisionsElement"
            id="divisions"
            type="number"
            step="any"
            v-model="divisions"
            @input="updateFromDivisions"
          />
        </div>
        <div class="control">
          <label for="jumps" :class="{ disabled: singleStepOnly }"
            >Relative steps</label
          >
          <textarea
            id="jumps"
            v-model="jumpsString"
            :disabled="singleStepOnly"
            @input="updateFromJumps"
          ></textarea>
        </div>
        <div class="control">
          <label for="degrees" :class="{ disabled: singleStepOnly }"
            >Absolute degrees</label
          >
          <textarea
            id="degrees"
            v-model="degreesString"
            :disabled="singleStepOnly"
            @input="updateFromDegrees"
          ></textarea>
        </div>
        <div class="control">
          <label for="equave">Interval to divide</label>
          <ScaleLineInput
            id="equave"
            @update:value="equave = $event"
            v-model="equaveString"
            :defaultValue="OCTAVE"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
label.disabled {
  color: var(--color-text-mute);
}
</style>
