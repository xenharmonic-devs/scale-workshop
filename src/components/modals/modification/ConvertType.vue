<script setup lang="ts">
import type Scale from "@/scale";
import { onMounted, ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
import type { IntervalOptions, IntervalType } from "@/interval";
import { Fraction } from "xen-dev-utils";

const props = defineProps<{
  scale: Scale;
  centsFractionDigits: number;
  decimalFractionDigits: number;
}>();

const emit = defineEmits(["update:scale", "cancel"]);
const type = ref<IntervalType>("cents");
const centsFractionDigits = ref(3);
const decimalFractionDigits = ref(5);
const preferredNumerator = ref<number>(0);
const preferredDenominator = ref<number>(0);
const preferredEtDenominator = ref<number>(0);
const preferredEtEquaveNumerator = ref<number>(0);
const preferredEtEquaveDenominator = ref<number>(1);

onMounted(() => {
  centsFractionDigits.value = props.centsFractionDigits;
  decimalFractionDigits.value = props.decimalFractionDigits;
});

function modify() {
  const options: IntervalOptions = {
    centsFractionDigits: centsFractionDigits.value,
    decimalFractionDigits: decimalFractionDigits.value,
  };
  if (preferredNumerator.value) {
    options.preferredNumerator = preferredNumerator.value;
  }
  if (preferredDenominator.value) {
    options.preferredDenominator = preferredDenominator.value;
  }
  if (preferredEtDenominator.value) {
    options.preferredEtDenominator = preferredEtDenominator.value;
  }
  if (preferredEtEquaveNumerator.value) {
    options.preferredEtEquave = new Fraction(
      preferredEtEquaveNumerator.value,
      preferredEtEquaveDenominator.value
    );
  }

  emit("update:scale", props.scale.asType(type.value, options));
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Convert interval values</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Convert interval values to a different type.</p>
        <label for="type">Interval type</label>
        <select id="type" class="control" v-model="type">
          <option value="cents">Cents</option>
          <option value="ratio">Ratio</option>
          <option value="equal temperament">Equal temperament</option>
          <option value="decimal">Decimal ratio</option>
          <option value="monzo">Monzo</option>
        </select>

        <div class="control" v-if="type === 'cents'">
          <label for="cents-digits">Digits after decimal point</label>
          <input
            id="cents-digits"
            type="number"
            min="0"
            v-model="centsFractionDigits"
          />
        </div>

        <div class="control" v-if="type === 'decimal'">
          <label for="decimal-digits">Digits after decimal comma</label>
          <input
            id="decimal-digits"
            type="number"
            min="0"
            v-model="decimalFractionDigits"
          />
        </div>

        <div class="control" v-if="type === 'ratio'">
          <label for="numerator">Preferred numerator *</label>
          <input
            id="numerator"
            type="number"
            min="0"
            v-model="preferredNumerator"
          />
        </div>
        <div class="control" v-if="type === 'ratio'">
          <label for="denominator">Preferred denominator *</label>
          <input
            id="denominator"
            type="number"
            min="0"
            v-model="preferredDenominator"
          />
        </div>

        <div class="control" v-if="type === 'equal temperament'">
          <label for="edo">Preferred EDO *</label>
          <input
            id="edo"
            type="number"
            min="0"
            v-model="preferredEtDenominator"
          />
        </div>
        <div class="control" v-if="type === 'equal temperament'">
          <label for="eq-numerator">Preferred equave numerator *</label>
          <input
            id="eq-numeraotr"
            type="number"
            min="0"
            v-model="preferredEtEquaveNumerator"
          />
        </div>
        <div class="control" v-if="type === 'equal temperament'">
          <label for="eq-denominator">Preferred equave denominator</label>
          <input
            id="eq-denominator"
            type="number"
            min="1"
            v-model="preferredEtEquaveDenominator"
          />
        </div>

        <i v-if="type === 'ratio' || type === 'equal temperament'"
          >*) Value of 0 means no preference.</i
        >
      </div>
    </template>
  </Modal>
</template>
