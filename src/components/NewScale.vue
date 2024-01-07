<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue';
import { useScaleStore } from '@/stores/scale';
import { useStateStore } from '@/stores/state';

const emit = defineEmits(['done'])

const scale = useScaleStore()
const state = useStateStore()

const CpsModal = defineAsyncComponent(
  () => import('@/components/modals/generation/CombinationProductSet.vue')
)
const EqualTemperamentModal = defineAsyncComponent(
  () => import('@/components/modals/generation/EqualTemperament.vue')
)

const showEqualTemperamentModal = ref(false)
const showCpsModal = ref(false)

function updateSourceAndHideModals(source: string) {
  scale.sourceText = source
  showEqualTemperamentModal.value = false
  showCpsModal.value = false
  scale.computeScale()
  emit('done')
}

function pelog() {
  scale.name = 'Normalised Pelog, Kunst, 1949. Average of 39 Javanese gamelans'
  scale.sourceText = '120.\n270.\n540.\n670.\n785.\n950.\n1215.'
  scale.computeScale()
  emit('done')
}

function slendro() {
  scale.name = 'Average of 30 measured slendro gamelans, W. Surjodiningrat et al., 1993.'
  scale.sourceText = '231.\n474.\n717.\n955.\n1208.'
  scale.computeScale()
  emit('done')
}

</script>
<template>
  <li class="btn-dropdown-group">
    <a class="btn" href="#">New scale ▼</a>
    <ul>
      <a href="#" @click="showEqualTemperamentModal = true"><li>Equal temperament</li></a>
      <a href="#" @click="showCpsModal = true"><li>Combination product set</li></a>
      <a href="#" @click="pelog"><li>Pelog</li></a>
      <a href="#" @click="slendro"><li>Slendro</li></a>
    </ul>
  </li>

<Teleport to="body">
  <EqualTemperamentModal
      v-if="showEqualTemperamentModal"
      :centsFractionDigits="state.centsFractionDigits"
      :decimalFractionDigits="state.decimalFractionDigits"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @cancel="showEqualTemperamentModal = false"
    />
    <CpsModal
      v-if="showCpsModal"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @cancel="showCpsModal = false"
    />
</Teleport>
</template>
