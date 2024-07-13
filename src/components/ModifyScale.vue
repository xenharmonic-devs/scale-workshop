<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { useScaleStore } from '@/stores/scale'
import { useModalStore } from '@/stores/modal'
import { useApproximateByRatiosStore } from '@/stores/approximate-by-ratios'
import DropdownGroup from '@/components/DropdownGroup.vue'
import { capitalizeFirstLetter } from '@/utils'

const emit = defineEmits(['done', 'mouseenter'])

const scale = useScaleStore()
const modal = useModalStore()
const approx = useApproximateByRatiosStore()

const ApproximateByHarmonicsModal = defineAsyncComponent(
  () => import('@/components/modals/modification/ApproximateByHarmonics.vue')
)

const ApproximateByRatiosModal = defineAsyncComponent(
  () => import('@/components/modals/modification/ApproximateByRatios.vue')
)

const ApproximateBySubharmonicsModal = defineAsyncComponent(
  () => import('@/components/modals/modification/ApproximateBySubharmonics.vue')
)

const CoalesceModal = defineAsyncComponent(
  () => import('@/components/modals/modification/CoalesceDuplicates.vue')
)

const ConvertModal = defineAsyncComponent(
  () => import('@/components/modals/modification/ConvertType.vue')
)

const EnumerateModal = defineAsyncComponent(
  () => import('@/components/modals/modification/EnumerateScale.vue')
)

const EqualizeModal = defineAsyncComponent(
  () => import('@/components/modals/modification/EqualizeScale.vue')
)

const ExpandModal = defineAsyncComponent(
  () => import('@/components/modals/modification/ExpandScale.vue')
)

const MergeOffsetsModal = defineAsyncComponent(
  () => import('@/components/modals/modification/MergeOffsets.vue')
)

const RandomModal = defineAsyncComponent(
  () => import('@/components/modals/modification/RandomVariance.vue')
)

const RepeatModal = defineAsyncComponent(
  () => import('@/components/modals/modification/RepeatScale.vue')
)

const RotateModal = defineAsyncComponent(
  () => import('@/components/modals/modification/RotateScale.vue')
)

const StretchModal = defineAsyncComponent(
  () => import('@/components/modals/modification/StretchScale.vue')
)

const SubsetModal = defineAsyncComponent(
  () => import('@/components/modals/modification/TakeSubset.vue')
)

const TemperModal = defineAsyncComponent(
  () => import('@/components/modals/modification/TemperScale.vue')
)

const element = ref<typeof DropdownGroup | null>(null)

const showApproximateByHarmonicsModal = ref(false)
const showApproximateByRatiosModal = ref(false)
const showApproximateBySubharmonicsModal = ref(false)
const showConvertModal = ref(false)
const showCoalesceModal = ref(false)
const showEnumerateModal = ref(false)
const showEqualizeModal = ref(false)
const showExpandModal = ref(false)
const showMergeOffsetsModal = ref(false)
const showRandomModal = ref(false)
const showRepeatModal = ref(false)
const showRotateModal = ref(false)
const showStretchModal = ref(false)
const showSubsetModal = ref(false)
const showTemperModal = ref(false)

function closeModals() {
  showApproximateByHarmonicsModal.value = false
  showApproximateByRatiosModal.value = false
  showApproximateBySubharmonicsModal.value = false
  showConvertModal.value = false
  showCoalesceModal.value = false
  showEnumerateModal.value = false
  showEqualizeModal.value = false
  showExpandModal.value = false
  showMergeOffsetsModal.value = false
  showRandomModal.value = false
  showRepeatModal.value = false
  showRotateModal.value = false
  showStretchModal.value = false
  showSubsetModal.value = false
  showTemperModal.value = false
  emit('done')
}

function expandAndQuit() {
  const { visitor, defaults } = scale.getUserScopeVisitor()
  scale.sourceText = visitor.expand(defaults)
  scale.computeScale()
  emit('done')
}

function sort() {
  scale.sourceText += ';sort()'
  expandAndQuit()
}

function reduce() {
  scale.sourceText += ';reduce()'
  expandAndQuit()
}

function retrovert() {
  scale.sourceText += ';retrovert()'
  expandAndQuit()
}

function clickRotate() {
  modal.initialize(scale.scale.size)
  showRotateModal.value = true
}

function clickSubset() {
  modal.initialize(scale.scale.size)
  showSubsetModal.value = true
}

function clickApproximateByRatios() {
  approx.initialize(scale.sourceText)
  showApproximateByRatiosModal.value = true
}

function blur() {
  if (!element.value) {
    return
  }
  element.value.blur()
}

defineExpose({ blur })
</script>
<template>
  <DropdownGroup ref="element" title="Modify scale" @mouseenter="$emit('mouseenter')">
    <ul>
      <a href="#" @click="showExpandModal = true"><li>Expand/simplify lines</li></a>
      <a href="#" @click="sort"><li>Sort ascending</li></a>
      <a href="#" @click="reduce"
        ><li>{{ capitalizeFirstLetter(scale.nameOfEquave) }} reduce</li></a
      >
      <a href="#" @click="retrovert"><li>Retrovert (negative harmony)</li></a>
      <a href="#" @click="clickRotate"><li>Rotate mode</li></a>
      <a href="#" @click="showRepeatModal = true"><li>Repeat</li></a>
      <a href="#" @click="clickSubset"><li>Subset</li></a>
      <a href="#" @click="showStretchModal = true"><li>Stretch/compress</li></a>
      <a href="#" @click="showRandomModal = true"><li>Random variance</li></a>
      <a href="#" @click="showEnumerateModal = true"><li>Enumerate</li></a>
      <a href="#" @click="showCoalesceModal = true"><li>Coalesce duplicates</li></a>
      <a href="#" @click="clickApproximateByRatios"><li>Approximate by ratios</li></a>
      <a href="#" @click="showApproximateByHarmonicsModal = true"
        ><li>Approximate by harmonics</li></a
      >
      <a href="#" @click="showApproximateBySubharmonicsModal = true"
        ><li>Approximate by subharmonics</li></a
      >
      <a href="#" @click="showEqualizeModal = true"><li>Equalize</li></a>
      <a href="#" @click="showTemperModal = true"><li>Temper</li></a>
      <a href="#" @click="showMergeOffsetsModal = true"><li>Merge offsets</li></a>
      <a href="#" @click="showConvertModal = true"><li>Convert interval values</li></a>
    </ul>
  </DropdownGroup>

  <Teleport to="body">
    <ApproximateByHarmonicsModal
      v-if="showApproximateByHarmonicsModal"
      :show="showApproximateByHarmonicsModal"
      @done="closeModals"
      @cancel="showApproximateByHarmonicsModal = false"
    />
    <ApproximateByRatiosModal
      v-if="showApproximateByRatiosModal"
      :show="showApproximateByRatiosModal"
      @done="closeModals"
      @cancel="showApproximateByRatiosModal = false"
    />
    <ApproximateBySubharmonicsModal
      v-if="showApproximateBySubharmonicsModal"
      :show="showApproximateBySubharmonicsModal"
      @done="closeModals"
      @cancel="showApproximateBySubharmonicsModal = false"
    />
    <CoalesceModal
      v-if="showCoalesceModal"
      :show="showCoalesceModal"
      @done="closeModals"
      @cancel="showCoalesceModal = false"
    />
    <ConvertModal
      v-if="showConvertModal"
      :show="showConvertModal"
      @done="closeModals"
      @cancel="showConvertModal = false"
    />
    <EnumerateModal
      v-if="showEnumerateModal"
      :show="showEnumerateModal"
      @done="closeModals"
      @cancel="showEnumerateModal = false"
    />
    <EqualizeModal
      v-if="showEqualizeModal"
      :show="showEqualizeModal"
      @done="closeModals"
      @cancel="showEqualizeModal = false"
    />
    <ExpandModal
      v-if="showExpandModal"
      :show="showExpandModal"
      @done="closeModals"
      @cancel="showExpandModal = false"
    />
    <MergeOffsetsModal
      v-if="showMergeOffsetsModal"
      :show="showMergeOffsetsModal"
      @done="closeModals"
      @cancel="showMergeOffsetsModal = false"
    />
    <RandomModal
      v-if="showRandomModal"
      :show="showRandomModal"
      @done="closeModals"
      @cancel="showRandomModal = false"
    />
    <RepeatModal
      v-if="showRepeatModal"
      :show="showRepeatModal"
      @done="closeModals"
      @cancel="showRepeatModal = false"
    />
    <RotateModal
      v-if="showRotateModal"
      :show="showRotateModal"
      @done="closeModals"
      @cancel="showRotateModal = false"
    />
    <StretchModal
      v-if="showStretchModal"
      :show="showStretchModal"
      @done="closeModals"
      @cancel="showStretchModal = false"
    />
    <SubsetModal
      v-if="showSubsetModal"
      :show="showSubsetModal"
      @done="closeModals"
      @cancel="showSubsetModal = false"
    />
    <TemperModal
      v-if="showTemperModal"
      :show="showTemperModal"
      @done="closeModals"
      @cancel="showTemperModal = false"
    />
  </Teleport>
</template>
