<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { OCTAVE } from '@/constants'
import Temperament from 'temperaments'
import { useLatticeStore } from '@/stores/tempering'
import { setAndReportValidity } from '@/utils'
import { useStateStore } from '@/stores/state'
import { arrayToString, expandCode, parseInterval } from '@/utils'
import { Interval, intervalValueAs } from 'sonic-weave'

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

const lattice = useLatticeStore()
const state = useStateStore()

const basisElement = ref<HTMLInputElement | null>(null)
watch(
  () => lattice.basisError,
  (newError) => setAndReportValidity(basisElement.value, newError)
)

function calculateGenerators() {
  let temperament: Temperament
  if (lattice.method === 'vals') {
    temperament = Temperament.fromVals(lattice.vals, lattice.subgroup)
  } else {
    temperament = Temperament.fromCommas(lattice.commas, lattice.subgroup)
  }
  let periodGenerators: number[]
  try {
    periodGenerators = temperament.periodGenerators(lattice.options)
  } catch {
    alert('Unable to calculate generators.')
    return
  }

  lattice.equaveString = periodGenerators[0].toFixed(state.centsFractionDigits)
  lattice.equave = parseInterval(lattice.equaveString)

  lattice.basisString = periodGenerators
    .slice(1)
    .map((g) => g.toFixed(state.centsFractionDigits))
    .join(' ')
  lattice.method = 'generators'
}

function updateUps(index: number, event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value)
  lattice.ups[index] = value
}

function updateDowns(index: number, event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value)
  lattice.downs[index] = value
}

function flip(index: number) {
  const b = lattice.basis[index]
  const domain = b.domain
  const generator = b.value.inverse().reduce(lattice.equave.value)
  const node = intervalValueAs(generator, b.node)
  const newBasis = [...lattice.basis]
  newBasis.splice(index, 1, new Interval(generator, domain, 0, node, b))
  lattice.basisString = newBasis.map((gen) => gen.toString()).join(' ')
}

function generate(expand = true) {
  try {
    const source = `parallelotope(${arrayToString(lattice.basis)}, ${arrayToString(lattice.ups)}, ${arrayToString(lattice.downs)}, ${lattice.equave.toString()})`
    let name = `Parallelotope (${lattice.dimensions} of ${lattice.basisString}`
    if (lattice.basis.length === 0) {
      name = 'Parallelotope (unison'
    }
    if (!lattice.equave.equals(OCTAVE)) {
      name += ` over ${lattice.equave.toString()}`
    }
    name += ')'
    emit('update:scaleName', name)
    if (expand) {
      emit('update:source', expandCode(source))
    } else {
      emit('update:source', source)
    }
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
      <h2>Generate parallelotope</h2>
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
            <label for="method-generators">Generators</label>
          </span>

          <span>
            <input type="radio" id="method-vals" value="vals" v-model="lattice.method" />
            <label for="method-vals">Vals</label>
          </span>

          <span>
            <input type="radio" id="method-commas" value="commas" v-model="lattice.method" />
            <label for="method-commas">Comma list</label>
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
          <label>Generators up/down from 1/1</label>
          <div class="control" v-for="(_, i) of lattice.basis" :key="i">
            <label>Generator {{ lattice.basis[i].toString() }}</label>
            <button @click="flip(i)">Flip</button>
            <input
              type="number"
              min="0"
              max="99"
              :value="lattice.ups[i]"
              @input="updateUps(i, $event)"
            />
            <input
              type="number"
              min="0"
              max="99"
              :value="lattice.downs[i]"
              @input="updateDowns(i, $event)"
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
                <label for="tempering-TE">TE</label>
              </span>

              <span>
                <input type="radio" id="tempering-POTE" value="POTE" v-model="lattice.tempering" />
                <label for="tempering-POTE">POTE</label>
              </span>

              <span>
                <input type="radio" id="tempering-CTE" value="CTE" v-model="lattice.tempering" />
                <label for="tempering-CTE">CTE</label>
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
        <button @click="generate(true)" :disabled="lattice.method !== 'generators'">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="generate(false)" :disabled="lattice.method !== 'generators'">Raw</button>
      </div>
    </template>
  </Modal>
</template>
