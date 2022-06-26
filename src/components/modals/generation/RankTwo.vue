<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import ExtendedMonzo from "@/monzo";
import { parseLine } from "@/parser";
import Scale from "@/scale";
import {
  makeRank2FromVals,
  makeRank2FromCommas,
  mosSizesRank2FromVals,
  mosSizesRank2FromCommas,
} from "@/tempering";
import { mosSizes as getMosSizes } from "moment-of-symmetry";
import { computed, ref, watch } from "vue";
import Modal from "../../ModalDialog.vue";
import makeState from "../tempering-state";

const MAX_SIZE = 128;
const MAX_LENGTH = 12;

const emit = defineEmits(["update:scaleLines", "cancel"]);

// === Component state ===
const method = ref<"generator" | "vals" | "commas">("generator");
const state = makeState(method);
// method: "generator"
const generatorString = ref("");
const periodString = ref("2/1");
// method: "vals"
const valsString = state.valsString;
// medhod: "commas"
const commasString = state.commasString;
// Generic
const subgroupString = state.subgroupString;
const size = ref(7);
const up = ref(5);
const error = state.error;
// Advanced
const showAdvanced = ref(false);
const precision = ref(3);
const weightsString = state.weightsString;
const tempering = state.tempering;
const constraintsString = state.constraintsString;

// === Computed state ===
const unison = ExtendedMonzo.fromNumber(1, DEFAULT_NUMBER_OF_COMPONENTS);
const generatorAndError = computed<[ExtendedMonzo, string]>(() => {
  try {
    return [parseLine(generatorString.value), ""];
  } catch (error_) {
    if (error_ instanceof Error) {
      return [unison, error_.message];
    }
    return [unison, "" + error_];
  }
});
const generator = computed(() => generatorAndError.value[0]);
const generatorError = computed(() => generatorAndError.value[1]);
const periodAndError = computed<[ExtendedMonzo, string]>(() => {
  try {
    return [parseLine(periodString.value), ""];
  } catch (error_) {
    if (error_ instanceof Error) {
      return [unison, error_.message];
    }
    return [unison, "" + error_];
  }
});
const period = computed(() => periodAndError.value[0]);
const periodError = computed(() => periodAndError.value[1]);
const vals = state.vals;
const commas = state.commas;
const subgroup = state.subgroup;
const options = state.options;

const divisionsMosSizesAndError = computed<[number, number[], string]>(() => {
  let errorValue = "";
  let divisions = 1;
  let sizes: number[] = [];
  try {
    if (method.value === "generator") {
      // Don't show error in the default configuration
      if (!generatorString.value.length) {
        return [1, [], ""];
      }
      sizes = getMosSizes(
        generator.value.totalNats() / period.value.totalNats(),
        MAX_SIZE,
        MAX_LENGTH
      );
    } else if (method.value === "vals") {
      // Don't show error in the default configuration
      if (!vals.value.length || !subgroupString.value.length) {
        return [1, [], ""];
      }
      // Huge subgroups get too expensive to evaluate interactively
      if (subgroup.value.basis.length > 6) {
        return [1, [], ""];
      }
      [divisions, sizes] = mosSizesRank2FromVals(
        vals.value,
        subgroup.value,
        MAX_SIZE,
        MAX_LENGTH,
        options.value
      );
    } else {
      // Don't show error in the default configuration
      if (!commas.value.length) {
        return [1, [], ""];
      }
      // Huge subgroups get too expensive to evaluate interactively
      if (subgroup.value.basis.length > 6) {
        return [1, [], ""];
      }
      [divisions, sizes] = mosSizesRank2FromCommas(
        commas.value,
        subgroup.value,
        MAX_SIZE,
        MAX_LENGTH,
        options.value
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      errorValue = error.message;
    } else {
      errorValue = "" + error;
    }
  }
  if (divisions < 1) {
    return [1, [], ""];
  }
  return [divisions, sizes, errorValue];
});

const divisions = computed(() => divisionsMosSizesAndError.value[0]);
const mosSizes = computed(() => divisionsMosSizesAndError.value[1]);
const mosError = computed(() => divisionsMosSizesAndError.value[2]);

// === Watchers ===

// Force scale size to align with the multi-MOS
watch(divisionsMosSizesAndError, (newValue) => {
  const divisions = newValue[0];
  if (divisions > 1) {
    size.value = Math.round(size.value / divisions) * divisions;
  }
});

const upMax = computed(() => {
  return Math.round(size.value / divisions.value) - 1;
});

const down = computed(() => {
  return upMax.value - up.value;
});

watch(upMax, (newValue) => {
  up.value = Math.min(up.value, newValue);
});

watch(mosError, (newValue) => {
  error.value = newValue;
});

watch(generatorError, (newValue) => {
  error.value = newValue;
});

watch(periodError, (newValue) => {
  error.value = newValue;
});

// === Methods ===

function generate() {
  if (error.value.length) {
    return;
  }
  try {
    let scale: Scale;
    if (method.value === "generator") {
      scale = Scale.fromRank2(
        generator.value,
        period.value,
        size.value,
        down.value
      );
      // Assume that the user knows what they're doing if they enter precise cents
      emit("update:scaleLines", scale.toScaleLines());
      return;
    } else if (method.value === "vals") {
      scale = makeRank2FromVals(
        vals.value,
        size.value,
        down.value,
        subgroup.value,
        options.value
      );
    } else {
      scale = makeRank2FromCommas(
        commas.value,
        size.value,
        down.value,
        subgroup.value,
        options.value
      );
    }
    emit(
      "update:scaleLines",
      scale.toScaleLines({ centsFractionDigits: precision.value })
    );
  } catch (error_) {
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
      <div @click="error = ''">
        <div class="control-group">
          <div class="control">
            <label>Method</label>
            <span>
              <input
                type="radio"
                id="method-generator"
                value="generator"
                @focus="error = ''"
                v-model="method"
              />
              <label for="method-generator"> Generator </label>
            </span>

            <span>
              <input
                type="radio"
                id="method-vals"
                value="vals"
                @focus="error = ''"
                v-model="method"
              />
              <label for="method-vals"> Vals </label>
            </span>

            <span>
              <input
                type="radio"
                id="method-commas"
                value="commas"
                @focus="error = ''"
                v-model="method"
              />
              <label for="method-commas"> Comma list </label>
            </span>
          </div>

          <div class="control" v-show="method === 'generator'">
            <label for="generator">Generator</label>
            <input
              id="generator"
              placeholder="3/2"
              @focus="error = ''"
              v-model="generatorString"
            />

            <label for="period">Period</label>
            <input id="period" @focus="error = ''" v-model="periodString" />
          </div>

          <div class="control" v-show="method === 'vals'">
            <label for="vals">Vals</label>
            <input
              id="vals"
              placeholder="12 & 17c"
              @focus="error = ''"
              v-model="valsString"
            />
          </div>

          <div class="control" v-show="method === 'commas'">
            <label for="commas">Comma list</label>
            <input
              id="commas"
              placeholder="225/224, 1029/1024"
              @focus="error = ''"
              v-model="commasString"
            />
          </div>

          <div
            class="control"
            v-show="method === 'vals' || method === 'commas'"
          >
            <label for="subgroup">Subgroup</label>
            <input
              id="subgroup"
              :placeholder="method === 'vals' ? '2.3.5' : ''"
              @focus="error = ''"
              v-model="subgroupString"
            />
          </div>

          <div class="control">
            <label for="size"
              >Scale size{{
                divisions === 1 ? "" : ` (multiple of ${divisions})`
              }}</label
            >
            <input
              ref="sizeInput"
              id="size"
              type="number"
              :min="divisions"
              max="999"
              :step="divisions"
              @focus="error = ''"
              v-model="size"
            />
            <label for="up">Generators up/down from 1/1</label>
            <input
              ref="upInput"
              id="up"
              type="number"
              min="0"
              :max="upMax"
              @focus="error = ''"
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
          </div>

          <div>
            <strong>MOS sizes:</strong>
          </div>
          <div>
            <button
              v-for="(mosSize, i) of mosSizes"
              :key="i"
              @click="
                size = mosSize;
                error = '';
              "
            >
              {{ mosSize }}
            </button>
            <p class="error">{{ error }}</p>
          </div>
        </div>
        <div v-show="method === 'vals' || method === 'commas'">
          <h3
            class="section"
            :class="{ open: showAdvanced }"
            @click="showAdvanced = !showAdvanced"
          >
            Advanced options
          </h3>
          <div class="control-group" v-show="showAdvanced">
            <div class="control">
              <span>
                <input
                  type="radio"
                  id="tempering-TE"
                  value="TE"
                  @focus="error = ''"
                  v-model="tempering"
                />
                <label for="tempering-TE"> TE </label>
              </span>

              <span>
                <input
                  type="radio"
                  id="tempering-POTE"
                  value="POTE"
                  @focus="error = ''"
                  v-model="tempering"
                />
                <label for="tempering-POTE"> POTE </label>
              </span>

              <span>
                <input
                  type="radio"
                  id="tempering-CTE"
                  value="CTE"
                  @focus="error = ''"
                  v-model="tempering"
                />
                <label for="tempering-CTE"> CTE </label>
              </span>
            </div>

            <div v-show="tempering === 'CTE'" class="control">
              <label for="constraints">Constraints</label>
              <input
                id="constraints"
                @focus="error = ''"
                v-model="constraintsString"
              />
            </div>

            <div class="control">
              <label for="weights">Weights</label>
              <input id="weights" @focus="error = ''" v-model="weightsString" />
            </div>

            <div class="control">
              <label for="precision">Cents precision</label>
              <input
                id="precision"
                type="number"
                min="0"
                max="18"
                @focus="error = ''"
                v-model="precision"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="generate" :disabled="error.length !== 0">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
      </div>
    </template>
  </Modal>
</template>
