<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import { Temperament, tenneyVals, vanishCommas } from 'temperaments'
import { useTemperStore } from '@/stores/tempering'
import { useScaleStore } from '@/stores/scale'
import { useStateStore } from '@/stores/state'
import { setAndReportValidity } from '@/utils'

const emit = defineEmits(['done', 'cancel'])

const temper = useTemperStore()
const scale = useScaleStore()
const state = useStateStore()

const valsInput = ref<HTMLInputElement | null>(null)
const commasInput = ref<HTMLInputElement | null>(null)
const subgroupInput = ref<HTMLInputElement | null>(null)

watch(
  () => temper.valsError,
  (newValue) => setAndReportValidity(valsInput.value, newValue)
)
watch(
  () => temper.commasError,
  (newValue) => setAndReportValidity(commasInput.value, newValue)
)
watch(
  () => temper.subgroupError,
  (newValue) => setAndReportValidity(subgroupInput.value, newValue)
)

function modify(expand = true) {
  let mapping: number[] | undefined
  if (temper.method === 'vals') {
    if (temper.edoAvailable && temper.convertToEdoSteps) {
      scale.sourceText += `\n${temper.vals[0][0]}@${temper.subgroupString}`
    } else {
      if (temper.constraintsAvailable) {
        const temperament = Temperament.fromVals(temper.vals, temper.subgroup)
        mapping = temperament.getMapping(temper.options)
      } else {
        mapping = temper.subgroup.toPrimeMapping(
          tenneyVals(temper.vals, temper.subgroup, temper.weights, 'cents')
        )
      }
    }
  } else if (temper.method === 'commas') {
    if (temper.constraintsAvailable) {
      const temperament = Temperament.fromCommas(temper.commas, temper.subgroup, true)
      mapping = temperament.getMapping(temper.options)
    } else {
      const temperEquaves = temper.options.temperEquaves && temper.tempering !== 'CTE'
      mapping = temper.subgroup.toPrimeMapping(
        vanishCommas(
          temper.commas.map((c) => temper.subgroup.primeMonzoToSubgroupMonzo(c)),
          temper.subgroup,
          temper.weights,
          temperEquaves,
          'cents'
        )
      )
    }
  }
  if (temper.method === 'mapping') {
    scale.sourceText += `\nPrimeMapping(${temper.mappingString})`
  } else if (mapping) {
    scale.sourceText += `\nPrimeMapping(${mapping.map((c) => c.toFixed(state.centsFractionDigits)).join(', ')})`
  }
  if (expand) {
    const { visitor, defaults } = scale.getUserScopeVisitor()
    scale.sourceText = visitor.expand(defaults)
  }
  scale.computeScale()
  emit('done')
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
              <label for="method-mapping">Mapping</label>
            </span>
            <span>
              <input
                type="radio"
                id="method-vals"
                value="vals"
                @focus="temper.error = ''"
                v-model="temper.method"
              />
              <label for="method-vals">Vals</label>
            </span>

            <span>
              <input
                type="radio"
                id="method-commas"
                value="commas"
                @focus="temper.error = ''"
                v-model="temper.method"
              />
              <label for="method-commas">Comma list</label>
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
              ref="valsInput"
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
                  :disabled="!temper.edoAvailable"
                  v-model="temper.convertToEdoSteps"
                />
                <label for="edo-steps" :class="{ disabled: !temper.edoAvailable }">
                  Convert to edo-steps</label
                >
              </span>
            </div>
          </div>

          <div class="control" v-show="temper.method === 'commas'">
            <label for="commas">Comma list</label>
            <input
              ref="commasInput"
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
              ref="subgroupInput"
              type="text"
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
              <label for="tempering-TE">TE</label>
            </span>

            <span>
              <input
                type="radio"
                id="tempering-POTE"
                value="POTE"
                @focus="temper.error = ''"
                v-model="temper.tempering"
              />
              <label for="tempering-POTE">POTE</label>
            </span>

            <span>
              <input
                type="radio"
                id="tempering-CTE"
                value="CTE"
                @focus="temper.error = ''"
                :disabled="!temper.constraintsAvailable"
                v-model="temper.tempering"
              />
              <label for="tempering-CTE">CTE</label>
            </span>
          </div>

          <div v-show="temper.tempering === 'CTE'" class="control">
            <label for="constraints">Constraints</label>
            <textarea
              id="constraints"
              @focus="temper.error = ''"
              :disabled="!temper.constraintsAvailable"
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
        <button @click="modify(true)" :disabled="temper.error.length !== 0">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="modify(false)">Raw</button>
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
