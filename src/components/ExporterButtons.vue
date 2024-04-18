<script setup lang="ts">
import { APP_TITLE } from '@/constants'
import { exportFile, type ExporterKey } from '@/exporters'
import type { ExporterParams } from '@/exporters/base'
import { useScaleStore } from '@/stores/scale'
import { useStateStore } from '@/stores/state'
import { sanitizeFilename } from '@/utils'
import { defineAsyncComponent, ref } from 'vue'

const KorgExportModal = defineAsyncComponent(
  () => import('@/components/modals/export/KorgExport.vue')
)
const MtsSysexExportModal = defineAsyncComponent(
  () => import('@/components/modals/export/MtsSysexExport.vue')
)
const ReaperExportModal = defineAsyncComponent(
  () => import('@/components/modals/export/ReaperExport.vue')
)

const state = useStateStore()
const scale = useScaleStore()

const exportTextClipboard = ref('[URL sharing disabled]')
const showKorgExportModal = ref(false)
const showMtsSysexExportModal = ref(false)
const showReaperExportModal = ref(false)

function copyToClipboard() {
  exportTextClipboard.value = 'No!'
  window.setTimeout(() => {
    exportTextClipboard.value = '[URL sharing disabled]'
  }, 5000)
  /*
  window.navigator.clipboard.writeText(window.location.href)
  exportTextClipboard.value = '[Copied URL to clipboard]'
  window.setTimeout(() => {
    exportTextClipboard.value = "Copy this scale's unique URL to clipboard"
  }, 5000)
  */
}

function doExport(exporter: ExporterKey) {
  const params: ExporterParams = {
    newline: state.newline,
    name: scale.name,
    scaleUrl: window.location.href,
    filename: sanitizeFilename(scale.name),
    relativeIntervals: scale.relativeIntervals,
    scale: scale.scale,
    labels: scale.labels,
    midiOctaveOffset: -1,
    description: scale.name,
    sourceText: scale.sourceText,
    appTitle: APP_TITLE,
    date: new Date()
  }

  exportFile(exporter, params)
}
</script>
<template>
  <Teleport to="body">
    <KorgExportModal
      v-if="showKorgExportModal"
      @confirm="showKorgExportModal = false"
      @cancel="showKorgExportModal = false"
      :newline="state.newline"
      :scaleName="scale.name"
      :relativeIntervals="scale.relativeIntervals"
      :midiOctaveOffset="-1"
      :scale="scale.scale"
      :labels="scale.labels"
    />

    <MtsSysexExportModal
      v-if="showMtsSysexExportModal"
      @confirm="showMtsSysexExportModal = false"
      @cancel="showMtsSysexExportModal = false"
      :newline="state.newline"
      :scaleName="scale.name"
      :relativeIntervals="scale.relativeIntervals"
      :midiOctaveOffset="-1"
      :scale="scale.scale"
      :labels="scale.labels"
    />

    <ReaperExportModal
      v-if="showReaperExportModal"
      @confirm="showReaperExportModal = false"
      @cancel="showReaperExportModal = false"
      :newline="state.newline"
      :scaleName="scale.name"
      :relativeIntervals="scale.relativeIntervals"
      :midiOctaveOffset="-1"
      :scale="scale.scale"
      :labels="scale.labels"
    />
  </Teleport>
  <h2>Export current settings</h2>
  <a href="#" class="btn disabled" @click="copyToClipboard">
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
      Scale file for various synths.<br />If you use this file without an accompanying .kbm file,
      most synths will assume your scale starts on C ~261Hz
    </p>
  </a>
  <a href="#" class="btn" @click="doExport('scalakbm')">
    <p><strong>Scala keyboard mapping (.kbm)</strong></p>
    <p>Maps an accompanying .scl file to start on a specific MIDI note and frequency</p>
  </a>
  <a href="#" class="btn" @click="doExport('ableton')">
    <p><strong>Ableton scale (.ascl)</strong></p>
    <p>Scale file for Ableton Live 12</p>
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
    <p>Tuning formats for use with Monologue, Minilogue, Minilogue XD, and Prologue synthesizers</p>
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
  <h3>Documentation</h3>
  <p>
    You can read about the new syntax
    <a
      href="https://github.com/xenharmonic-devs/sonic-weave?tab=readme-ov-file#sonic-weave"
      target="_blank"
      >here</a
    >.
  </p>
  <p>
    Remember to check out the
    <a href="https://github.com/xenharmonic-devs/sonic-weave/tree/main/examples" target="_blank"
      >examples</a
    >
    too.
  </p>
</template>

<style scoped>
.btn {
  width: 100%;
  display: block;
  margin-bottom: 1rem;
  margin-left: 0;
}
</style>
