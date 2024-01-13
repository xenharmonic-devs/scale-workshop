<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import TuningTable from '@/components/TuningTable.vue'
import { debounce, autoKeyColors } from '@/utils'
import ScaleRule from '@/components/ScaleRule.vue'
import { APP_TITLE } from '@/constants'
import { sanitizeFilename, midiNoteNumberToName } from '@/utils'
import { exportFile, type ExporterKey } from '@/exporters'
import Modal from '@/components/ModalDialog.vue'
import { presets, presetsByGroup } from '@/presets'
import { importFile, type ImporterKey } from '@/importers'
import { mtof } from 'xen-dev-utils'
import type { Scale } from 'scale-workshop-core'
import { useStateStore } from '@/stores/state'
import { useModalStore } from '@/stores/modal'
import { useApproximateByRatiosStore } from '@/stores/approximate-by-ratios'

// Export
const KorgExportModal = defineAsyncComponent(
  () => import('@/components/modals/export/KorgExport.vue')
)
const MtsSysexExportModal = defineAsyncComponent(
  () => import('@/components/modals/export/MtsSysexExport.vue')
)
const ReaperExportModal = defineAsyncComponent(
  () => import('@/components/modals/export/ReaperExport.vue')
)
const ShareUrlModal = defineAsyncComponent(() => import('@/components/modals/ShareUrl.vue'))
// Generation
const CpsModal = defineAsyncComponent(
  () => import('@/components/modals/generation/CombinationProductSet.vue')
)
const CrossPolytopeModal = defineAsyncComponent(
  () => import('@/components/modals/generation/CrossPolytope.vue')
)
const DwarfModal = defineAsyncComponent(
  () => import('@/components/modals/generation/DwarfScale.vue')
)
const EnumerateChordModal = defineAsyncComponent(
  () => import('@/components/modals/generation/EnumerateChord.vue')
)
const EqualTemperamentModal = defineAsyncComponent(
  () => import('@/components/modals/generation/EqualTemperament.vue')
)
const EulerGenusModal = defineAsyncComponent(
  () => import('@/components/modals/generation/EulerGenus.vue')
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
const MosModal = defineAsyncComponent(() => import('@/components/modals/generation/MosScale.vue'))
const RankTwoModal = defineAsyncComponent(
  () => import('@/components/modals/generation/RankTwo.vue')
)
const SubharmonicSeriesModal = defineAsyncComponent(
  () => import('@/components/modals/generation/SubharmonicSeries.vue')
)
// Modification
const ApproximateByHarmonicsModal = defineAsyncComponent(
  () => import('@/components/modals/modification/ApproximateByHarmonics.vue')
)
const ApproximateByRatiosModal = defineAsyncComponent(
  () => import('@/components/modals/modification/ApproximateByRatios.vue')
)
const ApproximateBySubharmonicsModal = defineAsyncComponent(
  () => import('@/components/modals/modification/ApproximateBySubharmonics.vue')
)
const ConvertModal = defineAsyncComponent(
  () => import('@/components/modals/modification/ConvertType.vue')
)
const EqualizeModal = defineAsyncComponent(
  () => import('@/components/modals/modification/EqualizeScale.vue')
)
const OffsetModal = defineAsyncComponent(
  () => import('@/components/modals/modification/MergeOffset.vue')
)
const RandomVarianceModal = defineAsyncComponent(
  () => import('@/components/modals/modification/RandomVariance.vue')
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

const state = useStateStore()
const modal = useModalStore()
const approx = useApproximateByRatiosStore()

const joinedLines = computed({
  get() {
    return state.scaleLines.join('\n')
  },
  set: debounce((newValue: string) => {
    state.scaleLines = newValue.split('\n')
  })
})

const joinedKeyColors = computed({
  get() {
    return state.keyColors.join(' ')
  },
  set: debounce((newValue: string) => {
    state.keyColors = newValue.split(' ')
  })
})

const baseFrequency = computed({
  get: () => state.scale.baseFrequency,
  set: debounce((newValue: number) => {
    if (typeof newValue === 'number' && !isNaN(newValue) && isFinite(newValue)) {
      state.scale.baseFrequency = newValue
    }
  })
})

const baseMidiNote = computed({
  get: () => state.baseMidiNote,
  set: debounce((newValue: number) => {
    if (typeof newValue === 'number' && !isNaN(newValue)) {
      state.baseMidiNote = newValue
    }
  })
})

const midiNoteNumber = ref<HTMLInputElement | null>(null)

function autoFrequency() {
  let baseMidiNote = state.baseMidiNote
  if (midiNoteNumber.value !== null) {
    // Circumvent debouncing for this simple click
    baseMidiNote = parseInt(midiNoteNumber.value.value)
    if (isNaN(baseMidiNote)) {
      return
    }
  }

  state.scale.baseFrequency = mtof(baseMidiNote)
}

function doExport(exporter: ExporterKey) {
  const params = {
    newline: state.newline,
    name: state.scaleName,
    scaleUrl: window.location.href,
    scale: state.scale,
    filename: sanitizeFilename(state.scaleName),
    baseMidiNote: state.baseMidiNote,
    midiOctaveOffset: state.midiOctaveOffset,
    description: state.scaleName,
    lines: state.scaleLines,
    appTitle: APP_TITLE,
    date: new Date()
  }

  exportFile(exporter, params)
}

const showKorgExportModal = ref(false)
const showReaperExportModal = ref(false)
const showMtsSysexExportModal = ref(false)
const showShareUrlModal = ref(false)
const shareUrlModal = ref<any>(null)

const presetGroups = presetsByGroup()
const presetSelect = ref<HTMLSelectElement | null>(null)
const showPresetModal = ref(false)
function selectPreset() {
  const preset = presets[presetSelect.value!.value]
  state.scaleName = preset.name
  state.scaleLines = preset.lines
  state.scale.baseFrequency = preset.baseFrequency
  state.baseMidiNote = preset.baseMidiNote
  state.keyColors = preset.keyColors
}

const showEqualTemperamentModal = ref(false)
const showHarmonicSeriesModal = ref(false)
const showMosModal = ref(false)
const showSubharmonicSeriesModal = ref(false)
const showEnumerateChordModal = ref(false)
const showCpsModal = ref(false)
const showLatticeModal = ref(false)
const showEulerGenusModal = ref(false)
const showDwarfModal = ref(false)
const showRankTwoModal = ref(false)
const showCrossPolytopeModal = ref(false)
const showHistoricalModal = ref(false)

const showRotateModal = ref(false)
const showSubsetModal = ref(false)
const showStretchModal = ref(false)
const showRandomVarianceModal = ref(false)
const showApproximateByHarmonicsModal = ref(false)
const showApproximateBySubharmonicsModal = ref(false)
const showTemperModal = ref(false)
const showEqualizeModal = ref(false)
const showOffsetModal = ref(false)
const showConvertModal = ref(false)
const showApproximateByRatiosModal = ref(false)

const scaleDataArea = ref<HTMLTextAreaElement | null>(null)
const subsetModal = ref<any>(null)

const scalaFile = ref<HTMLInputElement | null>(null)
const anamarkFile = ref<HTMLInputElement | null>(null)

const exportTextClipboard = ref("Copy this scale's unique URL to clipboard")

async function doImport(importerKey: ImporterKey, event: Event) {
  const result = await importFile(importerKey, event)
  state.scaleLines = result.scale.toStrings()
  if (importerKey != 'scalascl') {
    state.scale.baseFrequency = result.scale.baseFrequency
  }
  if (result.name !== undefined) {
    state.scaleName = result.name
  }
  if (result.baseMidiNote !== undefined) {
    state.baseMidiNote = result.baseMidiNote
  }
}

function copyToClipboard() {
  window.navigator.clipboard.writeText(window.location.href)
  exportTextClipboard.value = '[Copied URL to clipboard]'
  window.setTimeout(() => {
    exportTextClipboard.value = "Copy this scale's unique URL to clipboard"
  }, 5000)
}

// Actions that would take multiple lines in template code and get ruined by auto-formatting

function clearScale() {
  state.scaleName = ''
  joinedLines.value = ''
  scaleDataArea.value!.focus()
}

function sortAscending() {
  state.scale = state.scale.sorted()
  scaleDataArea.value!.focus()
}

function clickReduce() {
  state.scale = state.scale.reduce()
  scaleDataArea.value!.focus()
}

function clickInvert() {
  state.scale = state.scale.invert()
  scaleDataArea.value!.focus()
}

function clickRotate() {
  modal.initialize(state.scale.size)
  showRotateModal.value = true
}

function clickSubset() {
  modal.initialize(state.scale.size)
  showSubsetModal.value = true
}

function clickApproximateByRatios() {
  approx.initialize()
  showApproximateByRatiosModal.value = true
}

function clickShareUrl() {
  showShareUrlModal.value = true
  shareUrlModal.value.initialize()
}

function updateScaleAndHideModals(scale: Scale) {
  state.scale = scale
  showRankTwoModal.value = false
  showEqualTemperamentModal.value = false
  showHarmonicSeriesModal.value = false
  showMosModal.value = false
  showSubharmonicSeriesModal.value = false
  showEnumerateChordModal.value = false
  showCpsModal.value = false
  showEulerGenusModal.value = false
  showDwarfModal.value = false
  showCrossPolytopeModal.value = false
  showLatticeModal.value = false
  showHistoricalModal.value = false
  showRotateModal.value = false
  showSubsetModal.value = false
  showStretchModal.value = false
  showRandomVarianceModal.value = false
  showApproximateByHarmonicsModal.value = false
  showApproximateBySubharmonicsModal.value = false
  showEqualizeModal.value = false
  showTemperModal.value = false
  showOffsetModal.value = false
  showConvertModal.value = false
}

function confirmPreset() {
  showPresetModal.value = false
  selectPreset()
}
</script>

<template>
  <div id="tab-build-scale" class="columns-container">
    <div class="column scale-builder">
      <textarea
        id="scale-name"
        rows="1"
        placeholder="Untitled scale"
        v-model="state.scaleName"
      ></textarea>

      <ul class="btn-group">
        <li class="btn-dropdown-group">
          <a class="btn" href="#">New scale ▼</a>
          <ul>
            <a href="#" @click="showEqualTemperamentModal = true"><li>Equal temperament</li></a>
            <a href="#" @click="showRankTwoModal = true"><li>Rank-2 temperament</li></a>
            <a href="#" @click="showHarmonicSeriesModal = true"><li>Harmonic series segment</li></a>
            <a href="#" @click="showSubharmonicSeriesModal = true"
              ><li>Subharmonic series segment</li></a
            >
            <a href="#" @click="showEnumerateChordModal = true"><li>Enumerate chord</li></a>
            <a href="#" @click="showCpsModal = true"><li>Combination product set</li></a>
            <a href="#" @click="showMosModal = true"><li>Moment of symmetry scale</li></a>
            <a href="#" @click="showHistoricalModal = true"><li>Historical temperament</li></a>
            <a href="#" @click="showEulerGenusModal = true"><li>Euler-Fokker genus</li></a>
            <a href="#" @click="showDwarfModal = true"><li>Dwarf scale</li></a>
            <a href="#" @click="showCrossPolytopeModal = true"><li>Cross-polytope</li></a>
            <a href="#" @click="showLatticeModal = true"><li>Span lattice</li></a>
            <li class="divider"></li>
            <a href="#" @click="scalaFile?.click()"><li>Import .scl</li></a>
            <a href="#" @click="anamarkFile?.click()"><li>Import .tun</li></a>
            <li class="divider"></li>
            <a href="#" @click="clearScale"><li>Clear scale</li></a>
            <a href="#" @click="showPresetModal = true"><li>Load preset scale</li></a>
          </ul>
        </li>
        <li class="btn-dropdown-group">
          <a class="btn" href="#">Modify scale ▼</a>
          <ul>
            <a href="#" @click="sortAscending"><li>Sort ascending</li></a>
            <a href="#" @click="clickReduce"><li>Reduce</li></a>
            <a href="#" @click="clickInvert"><li>Invert</li></a>
            <a href="#" @click="clickRotate"><li>Rotate</li></a>
            <a href="#" @click="clickSubset"><li>Subset</li></a>
            <a href="#" @click="showStretchModal = true"><li>Stretch/compress</li></a>
            <a href="#" @click="showRandomVarianceModal = true"><li>Random variance</li></a>
            <a href="#" @click="clickApproximateByRatios"><li>Approximate by ratios</li></a>
            <a href="#" @click="showApproximateByHarmonicsModal = true"
              ><li>Approximate by harmonics</li></a
            >
            <a href="#" @click="showApproximateBySubharmonicsModal = true"
              ><li>Approximate by subharmonics</li></a
            >
            <a href="#" @click="showEqualizeModal = true"><li>Equalize</li></a>
            <a href="#" @click="showTemperModal = true"><li>Temper</li></a>
            <a href="#" @click="showOffsetModal = true"><li>Merge offset</li></a>
            <a href="#" @click="showConvertModal = true"><li>Convert interval values</li></a>
          </ul>
        </li>
      </ul>

      <div class="control-group">
        <h2>Scale data</h2>
        <div class="control">
          <textarea id="scale-data" ref="scaleDataArea" rows="12" v-model="joinedLines"></textarea>
        </div>
      </div>

      <ScaleRule :scale="state.scale" />

      <div class="control-group">
        <h2>Tuning</h2>

        <div class="control">
          <label>Base frequency</label>
          <input
            class="real-valued"
            type="number"
            min="0.1"
            step="0.1"
            max="1000000"
            v-model="baseFrequency"
          />
          <button @click="autoFrequency">Auto</button>
          <span>Hz</span>
        </div>

        <div class="control">
          <label>MIDI note for base frequency</label>
          <input
            type="number"
            ref="midiNoteNumber"
            min="0"
            max="127"
            step="1"
            v-model="baseMidiNote"
          />
          <span>{{ midiNoteNumberToName(baseMidiNote, state.midiOctaveOffset) }}</span>
        </div>

        <!-- This control is for the 3rd field that is found at the top of kbm files -->
        <!--<div class="control">
          <label>MIDI note for 1/1</label>
          <input
            class="real-valued"
            type="number"
            min="0"
            step="1"
            max="127"
          />
          <span>A5</span>
        </div>-->
      </div>

      <div class="control-group">
        <h2>Key colors</h2>
        <div class="control">
          <p>
            A list of key colors, ascending from 1/1. Key colors are cosmetic only; they do not
            affect mapping.
          </p>
          <textarea v-model="joinedKeyColors"></textarea>
        </div>
        <div class="control">
          <button @click="state.keyColors = autoKeyColors(state.scale.size)">Auto</button>
        </div>
      </div>
    </div>
    <TuningTable
      :scale="state.scale"
      :frequencies="state.frequencies"
      :lines="state.scaleLines"
      :baseMidiNote="state.baseMidiNote"
      :keyColors="state.keyColors"
    />
    <div class="column exporters">
      <h2>Export current settings</h2>
      <a href="#" class="btn" @click="copyToClipboard">
        <p><strong>Share scale</strong></p>
        <p>{{ exportTextClipboard }}</p>
      </a>
      <a href="#" class="btn" @click="doExport('anamarkv1')">
        <p><strong>AnaMark v1 tuning (.tun)</strong></p>
        <p>Tuning file for various synths</p>
      </a>
      <a href="#" class="btn" @click="doExport('anamarkv2')">
        <p><strong>AnaMark v2 tuning (.tun)</strong></p>
        <p>Tuning file for various synths</p>
      </a>
      <a href="#" class="btn" @click="doExport('scalascl')">
        <p><strong>Scala scale (.scl)</strong></p>
        <p>
          Scale file for various synths.<br />If you use this file without an accompanying .kbm
          file, most synths will assume your scale starts on C ~261Hz
        </p>
      </a>
      <a href="#" class="btn" @click="doExport('scalakbm')">
        <p><strong>Scala keyboard mapping (.kbm)</strong></p>
        <p>Maps an accompanying .scl file to start on a specific MIDI note and frequency</p>
      </a>
      <a href="#" class="btn" @click="doExport('maxmsp')">
        <p><strong>Max/MSP coll tuning (.txt)</strong></p>
        <p>List of frequencies (Hz) in a text file to load into a Max/MSP coll object</p>
      </a>
      <a href="#" class="btn" @click="doExport('puredata')">
        <p><strong>PureData text tuning (.txt)</strong></p>
        <p>List of frequencies (Hz) in a text file to load into a PureData text object</p>
      </a>
      <a href="#" class="btn" @click="doExport('kontakt')">
        <p><strong>Kontakt tuning script (.txt)</strong></p>
        <p>
          Tuning script for Native Instruments Kontakt. Some instrument libraries allow this custom
          script
        </p>
      </a>
      <a href="#" class="btn" @click="doExport('soniccouture')">
        <p><strong>Soniccouture tuning file (.nka)</strong></p>
        <p>For Soniccouture sample libraries</p>
      </a>
      <a href="#" class="btn" @click="doExport('harmor')">
        <p><strong>Harmor pitch map (.fnv)</strong></p>
        <p>Envelope state file for the pitch envelope in Image-Line Harmor</p>
      </a>
      <a href="#" class="btn" @click="doExport('sytrus')">
        <p><strong>Sytrus pitch map (.fnv)</strong></p>
        <p>Envelope state file for the pitch envelope in Image-Line Sytrus</p>
      </a>
      <a href="#" class="btn" @click="showKorgExportModal = true">
        <p><strong>Korg Sound Librarian scale (.mnlgtuns + others)</strong></p>
        <p>Tuning formats for use with Monologue, Minilogue,</p>
        <p>Minilogue XD, and Prologue synthesizers</p>
      </a>
      <a href="#" class="btn" @click="doExport('deflemask')">
        <p><strong>Deflemask reference (.txt)</strong></p>
        <p>List of 'fine tune' values for Deflemask</p>
      </a>
      <a href="#" class="btn" @click="showReaperExportModal = true">
        <p><strong>Reaper note name map (.txt)</strong></p>
        <p>Displays custom note names on Reaper's piano roll</p>
      </a>
      <a href="#" class="btn" @click="showMtsSysexExportModal = true">
        <p><strong>MTS Sysex Bulk Tuning Dump (.syx)</strong></p>
        <p>Binary data of a Bulk Tuning Dump SysEx message</p>
      </a>
      <a href="#" class="btn" @click="clickShareUrl">
        <p><strong>Share scale (email etc.)</strong></p>
        <p>Conveniently share this scale's unique URL</p>
      </a>
    </div>
  </div>

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
    <KorgExportModal
      v-if="showKorgExportModal"
      @confirm="showKorgExportModal = false"
      @cancel="showKorgExportModal = false"
      :newline="state.newline"
      :scaleName="state.scaleName"
      :baseMidiNote="baseMidiNote"
      :midiOctaveOffset="state.midiOctaveOffset"
      :scale="state.scale"
    />

    <ReaperExportModal
      v-if="showReaperExportModal"
      @confirm="showReaperExportModal = false"
      @cancel="showReaperExportModal = false"
      :newline="state.newline"
      :scaleName="state.scaleName"
      :baseMidiNote="baseMidiNote"
      :midiOctaveOffset="state.midiOctaveOffset"
      :scale="state.scale"
    />

    <MtsSysexExportModal
      v-if="showMtsSysexExportModal"
      @confirm="showMtsSysexExportModal = false"
      @cancel="showMtsSysexExportModal = false"
      :newline="state.newline"
      :scaleName="state.scaleName"
      :baseMidiNote="baseMidiNote"
      :midiOctaveOffset="state.midiOctaveOffset"
      :scale="state.scale"
    />

    <RankTwoModal
      v-if="showRankTwoModal"
      :centsFractionDigits="state.centsFractionDigits"
      :scale="state.scale"
      @update:scaleName="state.scaleName = $event"
      @update:scale="updateScaleAndHideModals"
      @update:keyColors="state.keyColors = $event"
      @cancel="showRankTwoModal = false"
    />

    <HistoricalModal
      v-if="showHistoricalModal"
      :centsFractionDigits="state.centsFractionDigits"
      :accidentalStyle="state.accidentalPreference"
      @update:scaleName="state.scaleName = $event"
      @update:scale="updateScaleAndHideModals"
      @update:baseFrequency="state.scale.baseFrequency = $event"
      @update:baseMidiNote="state.baseMidiNote = $event"
      @update:keyColors="state.keyColors = $event"
      @cancel="showHistoricalModal = false"
    />

    <ShareUrlModal
      ref="shareUrlModal"
      v-if="showShareUrlModal"
      :scaleName="state.scaleName"
      :newline="state.newline"
      @confirm="showShareUrlModal = false"
      @cancel="showShareUrlModal = false"
    />

    <EqualTemperamentModal
      v-if="showEqualTemperamentModal"
      :centsFractionDigits="state.centsFractionDigits"
      :decimalFractionDigits="state.decimalFractionDigits"
      @update:scaleName="state.scaleName = $event"
      @update:scale="updateScaleAndHideModals"
      @cancel="showEqualTemperamentModal = false"
    />

    <HarmonicSeriesModal
      v-if="showHarmonicSeriesModal"
      @update:scaleName="state.scaleName = $event"
      @update:scale="updateScaleAndHideModals"
      @cancel="showHarmonicSeriesModal = false"
    />

    <MosModal
      v-if="showMosModal"
      @update:scaleName="state.scaleName = $event"
      @update:scale="updateScaleAndHideModals"
      @update:keyColors="state.keyColors = $event"
      @cancel="showMosModal = false"
    />

    <SubharmonicSeriesModal
      v-if="showSubharmonicSeriesModal"
      @update:scaleName="state.scaleName = $event"
      @update:scale="updateScaleAndHideModals"
      @cancel="showSubharmonicSeriesModal = false"
    />

    <EnumerateChordModal
      v-if="showEnumerateChordModal"
      @update:scaleName="state.scaleName = $event"
      @update:scale="updateScaleAndHideModals"
      @cancel="showEnumerateChordModal = false"
    />

    <CpsModal
      v-if="showCpsModal"
      @update:scaleName="state.scaleName = $event"
      @update:scale="updateScaleAndHideModals"
      @cancel="showCpsModal = false"
    />

    <EulerGenusModal
      v-if="showEulerGenusModal"
      @update:scaleName="state.scaleName = $event"
      @update:scale="updateScaleAndHideModals"
      @cancel="showEulerGenusModal = false"
    />

    <DwarfModal
      v-if="showDwarfModal"
      @update:scaleName="state.scaleName = $event"
      @update:scale="updateScaleAndHideModals"
      @cancel="showDwarfModal = false"
    />

    <CrossPolytopeModal
      v-if="showCrossPolytopeModal"
      @update:scaleName="state.scaleName = $event"
      @update:scale="updateScaleAndHideModals"
      @cancel="showCrossPolytopeModal = false"
    />
    <LatticeModal
      v-if="showLatticeModal"
      :centsFractionDigits="state.centsFractionDigits"
      @update:scaleName="state.scaleName = $event"
      @update:scale="updateScaleAndHideModals"
      @cancel="showLatticeModal = false"
    />

    <Modal :show="showPresetModal" @confirm="confirmPreset" @cancel="showPresetModal = false">
      <template #header>
        <h2>Load preset scale</h2>
      </template>
      <template #body>
        <div class="control-group">
          <div class="control">
            <select ref="presetSelect" size="10" class="control">
              <optgroup v-for="group of presetGroups" :key="group.name" :label="group.name">
                <option v-for="preset of group.members" :key="preset.id" :value="preset.id">
                  {{ preset.title }}
                </option>
              </optgroup>
            </select>
          </div>
        </div>
      </template>
    </Modal>

    <RotateModal
      v-if="showRotateModal"
      @update:scale="updateScaleAndHideModals"
      @cancel="showRotateModal = false"
      :scale="state.scale"
    />

    <SubsetModal
      ref="subsetModal"
      v-if="showSubsetModal"
      @update:scale="updateScaleAndHideModals"
      @cancel="showSubsetModal = false"
      :scale="state.scale"
    />

    <StretchModal
      v-if="showStretchModal"
      @update:scale="updateScaleAndHideModals"
      @cancel="showStretchModal = false"
      :scale="state.scale"
      :centsFractionDigits="state.centsFractionDigits"
      :decimalFractionDigits="state.decimalFractionDigits"
    />

    <RandomVarianceModal
      v-if="showRandomVarianceModal"
      @update:scale="updateScaleAndHideModals"
      @cancel="showRandomVarianceModal = false"
      :scale="state.scale"
      :centsFractionDigits="state.centsFractionDigits"
      :decimalFractionDigits="state.decimalFractionDigits"
    />

    <ApproximateByRatiosModal
      v-if="showApproximateByRatiosModal"
      @update:scale="state.scale = $event"
      @cancel="showApproximateByRatiosModal = false"
      :scale="state.scale"
    />

    <ApproximateByHarmonicsModal
      v-if="showApproximateByHarmonicsModal"
      @update:scale="updateScaleAndHideModals"
      @cancel="showApproximateByHarmonicsModal = false"
      :scale="state.scale"
    />

    <ApproximateBySubharmonicsModal
      v-if="showApproximateBySubharmonicsModal"
      @update:scale="updateScaleAndHideModals"
      @cancel="showApproximateBySubharmonicsModal = false"
      :scale="state.scale"
    />

    <EqualizeModal
      v-if="showEqualizeModal"
      @update:scale="updateScaleAndHideModals"
      @cancel="showEqualizeModal = false"
      :scale="state.scale"
    />

    <TemperModal
      v-if="showTemperModal"
      @update:scale="updateScaleAndHideModals"
      @cancel="showTemperModal = false"
      :scale="state.scale"
      :centsFractionDigits="state.centsFractionDigits"
    />

    <OffsetModal
      v-if="showOffsetModal"
      @update:scale="updateScaleAndHideModals"
      @cancel="showOffsetModal = false"
      :scale="state.scale"
    />

    <ConvertModal
      v-if="showConvertModal"
      @update:scale="updateScaleAndHideModals"
      @cancel="showConvertModal = false"
      :scale="state.scale"
      :centsFractionDigits="state.centsFractionDigits"
      :decimalFractionDigits="state.decimalFractionDigits"
    />
  </Teleport>
</template>

<style scoped>
/* Content layout (small) */
div.columns-container {
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-border);
}
div.column {
  background-color: var(--color-background);
  overflow-x: hidden;
}
div.scale-builder {
  padding: 1rem;
}
div.tuning-table {
  padding: 0rem;
}
div.exporters {
  padding: 1rem;
}

/* Content layout (medium) */
@media screen and (min-width: 600px) {
  div.columns-container {
    column-count: 2;
    column-gap: 1px;
    overflow: hidden;
  }
  div.column {
    overflow-y: auto;
  }
  div.scale-builder {
    width: 100%;
    height: 100%;
  }
  div.tuning-table {
    width: 100%;
    height: 66%;
  }
  div.exporters {
    width: 100%;
    height: 34%;
    border-top: 1px solid var(--color-border);
  }
}

/* Content layout (large) */
@media screen and (min-width: 1100px) {
  div.columns-container {
    column-count: 3;
  }
  div.column {
    height: 100%;
  }
  div.exporters {
    border: none;
  }
}

/* UI elements */
#scale-name {
  width: 100%;
  font-size: 1.4em;
  margin-bottom: 1rem;
  padding: 0.3rem;
  font-family: sans-serif;
  resize: vertical;
}
div.exporters .btn {
  width: 100%;
  display: block;
  margin-bottom: 1rem;
  margin-left: 0;
}

select optgroup + optgroup {
  margin-top: 1em;
}

.real-valued:invalid {
  background-color: var(--color-background);
}
</style>
