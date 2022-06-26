<script setup lang="ts">
import { makeRank1 } from "@/tempering";
import { ref } from "vue";
import Modal from "../../ModalDialog.vue";
import makeState from "../tempering-state";

const emit = defineEmits(["update:scaleLines", "cancel"]);

// === Component state ===
const state = makeState(ref("vals"));
const valsString = state.valsString;
const subgroupString = state.subgroupString;
const showAdvanced = ref(false);
const precision = ref(3);
const weightsString = state.weightsString;
const error = state.error;

// === Computed state ===
const vals = state.vals;
const subgroup = state.subgroup;
const weights = state.weights;

// === Methods ===
function generate() {
  try {
    if (vals.value.length !== 1) {
      error.value = "A single val is required";
      return;
    }
    const scale = makeRank1(vals.value[0], subgroup.value, weights.value);
    emit(
      "update:scaleLines",
      scale.toScaleLines({
        centsFractionDigits: precision.value,
        preferredEdo: scale.size,
      })
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
      <h2>Generate rank 1 temperament</h2>
    </template>
    <template #body>
      <div @click="error = ''">
        <div class="control-group">
          <label for="val">Val</label>
          <input
            id="val"
            placeholder="17c"
            class="control"
            @focus="error = ''"
            v-model="valsString"
          />
          <label for="subgroup">Subgroup</label>
          <input
            id="subgroup"
            class="control"
            @focus="error = ''"
            v-model="subgroupString"
          />
        </div>
        <p class="error">{{ error }}</p>
        <h3
          class="section"
          :class="{ open: showAdvanced }"
          @click="showAdvanced = !showAdvanced"
        >
          Advanced options
        </h3>
        <div class="control-group" v-show="showAdvanced">
          <div class="control">
            <label for="weights">Weights</label>
            <input
              id="weights"
              class="control"
              @focus="error = ''"
              v-model="weightsString"
            />
          </div>
          <div class="control">
            <label for="precision">Cents precision</label>
            <input
              id="precision"
              type="number"
              min="0"
              max="18"
              class="control"
              @focus="error = ''"
              v-model="precision"
            />
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
