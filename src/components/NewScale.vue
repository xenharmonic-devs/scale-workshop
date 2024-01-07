<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue';
import { useScaleStore } from '@/stores/scale';
import DropdownGroup from '@/components/DropdownGroup.vue';
import { importFile, type ImporterKey } from '@/importers';

const emit = defineEmits(['done', 'mouseenter'])

const scale = useScaleStore()

const CpsModal = defineAsyncComponent(
  () => import('@/components/modals/generation/CombinationProductSet.vue')
)
const EnumerateModal = defineAsyncComponent(
  () => import('@/components/modals/generation/EnumerateChord.vue')
)
const EqualTemperamentModal = defineAsyncComponent(
  () => import('@/components/modals/generation/EqualTemperament.vue')
)
const EulerGenusModal = defineAsyncComponent(
  () => import('@/components/modals/generation/EulerGenus.vue')
)
const GeneratorSequenceModal = defineAsyncComponent(
  () => import('@/components/modals/generation/GeneratorSequence.vue')
)
const HarmonicSeriesModal = defineAsyncComponent(
  () => import('@/components/modals/generation/HarmonicSeries.vue')
)
const HistoricalModal = defineAsyncComponent(
  () => import('@/components/modals/generation/HistoricalScale.vue')
)
const LatticeModal = defineAsyncComponent(
  () => import('@/components/modals/generation/SpanLattice.vue')
)
const MosModal = defineAsyncComponent(
  () => import('@/components/modals/generation/MosScale.vue')
)
const PresetModal = defineAsyncComponent(
  () => import('@/components/modals/generation/LoadPreset.vue')
)
const RankTwoModal = defineAsyncComponent(
  () => import('@/components/modals/generation/RankTwo.vue')
)
const StackModal = defineAsyncComponent(
  () => import('@/components/modals/generation/StackSteps.vue')
)
const SubharmonicSeriesModal = defineAsyncComponent(
  () => import('@/components/modals/generation/SubharmonicSeries.vue')
)

const element = ref<typeof DropdownGroup | null>(null)
const scalaFile = ref<HTMLInputElement | null>(null)
const anamarkFile = ref<HTMLInputElement | null>(null)

const showCpsModal = ref(false)
const showEnumerateModal = ref(false)
const showEqualTemperamentModal = ref(false)
const showEulerGenusModal = ref(false)
const showGeneratorSequenceModal = ref(false)
const showHarmonicModal = ref(false)
const showHistoricalModal = ref(false)
const showLatticeModal = ref(false)
const showMosModal = ref(false)
const showPresetModal = ref(false)
const showRankTwoModal = ref(false)
const showStackModal = ref(false)
const showSubharmonicModal = ref(false)

function updateSourceAndHideModals(source: string) {
  scale.sourceText = source
  showCpsModal.value = false
  showEnumerateModal.value = false
  showEqualTemperamentModal.value = false
  showEulerGenusModal.value = false
  showGeneratorSequenceModal.value = false
  showHarmonicModal.value = false
  showHistoricalModal.value = false
  showLatticeModal.value = false
  showMosModal.value = false
  showPresetModal.value = false
  showRankTwoModal.value = false
  showStackModal.value = false
  showSubharmonicModal.value = false
  scale.computeScale()
  emit('done')
}

function clearScale() {
  scale.name = ''
  scale.sourceText = ''
  scale.computeScale()
  emit('done')
}

async function doImport(importerKey: ImporterKey, event: Event) {
  const result = await importFile(importerKey, event)
  scale.sourceText = result.sourceText
  if (result.baseFrequency !== undefined) {
    scale.userBaseFrequency = result.baseFrequency
    scale.autoFrequency = false
  }
  if (result.name !== undefined) {
    scale.name = result.name
  }
  if (result.baseMidiNote !== undefined) {
    scale.baseMidiNote = result.baseMidiNote
  }
  scale.computeScale()
  emit('done')
}

function blur() {
  if (!element.value) {
    return;
  }
  element.value.blur()
}

defineExpose({blur})
</script>
<template>
  <DropdownGroup ref="element" title="New scale" @mouseenter="$emit('mouseenter')">
    <ul>
      <a href="#" @click="showEqualTemperamentModal = true"><li>Equal temperament</li></a>
      <a href="#" @click="showRankTwoModal = true"><li>Rank-2 temperament</li></a>
      <a href="#" @click="showHarmonicModal = true"><li>Harmonic series segment</li></a>
      <a href="#" @click="showSubharmonicModal = true"><li>Subharmonic series segment</li></a>
      <a href="#" @click="showEnumerateModal = true"><li>Enumerate chord</li></a>
      <a href="#" @click="showStackModal = true"><li>Stack steps</li></a>
      <a href="#" @click="showCpsModal = true"><li>Combination product set</li></a>
      <a href="#" @click="showMosModal = true"><li>Moment of symmetry scale</li></a>
      <a href="#" @click="showHistoricalModal = true"><li>Historical temperament</li></a>
      <a href="#" @click="showEulerGenusModal = true"><li>Euler-Fokker genus</li></a>
      <a href="#" @click="showLatticeModal = true"><li>Span Lattice</li></a>
      <a href="#" @click="showGeneratorSequenceModal = true"><li>Generator sequence</li></a>
      <li class="divider"></li>
      <a href="#" @click="scalaFile!.click()"><li>Import .scl</li></a>
      <a href="#" @click="anamarkFile!.click()"><li>Import .tun</li></a>
      <li class="divider"></li>
      <a href="#" @click="clearScale"><li>Clear scale</li></a>
      <a href="#" @click="showPresetModal = true"><li>Load preset scale</li></a>
    </ul>
  </DropdownGroup>

  <!-- Hidden file inputs for importers -->
  <input
    type="file"
    ref="scalaFile"
    accept=".scl"
    style="display: none"
    @change="doImport('scalascl', $event)"
  />
  <input
    type="file"
    ref="anamarkFile"
    accept=".tun"
    style="display: none"
    @change="doImport('anamark', $event)"
  />

  <Teleport to="body">
    <EnumerateModal
      v-if="showEnumerateModal"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @cancel="showEnumerateModal = false"
    />
    <EqualTemperamentModal
      v-if="showEqualTemperamentModal"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @cancel="showEqualTemperamentModal = false"
    />
    <EulerGenusModal
      v-if="showEulerGenusModal"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @cancel="showEulerGenusModal = false"
    />
    <GeneratorSequenceModal
      v-if="showGeneratorSequenceModal"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @cancel="showGeneratorSequenceModal = false"
    />
    <CpsModal
      v-if="showCpsModal"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @cancel="showCpsModal = false"
    />
    <HarmonicSeriesModal
      v-if="showHarmonicModal"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @cancel="showHarmonicModal = false"
    />
    <HistoricalModal
      v-if="showHistoricalModal"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @update:baseFrequency="scale.baseFrequency = $event; scale.autoFrequency = false"
      @update:baseMidiNote="scale.baseMidiNote = $event;"
      @cancel="showHistoricalModal = false"
    />
    <LatticeModal
      v-if="showLatticeModal"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @cancel="showLatticeModal = false"
    />
    <MosModal
      v-if="showMosModal"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @cancel="showMosModal = false"
    />
    <PresetModal
      v-if="showPresetModal"
      @update:scaleName="scale.name = $event"
      @update:baseFrequency="scale.baseFrequency = $event; scale.autoFrequency = false"
      @update:baseMidiNote="scale.baseMidiNote = $event;"
      @update:source="updateSourceAndHideModals"
      @cancel="showPresetModal = false"
    />
    <RankTwoModal
      v-if="showRankTwoModal"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @cancel="showRankTwoModal = false"
    />
    <StackModal
      v-if="showStackModal"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @cancel="showStackModal = false"
    />
    <SubharmonicSeriesModal
      v-if="showSubharmonicModal"
      @update:scaleName="scale.name = $event"
      @update:source="updateSourceAndHideModals"
      @cancel="showSubharmonicModal = false"
    />
  </Teleport>
</template>
