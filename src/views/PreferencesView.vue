<script setup lang="ts">
import { UNIX_NEWLINE, WINDOWS_NEWLINE } from "@/constants";
import { computed } from "vue";

const props = defineProps<{
  newline: string;
  colorScheme: "light" | "dark";
  centsFractionDigits: number;
  decimalFractionDigits: number;
}>();

const emit = defineEmits([
  "update:newline",
  "update:colorScheme",
  "update:centsFractionDigits",
  "update:decimalFractionDigits",
]);

const newline = computed({
  get: () => props.newline,
  set: (newValue: string) => emit("update:newline", newValue),
});
const colorScheme = computed({
  get: () => props.colorScheme,
  set: (newValue: string) => emit("update:colorScheme", newValue),
});
const centsFractionDigits = computed({
  get: () => props.centsFractionDigits,
  set: (newValue: number) => emit("update:centsFractionDigits", newValue),
});
const decimalFractionDigits = computed({
  get: () => props.decimalFractionDigits,
  set: (newValue: number) => emit("update:decimalFractionDigits", newValue),
});
</script>

<template>
  <main>
    <div class="columns-container">
      <div class="column">
        <h2>File export</h2>
        <div class="control-group">
          <label for="newline">Line endings format</label>
          <select
            id="newline"
            class="control"
            title="If your exported tuning files didn't work right on macOS synths, try changing this option to Unix."
            v-model="newline"
          >
            <option :value="WINDOWS_NEWLINE">Microsoft (Windows/MS-DOS)</option>
            <option :value="UNIX_NEWLINE">Unix (Mac/Linux)</option>
          </select>
        </div>
      </div>
      <div class="column">
        <h2>Appearance</h2>
        <div class="control-group">
          <div class="control radio-group">
            <span>
              <input
                type="radio"
                id="scheme-light"
                value="light"
                v-model="colorScheme"
              />
              <label for="scheme-light"> Light </label>
            </span>
            <span>
              <input
                type="radio"
                id="scheme-dark"
                value="dark"
                v-model="colorScheme"
              />
              <label for="scheme-dark"> Dark </label>
            </span>
          </div>
        </div>
      </div>
      <div class="column">
        <h2>Precision</h2>
        <div class="control-group">
          <label for="cents">Cents digits after decimal point</label>
          <input
            id="cents"
            type="number"
            class="control"
            min="0"
            v-model="centsFractionDigits"
          />
          <label for="decimal">Decimal digits after decimal comma</label>
          <input
            id="decimal"
            type="number"
            class="control"
            min="0"
            v-model="decimalFractionDigits"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
div.columns-container {
  height: 100%;
  overflow-y: auto;
}
div.column {
  overflow-x: hidden;
  padding: 1rem;
}

@media screen and (min-width: 860px) {
  div.columns-container {
    background-color: var(--color-border);
    column-count: 3;
    column-gap: 1px;
    height: 100%;
  }
  div.column {
    height: 100%;
    overflow-y: auto;
    background-color: var(--color-background);
  }
}
</style>
