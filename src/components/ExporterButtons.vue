<script setup lang="ts">
/**
 * Menu content that orchestrates export, save, and upload actions for the current scale.
 * The export modals are teleported to the body, so keep this mounted while a modal may be open.
 */
import { API_URL, APP_TITLE } from '@/constants'
import { exportFile, type ExporterKey } from '@/exporters'
import type { ExporterParams } from '@/exporters/base'
import { useScaleStore } from '@/stores/scale'
import { useStateStore } from '@/stores/state'
import { useSessionIdStore } from '@/stores/session-id'
import { useScaleUpload } from '@/upload-scale'
import { computed, defineAsyncComponent, ref, type Ref } from 'vue'
import { sanitizeFilename, copyText } from '@/utils'

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
const KontaktExportModal = defineAsyncComponent(
  () => import('@/components/modals/export/KontaktExport.vue')
)

const emit = defineEmits<{
  // An item was chosen and the surrounding menu can close.
  done: []
}>()

const sessionId = useSessionIdStore()
const state = useStateStore()
const scale = useScaleStore()

const exportTextClipboard = ref(
  API_URL ? "Copy this scale's unique URL to clipboard" : '[URL sharing disabled]'
)
const showScalaExportModal = ref(false)
const showKorgExportModal = ref(false)
const showMtsSysexExportModal = ref(false)
const showReaperExportModal = ref(false)
const showKontaktExportModal = ref(false)

const uploadedScaleUrl = computed(() => `${window.location.origin}/scale/${sessionId.uploadedId}`)

const { uploadBody, uploadScale } = useScaleUpload()

function downloadDebugDump() {
  const link = document.createElement('a')
  link.download = sanitizeFilename(scale.scale.title) + '.json'
  link.href = 'data:application/json,' + encodeURIComponent(uploadBody.value)
  // Open save dialog
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
}

function copyToClipboard() {
  if (API_URL) {
    uploadScale()
      .then(copyText)
      .then((success) => {
        if (success) {
          exportTextClipboard.value = '[Copied URL to clipboard]'
        } else {
          exportTextClipboard.value = '[Clipboard access denied]'
        }
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

type ExportItem = {
  title: string
  description: string
} & ({ exporter: ExporterKey } | { modal: Ref<boolean> })

const items: ExportItem[] = [
  {
    title: 'AnaMark v1 tuning (.tun)',
    description: 'Tuning file for various synths',
    exporter: 'anamarkv1'
  },
  {
    title: 'AnaMark v2 tuning (.tun)',
    description: 'Tuning file for various synths',
    exporter: 'anamarkv2'
  },
  {
    title: 'Scala scale (.scl)',
    description:
      'Scale file for various synths. Without an accompanying .kbm file, most synths will assume your scale starts on C ≈ 262Hz',
    modal: showScalaExportModal
  },
  {
    title: 'Scala keyboard mapping (.kbm)',
    description: 'Maps an accompanying .scl file to start on a specific MIDI note and frequency',
    exporter: 'scalakbm'
  },
  {
    title: 'Ableton scale (.ascl)',
    description: 'Scale file for Ableton Live 12',
    exporter: 'ableton'
  },
  {
    title: 'Max/MSP coll tuning (.txt)',
    description: 'List of frequencies (Hz) in a text file to load into a Max/MSP coll object',
    exporter: 'maxmsp'
  },
  {
    title: 'PureData text tuning (.txt)',
    description: 'List of frequencies (Hz) in a text file to load into a PureData text object',
    exporter: 'puredata'
  },
  {
    title: 'Kontakt tuning script (.txt)',
    description:
      'Tuning script for Native Instruments Kontakt. Some instrument libraries allow this custom script',
    modal: showKontaktExportModal
  },
  {
    title: 'Soniccouture tuning file (.nka)',
    description: 'For Soniccouture sample libraries',
    exporter: 'soniccouture'
  },
  {
    title: 'Harmor pitch map (.fnv)',
    description: 'Envelope state file for the pitch envelope in Image-Line Harmor',
    exporter: 'harmor'
  },
  {
    title: 'Sytrus pitch map (.fnv)',
    description: 'Envelope state file for the pitch envelope in Image-Line Sytrus',
    exporter: 'sytrus'
  },
  {
    title: 'Korg Sound Librarian scale (.mnlgtuns + others)',
    description:
      'Tuning formats for use with Monologue, Minilogue, Minilogue XD, and Prologue synthesizers',
    modal: showKorgExportModal
  },
  {
    title: 'Deflemask reference (.txt)',
    description: "List of 'fine tune' values for Deflemask",
    exporter: 'deflemask'
  },
  {
    title: 'Reaper note name map (.txt)',
    description: "Displays custom note names on Reaper's piano roll",
    modal: showReaperExportModal
  },
  {
    title: 'MTS Sysex Bulk Tuning Dump (.syx)',
    description: 'Binary data of a Bulk Tuning Dump SysEx message',
    modal: showMtsSysexExportModal
  },
  {
    title: 'SonicWeave Interchange (.swi)',
    description: 'Simplified Scale Workshop 3 format',
    exporter: 'xendevs'
  }
]

function select(item: ExportItem) {
  if ('exporter' in item) {
    doExport(item.exporter)
  } else {
    item.modal.value = true
  }
  emit('done')
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

    <KontaktExportModal
      v-if="showKontaktExportModal"
      :show="showKontaktExportModal"
      @confirm="showKontaktExportModal = false"
      @cancel="showKontaktExportModal = false"
      :newline="state.newline"
      :midiOctaveOffset="-1"
      :scale="scale.scale"
      :scaleUrl="uploadedScaleUrl"
    />
  </Teleport>
  <ul class="export-list" role="none">
    <li role="none">
      <button
        type="button"
        role="menuitem"
        class="export-item"
        :class="{ disabled: !API_URL }"
        @click="copyToClipboard"
      >
        <strong>Share scale</strong>
        <span>{{ exportTextClipboard }}</span>
      </button>
    </li>
    <li v-if="state.debug" role="none">
      <button type="button" role="menuitem" class="export-item debug" @click="downloadDebugDump">
        <strong>Debug dump (.json)</strong>
        <span>Copy of the data sent to the server.</span>
      </button>
    </li>
    <li class="divider" role="separator"></li>
    <li v-for="item of items" :key="item.title" role="none">
      <button type="button" role="menuitem" class="export-item" @click="select(item)">
        <strong>{{ item.title }}</strong>
        <span>{{ item.description }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.export-list {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
}
.divider {
  border-bottom: 1px solid var(--color-border);
  margin: 0.25rem 0;
}
.export-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  width: 100%;
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 0;
  background: none;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.export-item strong {
  color: var(--color-accent-text-btn);
}
.export-item span {
  font-size: 0.8rem;
  color: var(--color-text);
  opacity: 0.65;
}
.export-item:hover,
.export-item:focus-visible {
  background-color: var(--color-accent);
  outline: none;
}
.export-item:hover strong,
.export-item:hover span,
.export-item:focus-visible strong,
.export-item:focus-visible span {
  color: white;
  opacity: 1;
}
.export-item.disabled strong {
  color: var(--color-accent-mute);
}
.export-item.debug {
  border: var(--color-dark-indicator) 1px dashed;
}
</style>
