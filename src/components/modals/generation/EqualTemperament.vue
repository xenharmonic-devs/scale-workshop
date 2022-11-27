<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import { computed, ref, watch } from "vue";
import Modal from "@/components/ModalDialog.vue";
import ScaleLineInput from "@/components/ScaleLineInput.vue";
import { splitText } from "@/components/modals/tempering-state";
import { clamp } from "xen-dev-utils";
import { ExtendedMonzo, Interval, Scale } from "scale-workshop-core";

const emit = defineEmits(["update:scale", "update:scaleName", "cancel"]);

const octave = new Interval(
  ExtendedMonzo.fromFraction(2, DEFAULT_NUMBER_OF_COMPONENTS),
  "ratio"
);

const divisions = ref(5);
const equaveString = ref("2/1");
const equave = ref(octave);

const jumpsString = ref("1 1 1 1 1");
const degreesString = ref("1 2 3 4 5");

const jumpsElement = ref<HTMLTextAreaElement | null>(null);
const degreesElement = ref<HTMLTextAreaElement | null>(null);

const safeScaleSize = computed(() =>
  Math.round(clamp(1, 1024, divisions.value))
);

const jumps = computed(() =>
  splitText(jumpsString.value).map((token) => parseInt(token))
);
const degrees = computed(() =>
  splitText(degreesString.value).map((token) => parseInt(token))
);

watch(jumps, (newValue) => {
  if (newValue.includes(NaN)) {
    jumpsElement.value!.setCustomValidity("Step size not an integer");
  } else {
    jumpsElement.value!.setCustomValidity("");
  }
});

watch(degrees, (newValue) => {
  if (newValue.includes(NaN)) {
    degreesElement.value!.setCustomValidity("Degree not an integer");
  } else {
    degreesElement.value!.setCustomValidity("");
  }
});

function updateFromDivisions() {
  jumpsString.value = Array(safeScaleSize.value).fill("1").join(" ");
  degreesString.value = [...Array(safeScaleSize.value).keys()]
    .map((k) => (k + 1).toString())
    .join(" ");
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
  // Implicit use of safeScaleSize. Note that small subsets of huge EDOs cause no issues.
  const scale = Scale.fromEqualTemperamentSubset(degrees.value, equave.value);
  // Obtain effective divisions from the scale just generated.
  const effectiveDivisions =
    scale.getInterval(0).options.preferredEtDenominator;
  emit(
    "update:scaleName",
    `${effectiveDivisions} equal divisions of ${equave.value.toString()}`
  );
  emit("update:scale", scale);
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
            id="divisions"
            type="number"
            min="1"
            v-model="divisions"
            @input="updateFromDivisions"
          />
        </div>
        <div class="control">
          <label for="jumps">Relative steps</label>
          <textarea
            ref="jumpsElement"
            id="jumps"
            v-model="jumpsString"
            @input="updateFromJumps"
          ></textarea>
        </div>
        <div class="control">
          <label for="degrees">Absolute degrees</label>
          <textarea
            ref="degreesElement"
            id="degrees"
            v-model="degreesString"
            @input="updateFromDegrees"
          ></textarea>
        </div>
        <div class="control">
          <label for="equave">Interval to divide</label>
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
