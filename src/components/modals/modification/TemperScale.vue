<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import { useTemperStore } from '@/stores/tempering'
import { useScaleStore } from '@/stores/scale'
import { setAndReportValidity } from '@/utils'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['done', 'cancel'])

const temper = useTemperStore()
const scale = useScaleStore()

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
  () => temper.edoAvailable,
  (newValue) => {
    if (!newValue) {
      temper.convertToEdoSteps = false
    }
  }
)

function modify(expand = true) {
  if (temper.method === 'vals') {
    if (temper.edoAvailable && temper.convertToEdoSteps) {
      scale.sourceText += `\n${temper.vals[0].toString()}`
    } else {
      scale.sourceText += `\n(* vals = ${temper.valsString}) *)`
      scale.sourceText += `\n${temper.valsTemperament.toString()}`
    }
  } else if (temper.method === 'commas') {
    scale.sourceText += `\n(* commas = ${temper.commasString}) *)`
    scale.sourceText += `\n${temper.commasTemperament.toString()}`
  }
  if (temper.method === 'mapping') {
    scale.sourceText += `\nPrimeMapping(${temper.mappingString})`
  } else if (!temper.convertToEdoSteps) {
    scale.sourceText += `\ncents(£, ${scale.centsFractionDigits})`
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
  <Modal :show="show" @confirm="modify" @cancel="$emit('cancel')">
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
    <template #footer>
      <div class="btn-group">
        <button
          @click="modify(true)"
          :disabled="temper.method !== 'mapping' && temper.error.length !== 0"
        >
          OK
        </button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="modify(false)">Raw</button>
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
