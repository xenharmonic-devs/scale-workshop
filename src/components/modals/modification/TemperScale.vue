<script setup lang="ts">
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import { useStageInput } from '@/rack/stage-input'
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import { useTemperStore } from '@/stores/tempering'
import { useScaleStore } from '@/stores/scale'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['preview', 'done', 'cancel'])

const temper = useTemperStore()
const scale = useScaleStore()
const input = useStageInput()

const valsInput = ref<HTMLInputElement | null>(null)
const commasInput = ref<HTMLInputElement | null>(null)
const subgroupInput = ref<HTMLInputElement | null>(null)

watch(
  () => temper.edoAvailable,
  (newValue) => {
    if (!newValue) {
      temper.convertToEdoSteps = false
    }
  }
)

function build(): GeneratorResult {
  let code = ''
  if (temper.method === 'vals') {
    if (temper.edoAvailable && temper.convertToEdoSteps) {
      code += `\n${temper.vals[0].toString()}`
    } else {
      code += `\n(* vals = ${temper.valsString}) *)`
      code += `\n${temper.valsTemperament.toString()}`
    }
  } else if (temper.method === 'commas') {
    code += `\n(* commas = ${temper.commasString}) *)`
    code += `\n${temper.commasTemperament.toString()}`
  }
  if (temper.method === 'mapping') {
    code += `\nPrimeMapping(${temper.mappingString})`
  } else if (!temper.convertToEdoSteps) {
    code += `\ncents(£, ${scale.centsFractionDigits})`
  }
  return { source: code.trim(), name: `By ${temper.method}` }
}

useGeneratorPreview(
  build,
  (result) => emit('preview', result),
  () => input.value.code
)
</script>

<template>
  <Modal :show="show" embedded>
    <template #header>
      <h2>Temper scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control radio-group">
          <label>Method</label>
          <span>
            <input type="radio" id="method-mapping" value="mapping" v-model="temper.method" />
            <label for="method-mapping">Mapping</label>
          </span>
          <span>
            <input type="radio" id="method-vals" value="vals" v-model="temper.method" />
            <label for="method-vals">Vals</label>
          </span>

          <span>
            <input type="radio" id="method-commas" value="commas" v-model="temper.method" />
            <label for="method-commas">Comma list</label>
          </span>
        </div>

        <div class="control" v-show="temper.method === 'mapping'">
          <label for="mapping">Mapping</label>
          <textarea id="mapping" v-model="temper.mappingString"></textarea>
        </div>

        <div class="control" v-show="temper.method === 'vals'">
          <label for="vals">Vals</label>
          <input
            ref="valsInput"
            type="text"
            id="vals"
            placeholder="12 & 17c"
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
            v-model="temper.subgroupString"
          />
        </div>
      </div>
      <div class="control-group" v-show="temper.method === 'vals' || temper.method === 'commas'">
        <div class="control radio-group">
          <span>
            <input
              type="radio"
              id="tempering-TE"
              value="TE"
              :disabled="temper.convertToEdoSteps"
              v-model="temper.optimizationScheme"
            />
            <label for="tempering-TE">TE</label>
          </span>

          <span>
            <input
              type="radio"
              id="tempering-POTE"
              value="POTE"
              :disabled="temper.convertToEdoSteps"
              v-model="temper.optimizationScheme"
            />
            <label for="tempering-POTE">POTE</label>
          </span>

          <span>
            <input
              type="radio"
              id="tempering-CTE"
              value="CTE"
              :disabled="temper.convertToEdoSteps"
              v-model="temper.optimizationScheme"
            />
            <label for="tempering-CTE">CTE</label>
          </span>
        </div>

        <p
          class="section"
          :class="{ open: temper.showAdvanced }"
          @click="temper.showAdvanced = !temper.showAdvanced"
        >
          Advanced options
        </p>
        <div class="control" v-show="temper.showAdvanced">
          <label for="weights">Weights for {{ temper.subgroupLabel }}</label>
          <textarea
            id="weights"
            :disabled="temper.convertToEdoSteps"
            v-model="temper.weightsString"
          ></textarea>
        </div>
        <p class="warning">{{ temper.error }}</p>
      </div>
    </template>
  </Modal>
</template>

<style>
.disabled {
  color: var(--color-text-mute);
}
p.warning {
  height: 3em;
  overflow-y: hidden;
}
</style>
