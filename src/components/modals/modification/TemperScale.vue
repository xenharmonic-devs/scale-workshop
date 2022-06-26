<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import type Scale from "@/scale";
import { Mapping } from "@/tempering";
import { ref } from "vue";
import Modal from "../../ModalDialog.vue";
import makeState from "../tempering-state";

const props = defineProps<{
  scale: Scale;
}>();

const emit = defineEmits(["update:scaleLines", "cancel"]);

// === Component state ===
const method = ref<"vals" | "commas">("commas");
const state = makeState(method);
// method: "vals"
const valsString = state.valsString;
// medhod: "commas"
const commasString = state.commasString;
// Generic
const subgroupString = state.subgroupString;
const error = state.error;
// Advanced
const showAdvanced = ref(false);
const precision = ref(3);
const weightsString = state.weightsString;
const tempering = state.tempering;
const constraintsString = state.constraintsString;

// === Computed state ===
const vals = state.vals;
const commas = state.commas;
const subgroup = state.subgroup;
const options = state.options;

// === Methods ===

function modify() {
  try {
    let mapping: Mapping;
    if (method.value === "vals") {
      mapping = Mapping.fromVals(
        vals.value,
        subgroup.value,
        DEFAULT_NUMBER_OF_COMPONENTS,
        options.value
      );
    } else {
      mapping = Mapping.fromCommas(
        commas.value,
        subgroup.value,
        DEFAULT_NUMBER_OF_COMPONENTS,
        options.value
      );
    }
    emit(
      "update:scaleLines",
      mapping
        .apply(props.scale)
        .toScaleLines({ centsFractionDigits: precision.value })
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
  <Modal @confirm="modify" @cancel="$emit('cancel')">
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

          <div class="control">
            <label for="subgroup">Subgroup</label>
            <input
              id="subgroup"
              :placeholder="method === 'vals' ? '2.3.5' : ''"
              @focus="error = ''"
              v-model="subgroupString"
            />
          </div>
        </div>
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
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="modify" :disabled="error.length !== 0">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
      </div>
    </template>
  </Modal>
</template>
