<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { useScaleStore } from '@/stores/scale'
import { centString } from '@/utils'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['done', 'cancel'])

const modal = useModalStore()
const scale = useScaleStore()

const myCentsFractionDigits = ref(3)
const myDecimalFractionDigits = ref(5)

onMounted(() => {
  myCentsFractionDigits.value = scale.centsFractionDigits
  myDecimalFractionDigits.value = scale.decimalFractionDigits
})

function modify(expand = false) {
  scale.sourceText += '\n'
  if (modal.type === 'decimal') {
    scale.sourceText += `interval => decimal(interval, ${myDecimalFractionDigits.value}) lest interval`
  } else if (modal.type === 'fraction') {
    if (modal.fractionTolerance || modal.preferredNumerator || modal.preferredEtEquaveDenominator) {
      scale.sourceText += `interval => fraction(interval, ${modal.fractionTolerance ? centString(modal.fractionTolerance) : 'niente'}, ${modal.preferredNumerator}, ${modal.preferredDenominator}) lest interval`
    } else {
      scale.sourceText += 'interval => fraction(interval) lest interval'
    }
  } else if (modal.type === 'nedji') {
    scale.sourceText += `interval => nedji(interval, ${modal.preferredEtNumerator}, ${modal.preferredEtDenominator}, ${modal.preferredEtEquaveNumerator}, ${modal.preferredEtEquaveDenominator}) lest interval`
  } else if (modal.type === 'cents') {
    scale.sourceText += `interval => cents(interval, ${myCentsFractionDigits.value}) lest interval`
  } else {
    scale.sourceText += `interval => ${modal.type}(interval) lest interval`
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
      <h2>Convert interval values</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Convert interval values to a different type.</p>
        <div class="control">
          <label for="type">Interval type</label>
          <select id="type" class="control" v-model="modal.type">
            <option value="decimal">Decimal ratio</option>
            <option value="fraction">Fraction</option>
            <option value="nedji">NEDJI</option>
            <option value="cents">Cents</option>
            <option value="FJS">Functional Just System</option>
            <option value="absoluteFJS">Absolute FJS</option>
            <option value="monzo">Monzo</option>
          </select>
        </div>

        <div class="control" v-if="modal.type === 'cents'">
          <label for="cents-digits">Digits after decimal point</label>
          <input id="cents-digits" type="number" min="0" v-model="myCentsFractionDigits" />
        </div>

        <div class="control" v-if="modal.type === 'decimal'">
          <label for="decimal-digits">Digits after decimal comma</label>
          <input id="decimal-digits" type="number" min="0" v-model="myDecimalFractionDigits" />
        </div>

        <template v-if="modal.type === 'fraction'">
          <div class="control">
            <label for="tolerance">Tolerance in cents</label>
            <input
              id="tolerance"
              type="number"
              min="0"
              step="0.5"
              class="control"
              v-model="modal.fractionTolerance"
            />
          </div>
          <div class="control">
            <label for="numerator">Preferred numerator *</label>
            <input id="numerator" type="number" min="0" v-model="modal.preferredNumerator" />
          </div>
          <div class="control">
            <label for="denominator">Preferred denominator *</label>
            <input id="denominator" type="number" min="0" v-model="modal.preferredDenominator" />
          </div>
        </template>

        <template v-if="modal.type === 'nedji'">
          <div class="control">
            <label for="steps">Preferred number of steps *</label>
            <input id="steps" type="number" min="0" v-model="modal.preferredEtNumerator" />
          </div>
          <div class="control">
            <label for="edo">Preferred divisions (EDO) *</label>
            <input id="edo" type="number" min="0" v-model="modal.preferredEtDenominator" />
          </div>
          <div class="control" v-if="modal.type === 'nedji'">
            <label for="eq-numerator">Preferred equave numerator *</label>
            <input
              id="eq-numerator"
              type="number"
              min="0"
              v-model="modal.preferredEtEquaveNumerator"
            />
          </div>
          <div class="control" v-if="modal.type === 'nedji'">
            <label for="eq-denominator">Preferred equave denominator</label>
            <input
              id="eq-denominator"
              type="number"
              min="0"
              v-model="modal.preferredEtEquaveDenominator"
            />
          </div>
        </template>

        <i v-if="modal.type === 'fraction' || modal.type === 'nedji'"
          >*) Value of 0 means no preference.</i
        >
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="modify(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="modify(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>
