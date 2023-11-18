Interval
<script setup lang="ts">
import { OCTAVE } from "@/constants";
import {
  allForEdo,
  anyForEdo,
  daughterMos,
  getHardness,
  makeEdoMap,
  modeInfo,
  mos,
  mosWithDaughter,
  mosWithParent,
  parentMos,
  tamnamsInfo,
  type MosScaleInfo,
} from "moment-of-symmetry";
import { computed, reactive, ref, watch } from "vue";
import Modal from "@/components/ModalDialog.vue";
import ScaleLineInput from "@/components/ScaleLineInput.vue";
import { clamp, gcd } from "xen-dev-utils";
import { Scale } from "scale-workshop-core";

const emit = defineEmits([
  "update:scale",
  "update:scaleName",
  "update:keyColors",
  "cancel",
]);

// State required to generate MOS
const numberOfLargeSteps = ref(5);
const numberOfSmallSteps = ref(2);
const sizeOfLargeStep = ref(2);
const sizeOfSmallStep = ref(1);
const up = ref(5);
const equave = ref(OCTAVE);

// State for key colors
const colorMethod = ref<"none" | "parent" | "daughter">("none");
const colorAccidentals = ref<"flat" | "sharp">("sharp");

// State to help select MOS parameters
const method = ref<"direct" | "pyramid" | "edo">("pyramid");
const edo = ref(12);
const equaveString = ref("2/1");
const previewL = ref(0);
const previewS = ref(0);

// == Computed state ==

// Sanity enforcement
const safeNumLarge = computed(() =>
  clamp(1, 1000, Math.round(numberOfLargeSteps.value))
);
const safeNumSmall = computed(() =>
  clamp(1, 1000, Math.round(numberOfSmallSteps.value))
);
const safeSizeLarge = computed(() => Math.round(sizeOfLargeStep.value));
const safeSizeSmall = computed(() => Math.round(sizeOfSmallStep.value));
const boundedEdo = computed(() => {
  const value = edo.value;
  if (isNaN(value) || !isFinite(value)) {
    return 12;
  }
  if (value < 2) {
    return 2;
  }
  return Math.round(value);
});

// Derived sanity
const numberOfPeriods = computed(() =>
  Math.abs(gcd(safeNumLarge.value, safeNumSmall.value))
);
const upMax = computed(
  () => safeNumLarge.value + safeNumSmall.value - numberOfPeriods.value
);
const safeUp = computed(() =>
  Math.min(
    Math.floor(up.value / numberOfPeriods.value) * numberOfPeriods.value,
    upMax.value
  )
);

// Selections
const edoMap = computed(() => makeEdoMap());
const edoExtraMap = reactive<Map<number, MosScaleInfo[]>>(new Map());
const edoList = computed(() => {
  const edo_ = boundedEdo.value;
  if (!edoMap.value.has(edo_)) {
    return [anyForEdo(edo_)].concat(edoExtraMap.get(edo_) || []);
  }
  return edoMap.value.get(edo_)!.concat(edoExtraMap.get(edo_) || []);
});

// Additional information
const tamnamsName = computed(() => {
  const info = tamnamsInfo(safeNumLarge.value, safeNumSmall.value);
  if (info?.name === undefined) {
    return "";
  }
  return info.name.split(";")[0];
});
const mosModeInfo = computed(() =>
  modeInfo(safeNumLarge.value, safeNumSmall.value, safeUp.value, true)
);

// Derived state
const hardness = computed(() =>
  getHardness(safeSizeLarge.value, safeSizeSmall.value)
);
const hostEd = computed(
  () =>
    safeNumLarge.value * safeSizeLarge.value +
    safeNumSmall.value * safeSizeSmall.value
);
const ed = computed(() => {
  if (equave.value.equals(OCTAVE)) {
    return `${hostEd.value}EDO`;
  }
  return `${hostEd.value}ED${equaveString.value}`;
});
const previewName = computed(() => {
  const info = tamnamsInfo(previewL.value, previewS.value);
  if (info?.name === undefined) {
    return "";
  }
  return info.name;
});

// Watchers
watch(numberOfPeriods, (newValue) => {
  up.value = Math.floor(up.value / newValue) * newValue;
});
watch(upMax, (newValue) => {
  up.value = Math.min(up.value, newValue);
});

// Methods
function moreForEdo() {
  const edo_ = boundedEdo.value;
  const existing = edoList.value;
  const extra = allForEdo(edo_, 5, 12, 5);
  const more = [];
  for (const info of extra) {
    let novel = true;
    for (const old of existing) {
      if (
        info.mosPattern === old.mosPattern &&
        info.sizeOfLargeStep === old.sizeOfLargeStep &&
        info.sizeOfSmallStep === old.sizeOfSmallStep
      ) {
        novel = false;
        break;
      }
    }
    if (novel) {
      more.push(info);
    }
  }
  edoExtraMap.set(edo_, more);
}

function generate() {
  let name: string;
  let steps: number[];
  if (colorMethod.value === "none") {
    steps = mos(
      safeNumLarge.value,
      safeNumSmall.value,
      safeSizeLarge.value,
      safeSizeSmall.value,
      safeUp.value
    );
  } else {
    const generator =
      colorMethod.value === "parent" ? mosWithParent : mosWithDaughter;
    const map = generator(
      safeNumLarge.value,
      safeNumSmall.value,
      safeSizeLarge.value,
      safeSizeSmall.value,
      safeUp.value,
      colorAccidentals.value === "flat"
    );
    steps = [...map.keys()];
    const colors = [...map.values()].map((isParent) =>
      isParent ? "white" : "black"
    );
    colors.unshift(colors.pop()!);
    emit("update:keyColors", colors);
  }

  if (colorMethod.value === "parent") {
    const parent = parentMos(safeNumLarge.value, safeNumSmall.value);
    name = `MOS ${safeNumLarge.value}L ${safeNumSmall.value}s (${parent.mosPattern} on white)`;
  } else if (colorMethod.value === "daughter") {
    const daughter = daughterMos(
      safeNumLarge.value,
      safeNumSmall.value,
      safeSizeLarge.value,
      safeSizeSmall.value
    );
    name = "MOS ";
    if (daughter.hardness === "equalized") {
      const equaveSteps = steps[steps.length - 1];
      name += `${equaveSteps}ED`;
      if (equave.value.equals(OCTAVE)) {
        name += "O";
      } else {
        name += equave.value.toString();
      }
    } else {
      name += daughter.mosPattern;
    }
    name += ` (${safeNumLarge.value}L ${safeNumSmall.value}s on white)`;
  } else {
    name = `MOS ${safeNumLarge.value}L ${safeNumSmall.value}s`;
  }
  emit("update:scaleName", name);

  const scale = Scale.fromEqualTemperamentSubset(steps, equave.value);
  emit("update:scale", scale);
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
        <div class="control radio-group">
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
            max="1000"
            v-model="numberOfLargeSteps"
          />
        </div>
        <div class="control">
          <label for="number-of-small-steps">Number of small steps</label>
          <input
            id="number-of-small-steps"
            type="number"
            min="1"
            max="1000"
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
          <ScaleLineInput
            id="equave"
            @update:value="equave = $event"
            v-model="equaveString"
            :defaultValue="OCTAVE"
          />
        </div>
        <div class="control radio-group">
          <label>Generate key colors</label>
          <span>
            <input
              type="radio"
              id="color-none"
              value="none"
              v-model="colorMethod"
            />
            <label for="color-none"> Off </label>
          </span>
          <span>
            <input
              type="radio"
              id="color-parent"
              value="parent"
              v-model="colorMethod"
            />
            <label for="color-parent"> Parent MOS </label>
          </span>
          <span>
            <input
              type="radio"
              id="color-daughter"
              value="daughter"
              v-model="colorMethod"
            />
            <label for="color-daughter"> Daughter MOS (expand scale) </label>
          </span>
        </div>
        <div class="control radio-group" v-show="colorMethod !== 'none'">
          <label>Black keys are</label>
          <span>
            <input
              type="radio"
              id="sharp"
              value="sharp"
              v-model="colorAccidentals"
            />
            <label for="sharp"> Sharp </label>
          </span>
          <span>
            <input
              type="radio"
              id="flat"
              value="flat"
              v-model="colorAccidentals"
            />
            <label for="flat"> Flat </label>
          </span>
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
        <div class="control">
          <label for="edo">EDO</label>
          <input id="edo" type="number" min="2" class="control" v-model="edo" />
        </div>
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
            {{ info.mosPattern }}
          </button>
          {{ info.hardness }}
          <i v-if="info.name !== undefined">[{{ info.name.split(";")[0] }}]</i>
        </span>
        <button
          @click="moreForEdo"
          v-if="
            (edo === 17 ||
              edo === 19 ||
              edo === 21 ||
              edo === 22 ||
              edo === 23 ||
              edo > 24) &&
            !edoExtraMap.has(edo)
          "
        >
          More...
        </button>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="generate">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <template v-if="method === 'direct'">
          {{ ed }}<i>{{ tamnamsName }}</i
          >{{ mosModeInfo.mode }} {{ mosModeInfo.udp
          }}<i v-if="mosModeInfo.modeName">"{{ mosModeInfo.modeName }}"</i
          ><i>{{ hardness }}</i>
        </template>
        <i v-else>{{ previewName }}</i>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.pyramid {
  text-align: center;
  overflow-x: auto;
}
.pyramid div {
  white-space: nowrap;
}
.pyramid button {
  font-size: small;
}
@media only screen and (max-width: 38rem) {
  .pyramid {
    text-align: left;
  }
  .pyramid button {
    width: 4.5em;
  }
}
</style>
