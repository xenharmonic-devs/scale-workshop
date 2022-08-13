<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import ExtendedMonzo from "@/monzo";
import { parseLine } from "@/parser";
import Scale from "@/scale";
import {
  makeRank2FromVals,
  makeRank2FromCommas,
  mosPatternsRank2FromVals,
  mosPatternsRank2FromCommas,
  type Rank2Params,
} from "@/tempering";
import {
  mosPatterns as getMosPatterns,
  type MosInfo,
} from "moment-of-symmetry";
import { computed, ref, watch } from "vue";
import Modal from "@/components/ModalDialog.vue";
import { makeState } from "@/components/modals/tempering-state";
import { computedAndError, gapKeyColors } from "@/utils";
import ScaleLineInput from "@/components/ScaleLineInput.vue";
import { Interval } from "@/interval";

const props = defineProps<{
  centsFractionDigits: number;
}>();

const MAX_SIZE = 128;
const MAX_LENGTH = 12;

const emit = defineEmits([
  "update:scaleName",
  "update:scale",
  "update:keyColors",
  "cancel",
]);

// === Component state ===
const method = ref<"generator" | "vals" | "commas">("generator");
const error = ref("");
const state = makeState(method);
// method: "generator"
const generator = ref(parseLine("3/2"));
const generatorString = ref("");
const period = ref(parseLine("2/1"));
const periodString = ref("2/1");
// method: "vals"
const valsString = state.valsString;
// medhod: "commas"
const commasString = state.commasString;
// method: "generator"
const size = ref(7);
const up = ref(5);
const numPeriods = ref(1);
// Generic
const subgroupString = state.subgroupString;
const subgroupError = state.subgroupError;
const subgroupInput = ref<HTMLInputElement | null>(null);
// Advanced
const showAdvanced = ref(false);
const weightsString = state.weightsString;
const tempering = state.tempering;
const constraintsString = state.constraintsString;
// Footer preview
const previewMosPattern = ref("");
// Values that are expensive to compute
const expensiveMosPatterns = ref<MosInfo[]>([]);
// State for key colors
const colorMethod = ref<"none" | "gaps">("none");
const colorAccidentals = ref<"flat" | "sharp">("sharp");

// === Computed state ===
const vals = state.vals;
const commas = state.commas;
const subgroup = state.subgroup;
const options = state.options;

const [mosPatterns, mosPatternsError] = computedAndError(() => {
  if (method.value === "generator") {
    // Don't show error in the default configuration
    if (!generatorString.value.length) {
      return [];
    }
    return getMosPatterns(
      generator.value.totalCents() / period.value.totalCents(),
      numPeriods.value,
      MAX_SIZE,
      MAX_LENGTH
    );
  } else if (method.value === "vals") {
    // Don't show error in the default configuration
    if (!vals.value.length || !subgroupString.value.length) {
      return [];
    }
    // Huge subgroups get too expensive to evaluate interactively
    if (subgroup.value.basis.length > 6) {
      return expensiveMosPatterns.value;
    }
    return mosPatternsRank2FromVals(
      vals.value,
      subgroup.value,
      MAX_SIZE,
      MAX_LENGTH,
      options.value
    );
  } else {
    // Don't show error in the default configuration
    if (!commas.value.length) {
      return [];
    }
    // Huge subgroups get too expensive to evaluate interactively
    if (subgroup.value.basis.length > 6) {
      return expensiveMosPatterns.value;
    }
    return mosPatternsRank2FromCommas(
      commas.value,
      subgroup.value,
      MAX_SIZE,
      MAX_LENGTH,
      options.value
    );
  }
}, []);

// === Watchers ===

// Force scale size and generator stack to align with the multi-MOS
watch(numPeriods, (newValue) => {
  if (newValue > 1) {
    size.value = Math.round(size.value / newValue) * newValue;
    up.value = Math.round(up.value / newValue) * newValue;
  }
});

const upMax = computed(() => {
  return size.value - numPeriods.value;
});

const down = computed(() => {
  return upMax.value - up.value;
});

watch(upMax, (newValue) => {
  up.value = Math.min(up.value, newValue);
});

watch(generator, () => (error.value = ""));
watch(period, () => (error.value = ""));

watch(subgroupError, (newValue) =>
  subgroupInput.value!.setCustomValidity(newValue)
);

watch(
  [vals, commas, subgroup, options],
  () => (expensiveMosPatterns.value = [])
);

// === Methods ===

function calculateExpensiveMosPattern() {
  try {
    if (method.value === "generator") {
      expensiveMosPatterns.value = getMosPatterns(
        generator.value.totalCents() / period.value.totalCents(),
        numPeriods.value,
        MAX_SIZE,
        MAX_LENGTH
      );
    } else if (method.value === "vals") {
      if (!subgroupString.value.length) {
        throw new Error("A subgroup must be given with vals");
      }
      expensiveMosPatterns.value = mosPatternsRank2FromVals(
        vals.value,
        subgroup.value,
        MAX_SIZE,
        MAX_LENGTH,
        options.value
      );
    } else {
      expensiveMosPatterns.value = mosPatternsRank2FromCommas(
        commas.value,
        subgroup.value,
        MAX_SIZE,
        MAX_LENGTH,
        options.value
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
      return;
    }
    alert(error);
  }
}

function selectMosSize(mosSize: number) {
  size.value = mosSize;
  if (method.value !== "generator") {
    let params: Rank2Params;
    if (method.value === "vals") {
      params = makeRank2FromVals(
        vals.value,
        mosSize,
        subgroup.value,
        options.value
      );
    } else {
      params = makeRank2FromCommas(
        commas.value,
        mosSize,
        subgroup.value,
        options.value
      );
    }
    const lineOptions = { centsFractionDigits: props.centsFractionDigits };
    generator.value = new Interval(
      ExtendedMonzo.fromCents(params.generator, DEFAULT_NUMBER_OF_COMPONENTS),
      "cents",
      undefined,
      lineOptions
    );
    generatorString.value = generator.value.name;
    period.value = new Interval(
      ExtendedMonzo.fromCents(params.period, DEFAULT_NUMBER_OF_COMPONENTS),
      "cents",
      undefined,
      lineOptions
    );
    periodString.value = period.value.name;
    numPeriods.value = params.numPeriods;
    method.value = "generator";
  }
}

function generate() {
  // Clear error for the next time the modal is opened
  error.value = "";
  try {
    const lineOptions = { centsFractionDigits: props.centsFractionDigits };
    let size_ = size.value;
    let down_ = down.value;
    const n = numPeriods.value;
    if (colorMethod.value === "gaps") {
      const colors = Array(n)
        .fill(
          gapKeyColors(
            generator.value.totalCents() / period.value.totalCents(),
            size_ / n,
            down_ / n,
            colorAccidentals.value === "flat"
          )
        )
        .flat();
      size_ = colors.length;
      if (colorAccidentals.value === "flat") {
        down_ = size_ - n - up.value;
      }
      emit("update:keyColors", colors);
    }
    const scale = Scale.fromRank2(
      generator.value.mergeOptions(lineOptions),
      period.value.mergeOptions(lineOptions),
      size_,
      down_,
      n
    );
    emit(
      "update:scaleName",
      `Rank 2 temperament (${generatorString.value}, ${periodString.value})`
    );
    emit("update:scale", scale);
  } catch (error_) {
    console.error(error_);
    if (error_ instanceof Error) {
      error.value = error_.message;
    } else {
      error.value = "" + error_;
    }
  }
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate rank 2 temperament</h2>
    </template>
    <template #body>
      <div>
        <div class="control-group">
          <div class="control radio-group">
            <label>Method</label>
            <span>
              <input
                type="radio"
                id="method-generator"
                value="generator"
                v-model="method"
              />
              <label for="method-generator"> Generator </label>
            </span>

            <span>
              <input
                type="radio"
                id="method-vals"
                value="vals"
                v-model="method"
              />
              <label for="method-vals"> Vals </label>
            </span>

            <span>
              <input
                type="radio"
                id="method-commas"
                value="commas"
                v-model="method"
              />
              <label for="method-commas"> Comma list </label>
            </span>
          </div>

          <div class="control" v-show="method === 'generator'">
            <label for="generator">Generator</label>
            <ScaleLineInput
              id="generator"
              placeholder="3/2"
              v-model="generatorString"
              @update:value="generator = $event"
            />

            <label for="period">Period</label>
            <ScaleLineInput
              id="period"
              v-model="periodString"
              @update:value="period = $event"
            />

            <label for="num-periods">Number of periods</label>
            <input
              id="num-periods"
              type="number"
              min="1"
              max="99"
              v-model="numPeriods"
            />

            <label for="up">Generators up/down from 1/1</label>
            <input
              id="up"
              type="number"
              min="0"
              :step="numPeriods"
              :max="upMax"
              v-model="up"
            />
            <input
              id="down"
              type="number"
              disabled
              :value="down"
              min="0"
              :max="upMax"
            />

            <label for="size"
              >Scale size{{
                numPeriods === 1 ? "" : ` (multiple of ${numPeriods})`
              }}</label
            >
            <input
              id="size"
              type="number"
              :min="numPeriods"
              max="999"
              :step="numPeriods"
              v-model="size"
            />
          </div>

          <div class="control" v-show="method === 'vals'">
            <label for="vals">Vals</label>
            <input
              type="text"
              id="vals"
              placeholder="12 & 17c"
              v-model="valsString"
            />
          </div>

          <div class="control" v-show="method === 'commas'">
            <label for="commas">Comma list</label>
            <input
              type="text"
              id="commas"
              placeholder="225/224, 1029/1024"
              v-model="commasString"
            />
          </div>

          <div
            class="control"
            v-show="method === 'vals' || method === 'commas'"
          >
            <label for="subgroup">Subgroup / Prime limit</label>
            <input
              type="text"
              ref="subgroupInput"
              id="subgroup"
              :placeholder="method === 'vals' ? '2.3.5' : ''"
              v-model="subgroupString"
            />
          </div>

          <div :class="{ error: mosPatternsError.length }">
            <strong>MOS sizes</strong>
            <span v-show="mosPatternsError.length">⚠</span>
          </div>
          <div class="btn-group" v-if="mosPatterns.length">
            <button
              v-for="(mosInfo, i) of mosPatterns"
              :key="i"
              @mouseenter="previewMosPattern = mosInfo.mosPattern"
              @mouseleave="previewMosPattern = ''"
              @click="selectMosSize(mosInfo.size)"
            >
              {{ mosInfo.size }}
            </button>
          </div>
          <div class="btn-group" v-else>
            <button @click="calculateExpensiveMosPattern">
              Calculate MOS sizes...
            </button>
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
                id="color-gaps"
                value="gaps"
                v-model="colorMethod"
              />
              <label for="color-gaps"> Fill gaps (expand scale) </label>
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
        <div v-show="method === 'vals' || method === 'commas'">
          <p
            class="section"
            :class="{ open: showAdvanced }"
            @click="showAdvanced = !showAdvanced"
          >
            Advanced options
          </p>
          <div class="control-group" v-show="showAdvanced">
            <div class="control radio-group">
              <span>
                <input
                  type="radio"
                  id="tempering-TE"
                  value="TE"
                  v-model="tempering"
                />
                <label for="tempering-TE"> TE </label>
              </span>

              <span>
                <input
                  type="radio"
                  id="tempering-POTE"
                  value="POTE"
                  v-model="tempering"
                />
                <label for="tempering-POTE"> POTE </label>
              </span>

              <span>
                <input
                  type="radio"
                  id="tempering-CTE"
                  value="CTE"
                  v-model="tempering"
                />
                <label for="tempering-CTE"> CTE </label>
              </span>
            </div>

            <div v-show="tempering === 'CTE'" class="control">
              <label for="constraints">Constraints</label>
              <textarea id="constraints" v-model="constraintsString"></textarea>
            </div>

            <div class="control">
              <label for="weights">Weights</label>
              <textarea id="weights" v-model="weightsString"></textarea>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="generate" :disabled="method !== 'generator'">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <span class="error" v-show="error.length">⚠</span>
        <i>{{ previewMosPattern }}</i>
      </div>
    </template>
  </Modal>
</template>
