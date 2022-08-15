<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import Modal from "@/components/ModalDialog.vue";
import ScaleLineInput from "@/components/ScaleLineInput.vue";
import { parseChord } from "@/parser";
import Scale from "@/scale";
import { Interval, type IntervalOptions } from "@/interval";
import ExtendedMonzo from "@/monzo";
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import { computedAndError } from "@/utils";
import { makeState } from "@/components/modals/tempering-state";
import Temperament from "temperaments";

const props = defineProps<{
  show: boolean;
  centsFractionDigits: number;
}>();

const emit = defineEmits(["update:scale", "update:scaleName", "cancel"]);

const octave = new Interval(
  ExtendedMonzo.fromNumber(2, DEFAULT_NUMBER_OF_COMPONENTS),
  "ratio"
);

const method = ref<"generators" | "vals" | "commas">("generators");
const state = makeState(method);
// method: "vals"
const valsString = state.valsString;
// medhod: "commas"
const commasString = state.commasString;
// method: "generators"
const basisString = ref("");
const dimensions = reactive<number[]>([]);
const equaveString = ref("2/1");
const equave = ref(octave);
// Generic
const subgroupString = state.subgroupString;
const subgroupError = state.subgroupError;
// Advanced
const showAdvanced = ref(false);
const weightsString = state.weightsString;
const tempering = state.tempering;
const constraintsString = state.constraintsString;

const basisElement = ref<HTMLInputElement | null>(null);
const [basis, basisError] = computedAndError(() => {
  if (!props.show) {
    return [];
  }
  const input = basisString.value;
  const separator = input.includes(":") ? ":" : /\s/;
  return parseChord(input, separator);
}, []);
watch(basisError, (newError) =>
  basisElement.value!.setCustomValidity(newError)
);

watch(basis, () => {
  while (dimensions.length < basis.value.length) {
    dimensions.push(2);
  }
});

function fromCents(cents: number) {
  const options: IntervalOptions = {
    centsFractionDigits: props.centsFractionDigits,
  };
  return new Interval(
    ExtendedMonzo.fromCents(cents, DEFAULT_NUMBER_OF_COMPONENTS),
    "cents",
    undefined,
    options
  );
}

function calculateGenerators() {
  let temperament: Temperament;
  if (method.value === "vals") {
    temperament = Temperament.fromVals(state.vals.value, state.subgroup.value);
  } else {
    temperament = Temperament.fromCommas(
      state.commas.value,
      state.subgroup.value
    );
  }
  const generators = temperament.generators(state.options.value);
  if (!generators.length) {
    alert("Unable to calculate generators.");
    return;
  }

  equave.value = fromCents(generators[0]);
  equaveString.value = equave.value.centsString();

  basisString.value = generators
    .slice(1)
    .map((generator) => fromCents(generator).centsString())
    .join(" ");

  method.value = "generators";
}

function updateDimension(index: number, event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value);
  dimensions[index] = value;
}

function flip(index: number) {
  const generator = basis.value[index].neg().mmod(
    equave.value.mergeOptions({
      centsFractionDigits: props.centsFractionDigits,
    })
  );
  const newBasis = [...basis.value];
  newBasis.splice(index, 1, generator);
  basisString.value = newBasis.map((gen) => gen.toString()).join(" ");
}

function generate() {
  try {
    const scale = Scale.fromLattice(basis.value, dimensions, equave.value);
    let name = `Lattice (${dimensions.slice(0, basis.value.length)} of ${
      basisString.value
    }`;
    if (basis.value.length === 0) {
      name = "Lattice (unison";
    }
    if (!equave.value.equals(octave)) {
      name += ` over ${equave.value.toString()}`;
    }
    name += ")";
    emit("update:scaleName", name);
    emit("update:scale", scale);
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    } else {
      alert(error);
    }
  }
}
</script>

<template>
  <Modal :show="show" @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate lattice</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control radio-group">
          <label>Method</label>
          <span>
            <input
              type="radio"
              id="method-generators"
              value="generators"
              v-model="method"
            />
            <label for="method-generators"> Generators </label>
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
        <div class="control-group" v-show="method === 'generators'">
          <div class="control">
            <label for="basis">Generators</label>
            <input
              ref="basisElement"
              id="basis"
              type="text"
              class="control"
              placeholder="3 5 7"
              v-model="basisString"
            />
          </div>
          <label>Generators up from 1/1</label>
          <div
            class="control"
            v-for="(dimension, i) of dimensions.slice(0, basis.length)"
            :key="i"
          >
            <label>Generator {{ basis[i] }}</label>
            <button @click="flip(i)">Flip</button>
            <input
              type="number"
              min="1"
              max="99"
              :value="dimension"
              @input="updateDimension(i, $event)"
            />
          </div>
          <div class="control">
            <label for="equave">Equave</label>
            <ScaleLineInput
              id="equave"
              @update:value="equave = $event"
              v-model="equaveString"
            />
          </div>
        </div>
        <div class="control" v-show="method === 'vals'">
          <label for="vals">Vals</label>
          <input
            type="text"
            id="vals"
            placeholder="8d & 12 & 19"
            v-model="valsString"
          />
        </div>

        <div class="control" v-show="method === 'commas'">
          <label for="commas">Comma list</label>
          <input
            type="text"
            id="commas"
            placeholder="225/224, 385/384"
            v-model="commasString"
          />
        </div>

        <div class="control" v-show="method === 'vals' || method === 'commas'">
          <label for="subgroup">Subgroup / Prime limit</label>
          <input
            type="text"
            id="subgroup"
            :placeholder="method === 'vals' ? '2.3.5.7' : ''"
            v-model="subgroupString"
          />
        </div>
      </div>
      <div class="control-group">
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
        <div class="control">
          <button
            @click="calculateGenerators"
            :disabled="subgroupError.length !== 0"
          >
            Calculate generators
          </button>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="generate" :disabled="method !== 'generators'">
          OK
        </button>
        <button @click="$emit('cancel')">Cancel</button>
      </div>
    </template>
  </Modal>
</template>
