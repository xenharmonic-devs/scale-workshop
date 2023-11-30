<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS, MAX_GEO_SUBGROUP_SIZE } from '@/constants'
import { Mapping, stretchToEdo, toPrimeMapping } from '@/tempering'
import { computed, ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import { makeState } from '@/components/modals/tempering-state'
import { add, Fraction, PRIME_CENTS } from 'xen-dev-utils'
import { mapByVal, resolveMonzo, tenneyVals, vanishCommas } from 'temperaments'
import { ExtendedMonzo, Interval, Scale, type IntervalOptions } from 'scale-workshop-core'
import { splitText } from '@/utils'

const props = defineProps<{
  scale: Scale
  centsFractionDigits: number
}>()

const emit = defineEmits(['update:scale', 'cancel'])

// === Component state ===
const method = ref<'mapping' | 'vals' | 'commas'>('mapping')
const error = ref('')
const state = makeState(method)
// method: "mapping"
const mappingString = ref('1200, 1897.2143, 2788.8573')
// method: "vals"
const valsString = state.valsString
const convertToEdoSteps = ref(false)
// medhod: "commas"
const commasString = state.commasString
// Generic
const subgroupString = state.subgroupString
const subgroupError = state.subgroupError
const subgroupInput = ref<HTMLInputElement | null>(null)
// Advanced
const showAdvanced = ref(false)
const weightsString = state.weightsString
const tempering = state.tempering
const constraintsString = state.constraintsString

// === Computed state ===
const vals = state.vals
const rawCommas = state.rawCommas
const commas = state.commas
const subgroup = state.subgroup
const options = state.options
const edoUnavailable = computed(() => vals.value.length !== 1)

const constraintsDisabled = computed(() => subgroup.value.basis.length > MAX_GEO_SUBGROUP_SIZE)

watch(subgroupError, (newValue) => subgroupInput.value!.setCustomValidity(newValue))

// === Methods ===

// Expand out the residual in the `ExtendedMonzo` and ignore cents offsets
function toLongMonzo(monzo: ExtendedMonzo) {
  const base = resolveMonzo(monzo.residual)
  return add(
    base,
    monzo.vector.map((component) => component.valueOf())
  )
}

function modify() {
  try {
    if (method.value === 'vals' && !edoUnavailable.value && !subgroupString.value.length) {
      const monzos = [...Array(props.scale.size + 1).keys()].map((i) =>
        toLongMonzo(props.scale.getMonzo(i))
      )
      const octave = new Fraction(2)
      monzos.push(resolveMonzo(octave))
      const steps = mapByVal(monzos, vals.value[0])
      const edo = steps.pop()
      let scale: Scale
      if (convertToEdoSteps.value) {
        const options: IntervalOptions = {
          preferredEtDenominator: edo,
          preferredEtEquave: octave
        }
        const equave = new Interval(
          ExtendedMonzo.fromEqualTemperament(
            new Fraction(steps.pop()!, edo),
            octave,
            DEFAULT_NUMBER_OF_COMPONENTS
          ),
          'equal temperament',
          undefined,
          options
        )
        scale = new Scale(
          steps.map(
            (step) =>
              new Interval(
                ExtendedMonzo.fromEqualTemperament(
                  new Fraction(step, edo),
                  octave,
                  DEFAULT_NUMBER_OF_COMPONENTS
                ),
                'equal temperament',
                undefined,
                options
              )
          ),
          equave,
          props.scale.baseFrequency
        )
      } else {
        scale = stretchToEdo(props.scale, steps, edo!)
      }
      emit('update:scale', scale.mergeOptions({ centsFractionDigits: props.centsFractionDigits }))
    } else {
      let mapping: Mapping
      if (method.value === 'mapping') {
        const vector = splitText(mappingString.value).map((component) => parseFloat(component))
        while (vector.length < DEFAULT_NUMBER_OF_COMPONENTS) {
          vector.push(PRIME_CENTS[vector.length])
        }
        mapping = new Mapping(vector.slice(0, DEFAULT_NUMBER_OF_COMPONENTS))
      } else if (method.value === 'vals') {
        if (constraintsDisabled.value) {
          // Subgroup is too large to use geometric methods. Use O(n²) projection instead.
          const weights = options.value.weights
          // True constraints are not supported so CTE is interpreted as POTE.
          const temperEquaves = options.value.temperEquaves && tempering.value !== 'CTE'
          const jip = subgroup.value.jip()
          const valVectors = vals.value.map((val) => subgroup.value.fromWarts(val))
          let mappingVector = tenneyVals(valVectors, jip, weights)
          if (!temperEquaves) {
            mappingVector = mappingVector.map((m) => (jip[0] * m) / mappingVector[0])
          }
          mapping = new Mapping(toPrimeMapping(mappingVector, subgroup.value))
        } else {
          mapping = Mapping.fromVals(
            vals.value,
            DEFAULT_NUMBER_OF_COMPONENTS,
            subgroup.value,
            options.value
          )
        }
      } else {
        if (constraintsDisabled.value) {
          // Subgroup is too large to use geometric methods. Use O(n) gradient descent instead.
          // True constraints are not supported so CTE is interpreted as pure equaves.
          const temperEquaves = options.value.temperEquaves && tempering.value !== 'CTE'
          const weights = options.value.weights
          const jip = subgroup.value.jip()
          const commaMonzos = rawCommas.value.map(
            (comma) => subgroup.value.toMonzoAndResidual(comma)[0]
          )
          const mappingVector = vanishCommas(commaMonzos, jip, weights, temperEquaves)
          mapping = new Mapping(toPrimeMapping(mappingVector, subgroup.value))
        } else {
          mapping = Mapping.fromCommas(
            commas.value,
            DEFAULT_NUMBER_OF_COMPONENTS,
            subgroup.value,
            options.value
          )
        }
      }
      emit(
        'update:scale',
        mapping.apply(props.scale).mergeOptions({ centsFractionDigits: props.centsFractionDigits })
      )
    }
  } catch (error_) {
    if (error_ instanceof Error) {
      error.value = error_.message
    } else {
      error.value = '' + error_
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
            <textarea id="mapping" @focus="error = ''" v-model="mappingString"></textarea>
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
          <div class="control" v-show="method === 'vals'">
            <div class="radio-group">
              <span>
                <input
                  type="checkbox"
                  id="edo-steps"
                  :disabled="edoUnavailable"
                  v-model="convertToEdoSteps"
                />
                <label for="edo-steps" :class="{ disabled: edoUnavailable }">
                  Convert to edo-steps</label
                >
              </span>
            </div>
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

          <div class="control" v-show="method === 'vals' || method === 'commas'">
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
        <p class="section" :class="{ open: showAdvanced }" @click="showAdvanced = !showAdvanced">
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
                :disabled="constraintsDisabled"
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
              :disabled="constraintsDisabled"
              v-model="constraintsString"
            ></textarea>
          </div>

          <div class="control">
            <label for="weights">Weights</label>
            <textarea id="weights" @focus="error = ''" v-model="weightsString"></textarea>
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

<style>
.disabled {
  color: var(--color-text-mute);
}
</style>
