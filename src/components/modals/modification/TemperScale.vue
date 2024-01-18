<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from '@/constants'
import { Mapping, stretchToEdo, toPrimeMapping } from '@/tempering'
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import { Fraction, PRIME_CENTS } from 'xen-dev-utils'
import { mapByVal, resolveMonzo, tenneyVals, vanishCommas } from 'temperaments'
import { ExtendedMonzo, Interval, Scale, type IntervalOptions } from 'scale-workshop-core'
import { splitText } from '@/utils'
import { useTemperStore } from '@/stores/tempering'

const props = defineProps<{
  scale: Scale
  centsFractionDigits: number
}>()

const emit = defineEmits(['update:scale', 'cancel'])

const temper = useTemperStore()

const subgroupInput = ref<HTMLInputElement | null>(null)

watch(
  () => temper.subgroupError,
  (newValue) => subgroupInput.value!.setCustomValidity(newValue)
)

function modify() {
  try {
    if (temper.method === 'vals' && !temper.edoUnavailable && !temper.subgroupString.length) {
      const monzos = [...Array(props.scale.size + 1).keys()].map((i) =>
        temper.toLongMonzo(props.scale.getMonzo(i))
      )
      const octave = new Fraction(2)
      monzos.push(resolveMonzo(octave))
      const steps = mapByVal(monzos, temper.vals[0])
      const edo = steps.pop()
      let scale: Scale
      if (temper.convertToEdoSteps) {
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
      if (temper.method === 'mapping') {
        const vector = splitText(temper.mappingString).map((component) => parseFloat(component))
        while (vector.length < DEFAULT_NUMBER_OF_COMPONENTS) {
          vector.push(PRIME_CENTS[vector.length])
        }
        mapping = new Mapping(vector.slice(0, DEFAULT_NUMBER_OF_COMPONENTS))
      } else if (temper.method === 'vals') {
        if (temper.constraintsDisabled) {
          // Subgroup is too large to use geometric methods. Use O(n²) projection instead.
          const weights = temper.options.weights
          // True constraints are not supported so CTE is interpreted as POTE.
          const temperEquaves = temper.options.temperEquaves && temper.tempering !== 'CTE'
          const jip = temper.subgroup.jip()
          const valVectors = temper.vals.map((val) => temper.subgroup.fromWarts(val))
          let mappingVector = tenneyVals(valVectors, jip, weights)
          if (!temperEquaves) {
            mappingVector = mappingVector.map((m) => (jip[0] * m) / mappingVector[0])
          }
          mapping = new Mapping(toPrimeMapping(mappingVector, temper.subgroup))
        } else {
          mapping = Mapping.fromVals(
            temper.vals,
            DEFAULT_NUMBER_OF_COMPONENTS,
            temper.subgroup,
            temper.options
          )
        }
      } else {
        if (temper.constraintsDisabled) {
          // Subgroup is too large to use geometric methods. Use O(n) gradient descent instead.
          // True constraints are not supported so CTE is interpreted as pure equaves.
          const temperEquaves = temper.options.temperEquaves && temper.tempering !== 'CTE'
          const weights = temper.options.weights
          const jip = temper.subgroup.jip()
          const commaMonzos = temper.rawCommas.map(
            (comma) => temper.subgroup.toMonzoAndResidual(comma)[0]
          )
          const mappingVector = vanishCommas(commaMonzos, jip, weights, temperEquaves)
          mapping = new Mapping(toPrimeMapping(mappingVector, temper.subgroup))
        } else {
          mapping = Mapping.fromCommas(
            temper.commas,
            DEFAULT_NUMBER_OF_COMPONENTS,
            temper.subgroup,
            temper.options
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
      temper.error = error_.message
    } else {
      temper.error = '' + error_
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
      <div @click="temper.error = ''">
        <div class="control-group">
          <div class="control radio-group">
            <label>Method</label>
            <span>
              <input
                type="radio"
                id="method-mapping"
                value="mapping"
                @focus="temper.error = ''"
                v-model="temper.method"
              />
              <label for="method-mapping"> Mapping </label>
            </span>
            <span>
              <input
                type="radio"
                id="method-vals"
                value="vals"
                @focus="temper.error = ''"
                v-model="temper.method"
              />
              <label for="method-vals"> Vals </label>
            </span>

            <span>
              <input
                type="radio"
                id="method-commas"
                value="commas"
                @focus="temper.error = ''"
                v-model="temper.method"
              />
              <label for="method-commas"> Comma list </label>
            </span>
          </div>

          <div class="control" v-show="temper.method === 'mapping'">
            <label for="mapping">Mapping</label>
            <textarea
              id="mapping"
              @focus="temper.error = ''"
              v-model="temper.mappingString"
            ></textarea>
          </div>

          <div class="control" v-show="temper.method === 'vals'">
            <label for="vals">Vals</label>
            <input
              type="text"
              id="vals"
              placeholder="12 & 17c"
              @focus="temper.error = ''"
              v-model="temper.valsString"
            />
          </div>
          <div class="control" v-show="temper.method === 'vals'">
            <div class="radio-group">
              <span>
                <input
                  type="checkbox"
                  id="edo-steps"
                  :disabled="temper.edoUnavailable"
                  v-model="temper.convertToEdoSteps"
                />
                <label for="edo-steps" :class="{ disabled: temper.edoUnavailable }">
                  Convert to edo-steps</label
                >
              </span>
            </div>
          </div>

          <div class="control" v-show="temper.method === 'commas'">
            <label for="commas">Comma list</label>
            <input
              type="text"
              id="commas"
              placeholder="225/224, 1029/1024"
              @focus="temper.error = ''"
              v-model="temper.commasString"
            />
          </div>

          <div class="control" v-show="temper.method === 'vals' || temper.method === 'commas'">
            <label for="subgroup">Subgroup / Prime limit</label>
            <input
              type="text"
              ref="subgroupInput"
              id="subgroup"
              :placeholder="temper.method === 'vals' ? '2.3.5' : ''"
              @focus="temper.error = ''"
              v-model="temper.subgroupString"
            />
          </div>
        </div>
        <p
          class="section"
          :class="{ open: temper.showAdvanced }"
          @click="temper.showAdvanced = !temper.showAdvanced"
        >
          Advanced options
        </p>
        <div class="control-group" v-show="temper.showAdvanced">
          <div class="control radio-group">
            <span>
              <input
                type="radio"
                id="tempering-TE"
                value="TE"
                @focus="temper.error = ''"
                v-model="temper.tempering"
              />
              <label for="tempering-TE"> TE </label>
            </span>

            <span>
              <input
                type="radio"
                id="tempering-POTE"
                value="POTE"
                @focus="temper.error = ''"
                v-model="temper.tempering"
              />
              <label for="tempering-POTE"> POTE </label>
            </span>

            <span>
              <input
                type="radio"
                id="tempering-CTE"
                value="CTE"
                @focus="temper.error = ''"
                :disabled="temper.constraintsDisabled"
                v-model="temper.tempering"
              />
              <label for="tempering-CTE"> CTE </label>
            </span>
          </div>

          <div v-show="temper.tempering === 'CTE'" class="control">
            <label for="constraints">Constraints</label>
            <textarea
              id="constraints"
              @focus="temper.error = ''"
              :disabled="temper.constraintsDisabled"
              v-model="temper.constraintsString"
            ></textarea>
          </div>

          <div class="control">
            <label for="weights">Weights</label>
            <textarea
              id="weights"
              @focus="temper.error = ''"
              v-model="temper.weightsString"
            ></textarea>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="modify" :disabled="temper.error.length !== 0">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <span class="error" v-show="temper.error.length">⚠</span>
      </div>
    </template>
  </Modal>
</template>

<style>
.disabled {
  color: var(--color-text-mute);
}
</style>
