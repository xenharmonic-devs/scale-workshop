<script setup lang="ts">
import { Interval, intervalValueAs } from 'sonic-weave/interval'
import { computed, reactive, ref } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { OCTAVE } from '@/constants'
import { useLatticeStore, type LatticeGenerator } from '@/stores/tempering'
import { arrayToString, centString, expandCode, parseInterval, setAndReportValidity } from '@/utils'
import { mmod } from 'xen-dev-utils/fraction'
import { useScaleStore } from '@/stores/scale'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

const lattice = useLatticeStore()
const scale = useScaleStore()

const generatorDrafts = reactive(new WeakMap<LatticeGenerator, string>())
const canGenerate = computed(
  () => lattice.method === 'generators' && lattice.generators.every(({ interval }) => interval)
)
const valsInput = ref<HTMLInputElement | null>(null)
const commasInput = ref<HTMLInputElement | null>(null)
const subgroupInput = ref<HTMLInputElement | null>(null)

function updateGenerator(generator: LatticeGenerator, event: Event) {
  const input = event.target as HTMLInputElement
  generatorDrafts.set(generator, input.value)
  let error = ''
  try {
    generator.interval = input.value.trim() ? parseInterval(input.value) : null
  } catch (cause) {
    generator.interval = null
    error = cause instanceof Error ? cause.message : String(cause)
  }
  setAndReportValidity(input, error)
}

function calculateGenerators() {
  const generators = lattice.temperament.generators
  if (!generators.length) {
    return
  }
  if (lattice.method === 'vals') {
    lattice.comment = `vals = ${lattice.valsString}`
  } else if (lattice.method === 'commas') {
    lattice.comment = `commas = ${lattice.commasString}`
  } else {
    lattice.comment = ''
  }
  const period = generators.shift()!
  for (let i = 0; i < generators.length; ++i) {
    generators[i] = mmod(generators[i], period)
  }

  lattice.equaveString = centString(period, scale.centsFractionDigits)
  lattice.equave = parseInterval(lattice.equaveString)

  lattice.setGenerators(
    generators.map((g) => parseInterval(centString(g, scale.centsFractionDigits)))
  )
  lattice.method = 'generators'
}

function updateCount(generator: LatticeGenerator, count: 'up' | 'down', event: Event) {
  generator[count] = parseInt((event.target as HTMLInputElement).value)
}

function flip(generator: LatticeGenerator) {
  const interval = generator.interval
  if (!interval) {
    return
  }
  const value = interval.value.inverse().reduce(lattice.equave.value)
  const node = intervalValueAs(value, interval.node)
  generator.interval = new Interval(value, interval.domain, 0, node, interval)
  generatorDrafts.delete(generator)
}

function generate(expand = true) {
  if (!canGenerate.value) {
    return
  }
  const { generators } = lattice
  const basis = generators.flatMap(({ interval }) => (interval ? [interval] : []))
  const ups = generators.map(({ up }) => up)
  const downs = generators.map(({ down }) => down)
  const dimensions = generators.map(({ up, down }) => 1 + up + down)
  let source = ''
  if (lattice.comment.length) {
    source = `(* ${lattice.comment} *)\n`
  }
  source += `parallelotope(${arrayToString(basis)}, ${arrayToString(ups)}, ${arrayToString(downs)}, ${lattice.equave.toString()})`
  let name = `Parallelotope (${dimensions} of ${basis.map((interval) => interval.toString()).join(' ')}`
  if (basis.length === 0) {
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
}
</script>

<template>
  <Modal :show="show" @confirm="generate" @cancel="$emit('cancel')">
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
          <fieldset
            v-for="(generator, i) of lattice.generators"
            :key="generator.id"
            class="generator-group"
          >
            <legend>Generator {{ i + 1 }}</legend>
            <div class="control">
              <label :for="`generator-${i}`">Interval</label>
              <input
                :id="`generator-${i}`"
                type="text"
                placeholder="3/2"
                :value="generatorDrafts.get(generator) ?? generator.interval?.toString() ?? ''"
                @input="updateGenerator(generator, $event)"
              />
              <button @click="flip(generator)" :disabled="!generator.interval">Flip</button>
              <button @click="lattice.generators.splice(i, 1)">Remove</button>
            </div>
            <div class="control-group twin-controls">
              <div class="control">
                <label :for="`generator-up-${i}`">Up from 1/1</label>
                <input
                  :id="`generator-up-${i}`"
                  type="number"
                  min="0"
                  max="99"
                  :value="generator.up"
                  @input="updateCount(generator, 'up', $event)"
                />
              </div>
              <div class="control">
                <label :for="`generator-down-${i}`">Down from 1/1</label>
                <input
                  :id="`generator-down-${i}`"
                  type="number"
                  min="0"
                  max="99"
                  :value="generator.down"
                  @input="updateCount(generator, 'down', $event)"
                />
              </div>
            </div>
          </fieldset>
          <button @click="lattice.addGenerator">Add generator</button>
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
          <input
            ref="valsInput"
            type="text"
            id="vals"
            placeholder="8d & 12 & 19"
            v-model="lattice.valsString"
          />
        </div>

        <div class="control" v-show="lattice.method === 'commas'">
          <label for="commas">Comma list</label>
          <input
            ref="commasInput"
            type="text"
            id="commas"
            placeholder="225/224, 385/384"
            v-model="lattice.commasString"
          />
        </div>

        <div class="control" v-show="lattice.method === 'vals' || lattice.method === 'commas'">
          <label for="subgroup">Subgroup / Prime limit</label>
          <input
            ref="subgroupInput"
            type="text"
            id="subgroup"
            :placeholder="lattice.method === 'vals' ? '2.3.5.7' : ''"
            v-model="lattice.subgroupString"
          />
        </div>
      </div>
      <div class="control-group" v-show="lattice.method === 'vals' || lattice.method === 'commas'">
        <div class="control radio-group">
          <span>
            <input type="radio" id="tempering-TE" value="TE" v-model="lattice.optimizationScheme" />
            <label for="tempering-TE">TE</label>
          </span>

          <span>
            <input
              type="radio"
              id="tempering-POTE"
              value="POTE"
              v-model="lattice.optimizationScheme"
            />
            <label for="tempering-POTE">POTE</label>
          </span>

          <span>
            <input
              type="radio"
              id="tempering-CTE"
              value="CTE"
              v-model="lattice.optimizationScheme"
            />
            <label for="tempering-CTE">CTE</label>
          </span>
        </div>
        <p
          class="section"
          :class="{ open: lattice.showAdvanced }"
          @click="lattice.showAdvanced = !lattice.showAdvanced"
        >
          Advanced options
        </p>
        <div class="control" v-show="lattice.showAdvanced">
          <label for="weights">Weights for {{ lattice.subgroupLabel }}</label>
          <textarea id="weights" v-model="lattice.weightsString"></textarea>
        </div>
        <p class="warning">{{ lattice.error }}</p>
        <div class="control" v-show="lattice.method === 'vals' || lattice.method === 'commas'">
          <button @click="calculateGenerators" :disabled="!!lattice.error.length">
            Calculate generators
          </button>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="generate(true)" :disabled="!canGenerate">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="generate(false)" :disabled="!canGenerate">Raw</button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.generator-group {
  min-width: 0;
}

.generator-group input {
  min-width: 0;
  width: 0;
}

.generator-group .control-group {
  margin: 0.5rem 0 0;
}

p.warning {
  height: 3em;
  overflow-y: hidden;
}
</style>
