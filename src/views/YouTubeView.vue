<script setup lang="ts">
import PeriodCircle from "@/components/PeriodCircle.vue";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import { ExtendedMonzo, Interval, Scale } from "scale-workshop-core";
import { ref, watch } from "vue";

const props = defineProps<{
  scale: Scale;

  centsFractionDigits: number;
  decimalFractionDigits: number;
}>();

const emit = defineEmits(["update:scale"]);

const periodCents = ref(1200);
const generatorCents = ref(701.955);
const size = ref(7);
const down = ref(1);

watch(size, (newValue) => {
  down.value = Math.min(down.value, newValue - 1);
});

function generate() {
  const lineOptions = { centsFractionDigits: props.centsFractionDigits };
  const generator = new Interval(
    ExtendedMonzo.fromCents(generatorCents.value, DEFAULT_NUMBER_OF_COMPONENTS),
    "cents",
    undefined,
    lineOptions
  );
  const period = new Interval(
    ExtendedMonzo.fromCents(periodCents.value, DEFAULT_NUMBER_OF_COMPONENTS),
    "cents",
    undefined,
    lineOptions
  );
  const scale = Scale.fromRank2(generator, period, size.value, down.value);
  emit("update:scale", scale);
}
</script>

<template>
  <main>
    <div class="columns-container">
      <div class="column">
        <div class="square">
          <PeriodCircle
            :scale="scale"
            :generatorCents="generatorCents"
            :periodCents="periodCents"
            :size="size"
            :up="size - 1 - down"
            @update:generatorCents="generatorCents = $event"
          />
        </div>
      </div>
      <div class="column">
        <h2>Generate rank 2 temperament</h2>
        <div class="control-group">
          <div class="control">
            <label>Period</label>
            <input type="number" step="any" v-model="periodCents" />
          </div>
          <div class="control">
            <label>Generator</label>
            <input type="number" step="any" v-model="generatorCents" />
          </div>
          <div class="control">
            <label>Size</label>
            <input type="number" step="1" min="1" max="999" v-model="size" />
          </div>
          <div class="control">
            <label>Down</label>
            <input
              type="number"
              step="1"
              min="0"
              :max="size - 1"
              v-model="down"
            />
          </div>
          <button @click="generate">Apply</button>
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
    column-count: 2;
    column-gap: 1px;
    height: 100%;
  }
  div.column {
    height: 100%;
    overflow-y: auto;
    background-color: var(--color-background);
  }
}
.square {
  position: relative;
  height: 100%;
  overflow: hidden;
}

button {
  margin-top: 2rem;
}
</style>
