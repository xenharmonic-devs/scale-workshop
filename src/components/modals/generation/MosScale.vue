<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import ExtendedMonzo from "@/monzo";
import { parseLine } from "@/parser";
import { computedAndError } from "@/utils";
import Scale from "@/scale";
import {
  anyForEdo,
  gcd,
  getHardness,
  makeEdoMap,
  modeInfo,
  tamnamsInfo,
} from "moment-of-symmetry";
import { computed, ref, watch } from "vue";
import Modal from "../../ModalDialog.vue";

const emit = defineEmits(["update:scaleLines", "update:scaleName", "cancel"]);

// State required to generate MOS
const numberOfLargeSteps = ref(5);
const numberOfSmallSteps = ref(2);
const sizeOfLargeStep = ref(2);
const sizeOfSmallStep = ref(1);
const up = ref(5);
const equaveString = ref("2/1");
const equaveInput = ref<HTMLInputElement | null>(null);

// State to help select MOS parameters
const method = ref<"direct" | "pyramid" | "edo">("pyramid");
const edo = ref(12);
const previewL = ref(0);
const previewS = ref(0);

// Computed state
const octave = ExtendedMonzo.fromNumber(2, DEFAULT_NUMBER_OF_COMPONENTS);
const [equave, error] = computedAndError(
  () => parseLine(equaveString.value),
  octave
);
const edoMap = computed(() => makeEdoMap());
const edoList = computed(
  () => edoMap.value.get(edo.value) || [anyForEdo(edo.value)]
);
const tamnamsName = computed(() => {
  const info = tamnamsInfo(numberOfLargeSteps.value, numberOfSmallSteps.value);
  if (info?.name === undefined) {
    return "";
  }
  const name = info.name.split(";")[0];
  if (info.subset) {
    return `${name} (sub)`;
  }
  return name;
});
const mosModeInfo = computed(() =>
  modeInfo(numberOfLargeSteps.value, numberOfSmallSteps.value, up.value, true)
);
const hardness = computed(() =>
  getHardness(sizeOfLargeStep.value, sizeOfSmallStep.value)
);
const hostEd = computed(
  () =>
    numberOfLargeSteps.value * sizeOfLargeStep.value +
    numberOfSmallSteps.value * sizeOfSmallStep.value
);
const ed = computed(() => {
  if (equave.value.equals(octave)) {
    return `${hostEd.value}EDO`;
  }
  return `${hostEd.value}ED${equaveString.value}`;
});
const numberOfPeriods = computed(() =>
  Math.abs(gcd(numberOfLargeSteps.value, numberOfSmallSteps.value))
);
const upMax = computed(
  () =>
    numberOfLargeSteps.value + numberOfSmallSteps.value - numberOfPeriods.value
);
const previewName = computed(() => {
  const info = tamnamsInfo(previewL.value, previewS.value);
  if (info?.name === undefined) {
    return "";
  }
  if (info.subset) {
    return `${info.name} (subset)`;
  }
  return info.name;
});

// Watchers
watch(error, (newValue) => {
  equaveInput.value!.setCustomValidity(newValue);
});
watch(numberOfPeriods, (newValue) => {
  up.value = Math.floor(up.value / newValue) * newValue;
});
watch(upMax, (newValue) => {
  up.value = Math.min(up.value, newValue);
});

function generate() {
  const scale = Scale.fromMos(
    numberOfLargeSteps.value,
    numberOfSmallSteps.value,
    sizeOfLargeStep.value,
    sizeOfSmallStep.value,
    up.value,
    equave.value
  );
  emit(
    "update:scaleName",
    `MOS ${numberOfLargeSteps.value}L ${numberOfSmallSteps.value}s`
  );
  emit("update:scaleLines", scale.toScaleLines({ preferredEdo: hostEd.value }));
}
</script>

<template>
  <Modal
    extraStyle="width: 40rem"
    @confirm="generate"
    @cancel="$emit('cancel')"
  >
    <template #header>
      <h2>Generate MOS scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <span>
            <input
              type="radio"
              id="method-direct"
              value="direct"
              v-model="method"
            />
            <label for="method-direct"> Direct </label>
          </span>

          <span>
            <input
              type="radio"
              id="method-pyramid"
              value="pyramid"
              v-model="method"
            />
            <label for="method-pyramid"> Pyramid </label>
          </span>

          <span>
            <input type="radio" id="method-edo" value="edo" v-model="method" />
            <label for="method-edo"> EDO </label>
          </span>
        </div>
      </div>

      <div class="control-group" v-show="method === 'direct'">
        <div class="control">
          <label for="number-of-large-steps">Number of large steps</label>
          <input
            id="number-of-large-steps"
            type="number"
            min="1"
            v-model="numberOfLargeSteps"
          />
        </div>
        <div class="control">
          <label for="number-of-small-steps">Number of small steps</label>
          <input
            id="number-of-small-steps"
            type="number"
            min="1"
            v-model="numberOfSmallSteps"
          />
        </div>
        <div class="control">
          <label for="size-of-large-step">Size of large step</label>
          <input
            id="size-of-large-step"
            type="number"
            v-model="sizeOfLargeStep"
          />
        </div>
        <div class="control">
          <label for="size-of-small-step">Size of small step</label>
          <input
            id="size-of-small-step"
            type="number"
            v-model="sizeOfSmallStep"
          />
        </div>
        <div class="control">
          <label for="up">Bright generators up</label>
          <input
            id="up"
            type="number"
            min="0"
            :max="upMax"
            :step="numberOfPeriods"
            v-model="up"
          />
        </div>
        <div class="control">
          <label for="equave">Equave</label>
          <input ref="equaveInput" id="equave" v-model="equaveString" />
        </div>
      </div>

      <div
        class="pyramid"
        @mouseleave="previewL = 0"
        v-show="method === 'pyramid'"
      >
        <div v-for="key of 11" :key="key" @mousemove.self="previewL = 0">
          <button
            v-for="l of key"
            :key="l"
            @mouseenter="
              previewL = l;
              previewS = key + 1 - l;
            "
            @click="
              numberOfLargeSteps = l;
              numberOfSmallSteps = key + 1 - l;
              method = 'direct';
            "
          >
            {{ l }}L {{ key + 1 - l }}s
          </button>
        </div>
      </div>

      <div
        class="control-group"
        @mouseleave="previewL = 0"
        v-show="method === 'edo'"
      >
        <label for="edo">EDO</label>
        <input id="edo" type="number" min="2" class="control" v-model="edo" />
        <span
          v-for="(info, i) of edoList"
          @mouseenter="
            previewL = info.numberOfLargeSteps;
            previewS = info.numberOfSmallSteps;
          "
          :key="i"
        >
          <button
            @click="
              numberOfLargeSteps = info.numberOfLargeSteps;
              numberOfSmallSteps = info.numberOfSmallSteps;
              sizeOfLargeStep = info.sizeOfLargeStep;
              sizeOfSmallStep = info.sizeOfSmallStep;
              method = 'direct';
            "
          >
            {{ info.pattern }}
          </button>
          {{ info.hardness }}
          <i v-if="info.name !== undefined"
            >[{{ info.name.split(";")[0] + (info.subset ? " (sub)" : "") }}]</i
          >
        </span>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="generate">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <template v-if="method === 'direct'">
          {{ ed }}<i>{{ tamnamsName }}</i
          >{{ mosModeInfo.pattern }} {{ mosModeInfo.udp
          }}<i v-if="mosModeInfo.mode">"{{ mosModeInfo.mode }}"</i
          ><i>{{ hardness }}</i>
        </template>
        <i v-else>{{ previewName }}</i>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.pyramid div {
  display: flex;
  justify-content: center;
}
.pyramid button {
  font-size: small;
}
</style>
