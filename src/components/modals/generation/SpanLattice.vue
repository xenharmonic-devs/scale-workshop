<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { DEFAULT_NUMBER_OF_COMPONENTS, OCTAVE } from '@/constants'
import Temperament from 'temperaments'
import { ExtendedMonzo, Interval, Scale, type IntervalOptions } from 'scale-workshop-core'
import { useLatticeStore } from '@/stores/tempering'
import { setAndReportValidity } from '@/utils'

const props = defineProps<{
  centsFractionDigits: number
}>()

const emit = defineEmits(['update:scale', 'update:scaleName', 'cancel'])

const lattice = useLatticeStore()

const basisElement = ref<HTMLInputElement | null>(null)
watch(
  () => lattice.basisError,
  (newError) => setAndReportValidity(basisElement.value, newError)
)

function fromCents(cents: number) {
  const options: IntervalOptions = {
    centsFractionDigits: props.centsFractionDigits
  }
  return new Interval(
    ExtendedMonzo.fromCents(cents, DEFAULT_NUMBER_OF_COMPONENTS),
    'cents',
    undefined,
    options
  )
}

function calculateGenerators() {
  let temperament: Temperament
  if (lattice.method === 'vals') {
    temperament = Temperament.fromVals(lattice.vals, lattice.subgroup)
  } else {
    temperament = Temperament.fromCommas(lattice.commas, lattice.subgroup)
  }
  const generators = temperament.periodGenerators(lattice.options)
  if (!generators.length) {
    alert('Unable to calculate generators.')
    return
  }

  lattice.equave = fromCents(generators[0])
  lattice.equaveString = lattice.equave.centsString()

  lattice.basisString = generators
    .slice(1)
    .map((generator) => fromCents(generator).centsString())
    .join(' ')

  lattice.method = 'generators'
}

function updateDimension(index: number, event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value)
  lattice.dimensions[index] = value
}

function flip(index: number) {
  const generator = lattice.basis[index].neg().mmod(
    lattice.equave.mergeOptions({
      centsFractionDigits: props.centsFractionDigits
    })
  )
  const newBasis = [...lattice.basis]
  newBasis.splice(index, 1, generator)
  lattice.basisString = newBasis.map((gen) => gen.toString()).join(' ')
}

function generate() {
  try {
    const scale = Scale.fromLattice(lattice.basis, lattice.dimensions, lattice.equave)
    let name = `Lattice (${lattice.dimensions.slice(0, lattice.basis.length)} of ${
      lattice.basisString
    }`
    if (lattice.basis.length === 0) {
      name = 'Lattice (unison'
    }
    if (!lattice.equave.equals(OCTAVE)) {
      name += ` over ${lattice.equave.toString()}`
    }
    name += ')'
    emit('update:scaleName', name)
    emit('update:scale', scale)
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message)
    } else {
      alert(error)
    }
  }
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
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
              v-model="lattice.method"
            />
            <label for="method-generators"> Generators </label>
          </span>

          <span>
            <input type="radio" id="method-vals" value="vals" v-model="lattice.method" />
            <label for="method-vals"> Vals </label>
          </span>

          <span>
            <input type="radio" id="method-commas" value="commas" v-model="lattice.method" />
            <label for="method-commas"> Comma list </label>
          </span>
        </div>
        <div class="control-group" v-show="lattice.method === 'generators'">
          <div class="control">
            <label for="basis">Generators</label>
            <input
              ref="basisElement"
              id="basis"
              type="text"
              class="control"
              placeholder="3 5 7"
              v-model="lattice.basisString"
            />
          </div>
          <label>Generators up from 1/1</label>
          <div
            class="control"
            v-for="(dimension, i) of lattice.dimensions.slice(0, lattice.basis.length)"
            :key="i"
          >
            <label>Generator {{ lattice.basis[i] }}</label>
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
              @update:value="lattice.equave = $event"
              v-model="lattice.equaveString"
              :defaultValue="OCTAVE"
            />
          </div>
        </div>
        <div class="control" v-show="lattice.method === 'vals'">
          <label for="vals">Vals</label>
          <input type="text" id="vals" placeholder="8d & 12 & 19" v-model="lattice.valsString" />
        </div>

        <div class="control" v-show="lattice.method === 'commas'">
          <label for="commas">Comma list</label>
          <input
            type="text"
            id="commas"
            placeholder="225/224, 385/384"
            v-model="lattice.commasString"
          />
        </div>

        <div class="control" v-show="lattice.method === 'vals' || lattice.method === 'commas'">
          <label for="subgroup">Subgroup / Prime limit</label>
          <input
            type="text"
            id="subgroup"
            :placeholder="lattice.method === 'vals' ? '2.3.5.7' : ''"
            v-model="lattice.subgroupString"
          />
        </div>
      </div>
      <div class="control-group">
        <div v-show="lattice.method === 'vals' || lattice.method === 'commas'">
          <p
            class="section"
            :class="{ open: lattice.showAdvanced }"
            @click="lattice.showAdvanced = !lattice.showAdvanced"
          >
            Advanced options
          </p>
          <div class="control-group" v-show="lattice.showAdvanced">
            <div class="control radio-group">
              <span>
                <input type="radio" id="tempering-TE" value="TE" v-model="lattice.tempering" />
                <label for="tempering-TE"> TE </label>
              </span>

              <span>
                <input type="radio" id="tempering-POTE" value="POTE" v-model="lattice.tempering" />
                <label for="tempering-POTE"> POTE </label>
              </span>

              <span>
                <input type="radio" id="tempering-CTE" value="CTE" v-model="lattice.tempering" />
                <label for="tempering-CTE"> CTE </label>
              </span>
            </div>

            <div v-show="lattice.tempering === 'CTE'" class="control">
              <label for="constraints">Constraints</label>
              <textarea id="constraints" v-model="lattice.constraintsString"></textarea>
            </div>

            <div class="control">
              <label for="weights">Weights</label>
              <textarea id="weights" v-model="lattice.weightsString"></textarea>
            </div>
          </div>
        </div>
        <div class="control" v-show="lattice.method === 'vals' || lattice.method === 'commas'">
          <button @click="calculateGenerators" :disabled="lattice.subgroupError.length !== 0">
            Calculate generators
          </button>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="generate" :disabled="lattice.method !== 'generators'">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
      </div>
    </template>
  </Modal>
</template>
