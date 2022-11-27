<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import { Mapping } from "@/tempering";
import { ref, watch } from "vue";
import Modal from "@/components/ModalDialog.vue";
import { makeState, splitText } from "@/components/modals/tempering-state";
import { PRIME_CENTS } from "xen-dev-utils";
import type { Scale } from "scale-workshop-core";

const props = defineProps<{
  scale: Scale;
  centsFractionDigits: number;
}>();

const emit = defineEmits(["update:scale", "cancel"]);

// === Component state ===
const method = ref<"mapping" | "vals" | "commas">("mapping");
const error = ref("");
const state = makeState(method);
// method: "mapping"
const mappingString = ref("1200, 1897.2143, 2788.8573");
// method: "vals"
const valsString = state.valsString;
// medhod: "commas"
const commasString = state.commasString;
// Generic
const subgroupString = state.subgroupString;
const subgroupError = state.subgroupError;
const subgroupInput = ref<HTMLInputElement | null>(null);
// Advanced
const showAdvanced = ref(false);
const weightsString = state.weightsString;
const tempering = state.tempering;
const constraintsString = state.constraintsString;

// === Computed state ===
const vals = state.vals;
const commas = state.commas;
const subgroup = state.subgroup;
const options = state.options;

watch(subgroupError, (newValue) =>
  subgroupInput.value!.setCustomValidity(newValue)
);

// === Methods ===

function modify() {
  try {
    let mapping: Mapping;
    if (method.value === "mapping") {
      const vector = splitText(mappingString.value).map((component) =>
        parseFloat(component)
      );
      while (vector.length < DEFAULT_NUMBER_OF_COMPONENTS) {
        vector.push(PRIME_CENTS[vector.length]);
      }
      mapping = new Mapping(vector.slice(0, DEFAULT_NUMBER_OF_COMPONENTS));
    } else if (method.value === "vals") {
      mapping = Mapping.fromVals(
        vals.value,
        DEFAULT_NUMBER_OF_COMPONENTS,
        subgroup.value,
        options.value
      );
    } else {
      mapping = Mapping.fromCommas(
        commas.value,
        DEFAULT_NUMBER_OF_COMPONENTS,
        subgroup.value,
        options.value
      );
    }
    emit(
      "update:scale",
      mapping
        .apply(props.scale)
        .mergeOptions({ centsFractionDigits: props.centsFractionDigits })
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
      <h2>Temper scale</h2>
    </template>
    <template #body>
      <div @click="error = ''">
        <div class="control-group">
          <div class="control radio-group">
            <label>Method</label>
            <span>
              <input
                type="radio"
                id="method-mapping"
                value="mapping"
                @focus="error = ''"
                v-model="method"
              />
              <label for="method-mapping"> Mapping </label>
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

          <div class="control" v-show="method === 'mapping'">
            <label for="mapping">Mapping</label>
            <textarea
              id="mapping"
              @focus="error = ''"
              v-model="mappingString"
            ></textarea>
          </div>

          <div class="control" v-show="method === 'vals'">
            <label for="vals">Vals</label>
            <input
              type="text"
              id="vals"
              placeholder="12 & 17c"
              @focus="error = ''"
              v-model="valsString"
            />
          </div>

          <div class="control" v-show="method === 'commas'">
            <label for="commas">Comma list</label>
            <input
              type="text"
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
            <label for="subgroup">Subgroup / Prime limit</label>
            <input
              type="text"
              ref="subgroupInput"
              id="subgroup"
              :placeholder="method === 'vals' ? '2.3.5' : ''"
              @focus="error = ''"
              v-model="subgroupString"
            />
          </div>
        </div>
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
            <textarea
              id="constraints"
              @focus="error = ''"
              v-model="constraintsString"
            ></textarea>
          </div>

          <div class="control">
            <label for="weights">Weights</label>
            <textarea
              id="weights"
              @focus="error = ''"
              v-model="weightsString"
            ></textarea>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="modify" :disabled="error.length !== 0">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <span class="error" v-show="error.length">⚠</span>
      </div>
    </template>
  </Modal>
</template>
