<script setup lang="ts">
import { API_URL, APP_TITLE, IS_SAFARI } from '@/constants'
import { exportFile, type ExporterKey } from '@/exporters'
import type { ExporterParams } from '@/exporters/base'
import { useAudioStore } from '@/stores/audio'
import { useCyclesStore } from '@/stores/edo-cycles'
import { useGridStore } from '@/stores/grid'
import { useJiLatticeStore } from '@/stores/ji-lattice'
import { useScaleStore } from '@/stores/scale'
import { useStateStore } from '@/stores/state'
import { makeEnvelope, sanitizeFilename } from '@/utils'
import { computed, defineAsyncComponent, ref } from 'vue'

const ScalaExportModal = defineAsyncComponent(
  () => import('@/components/modals/export/ScalaExport.vue')
)

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
const audio = useAudioStore()
const jiLattice = useJiLatticeStore()
const grid = useGridStore()
const cycles = useCyclesStore()

const exportTextClipboard = ref(
  API_URL ? "Copy this scale's unique URL to clipboard" : '[URL sharing disabled]'
)
const showScalaExportModal = ref(false)
const showKorgExportModal = ref(false)
const showMtsSysexExportModal = ref(false)
const showReaperExportModal = ref(false)

const uploadBody = computed(() => {
  return JSON.stringify({
    id: scale.id,
    payload: {
      scale: scale.toJSON(),
      audio: audio.toJSON(),
      state: state.toJSON(),
      'ji-lattice': jiLattice.toJSON(),
      grid: grid.toJSON(),
      'edo-cycles': cycles.toJSON()
    },
    envelope: makeEnvelope(state.shareStatistics)
  })
})

const uploadedScaleUrl = computed(() => `${window.location.origin}/scale/${scale.uploadedId}`)

function uploadScale(retries = 1): Promise<string> {
  const uploadId = scale.id
  if (scale.uploadedId === uploadId) {
    return Promise.resolve(`${window.location.origin}/scale/${uploadId}`)
  }
  return new Promise((resolve) => {
    if (!API_URL) {
      return resolve(window.location.origin)
    }
    fetch(new URL('scale', API_URL), { method: 'POST', body: uploadBody.value })
      .then((res) => {
        // Id collision: Retry
        if (res.status === 409 && retries > 0) {
          scale.rerollId()
          return uploadScale(retries - 1).then(resolve)
        }
        if (res.ok) {
          scale.uploadedId = uploadId
          return resolve(`${window.location.origin}/scale/${uploadId}`)
        } else {
          return resolve(window.location.origin)
        }
      })
      .catch(() => resolve(window.location.origin))
  })
}

defineExpose({ uploadScale })

function downloadDebugDump() {
  const link = document.createElement('a')
  link.download = sanitizeFilename(scale.scale.title) + '.json'
  link.href = 'data:application/json,' + encodeURIComponent(uploadBody.value)
  // Open save dialog
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
}

function copyToClipboard() {
  if (API_URL) {
    uploadScale().then((url) => {
      window.navigator.clipboard.writeText(url)
      exportTextClipboard.value = '[Copied URL to clipboard]'
      window.setTimeout(() => {
        exportTextClipboard.value = "Copy this scale's unique URL to clipboard"
      }, 5000)
    })
  } else {
    exportTextClipboard.value = 'You must have sw-server running for this to work!'
    window.setTimeout(() => {
      exportTextClipboard.value = '[URL sharing disabled]'
    }, 5000)
  }
}

function doExport(exporter: ExporterKey) {
  uploadScale().then((scaleUrl) => {
    const params: ExporterParams = {
      newline: state.newline,
      scaleUrl,
      filename: sanitizeFilename(scale.scale.title),
      relativeIntervals: scale.relativeIntervals,
      scale: scale.scale,
      labels: scale.labels,
      midiOctaveOffset: -1,
      description: scale.scale.title,
      sourceText: scale.sourceText,
      appTitle: APP_TITLE,
      date: new Date()
    }

    if (exporter === 'xendevs') {
      const { rawIntervals, unisonFrequency } = scale.computeRawScale()
      params.rawIntervals = rawIntervals
      params.unisonFrequency = unisonFrequency
    }

    exportFile(exporter, params)
  })
}
</script>
<template>
  <Teleport to="body">
    <ScalaExportModal
      v-if="showScalaExportModal"
      :show="showScalaExportModal"
      @confirm="showScalaExportModal = false"
      @cancel="showScalaExportModal = false"
      :scaleUrl="uploadedScaleUrl"
      :newline="state.newline"
      :relativeIntervals="scale.relativeIntervals"
      :midiOctaveOffset="-1"
      :scale="scale.scale"
      :labels="scale.labels"
      :colors="scale.colors"
    />

    <KorgExportModal
      v-if="showKorgExportModal"
      :show="showKorgExportModal"
      @confirm="showKorgExportModal = false"
      @cancel="showKorgExportModal = false"
      :newline="state.newline"
      :relativeIntervals="scale.relativeIntervals"
      :midiOctaveOffset="-1"
      :scale="scale.scale"
      :labels="scale.labels"
    />

    <MtsSysexExportModal
      v-if="showMtsSysexExportModal"
      :show="showMtsSysexExportModal"
      @confirm="showMtsSysexExportModal = false"
      @cancel="showMtsSysexExportModal = false"
      :newline="state.newline"
      :relativeIntervals="scale.relativeIntervals"
      :midiOctaveOffset="-1"
      :scale="scale.scale"
      :labels="scale.labels"
    />

    <ReaperExportModal
      v-if="showReaperExportModal"
      :show="showReaperExportModal"
      @confirm="showReaperExportModal = false"
      @cancel="showReaperExportModal = false"
      :newline="state.newline"
      :relativeIntervals="scale.relativeIntervals"
      :midiOctaveOffset="-1"
      :scale="scale.scale"
      :labels="scale.labels"
    />
  </Teleport>
  <h2>Export current settings</h2>
  <a href="#" :class="{ btn: true, disabled: !API_URL }" @click="copyToClipboard">
    <p><strong>Share scale</strong></p>
    <p>{{ exportTextClipboard }}</p>
  </a>
  <div v-if="IS_SAFARI && state.showSafariWarning">
    <h3 class="warning">Warning</h3>
    <p class="warning">File export is known to be broken on Safari. Root cause unknown.</p>
    <button class="warning" @click="state.showSafariWarning = false">Dismiss</button>
  </div>
  <a v-if="state.debug" href="#" class="btn debug" @click="downloadDebugDump"
    ><p><strong>Debug dump (.json)</strong></p>
    <p>Copy of the data sent to the server.</p></a
  >
  <a href="#" class="btn" @click="doExport('anamarkv1')">
    <p><strong>AnaMark v1 tuning (.tun)</strong></p>
    <p>Tuning file for various synths</p>
  </a>
  <a href="#" class="btn" @click="doExport('anamarkv2')">
    <p><strong>AnaMark v2 tuning (.tun)</strong></p>
    <p>Tuning file for various synths</p>
  </a>
  <a href="#" class="btn" @click="showScalaExportModal = true">
    <p><strong>Scala scale (.scl)</strong></p>
    <p>
      Scale file for various synths.<br />If you use this file without an accompanying .kbm file,
      most synths will assume your scale starts on C ≈ 262Hz
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
  <a href="#" class="btn" @click="doExport('xendevs')">
    <p><strong>SonicWeave Interchange (.swi)</strong></p>
    <p>Simplified Scale Workshop 3 format</p>
  </a>
  <h3>Documentation</h3>
  <p>
    You can read about the new SonicWeave syntax
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
button.warning {
  margin-bottom: 0.5em;
}
.btn.debug {
  border: var(--color-dark-indicator) 1px dashed;
}
</style>
