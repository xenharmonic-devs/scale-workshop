<script setup lang="ts">
import { KorgModels, KorgExporter, KORG_MODEL_INFO } from '@/exporters/korg'
import { sanitizeFilename } from '@/utils'
import { computed } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import type { ExporterParams } from '@/exporters/base'
import type { Interval } from 'sonic-weave'
import type { Scale } from '@/scale'
import { useExportStore } from '@/stores/export'

const props = defineProps<{
  show: boolean
  newline: string
  midiOctaveOffset: number
  relativeIntervals: Interval[]
  labels: string[]
  scale: Scale
}>()

const store = useExportStore()

const emit = defineEmits(['confirm', 'cancel'])

const dialogErrorMessage = computed(() => {
  if (store.useOctaveFormat) {
    const message = KorgExporter.getOctaveFormatErrorMessage(props.relativeIntervals)
    if (message.length > 0) return message
  }
  // Can check for other errors here...
  return String()
})

const fileTypePreview = computed(() => {
  const format = KORG_MODEL_INFO[store.korgModel]
  return store.useOctaveFormat ? format.octave : format.scale
})

async function doExport() {
  const params: ExporterParams = {
    newline: props.newline,
    scale: props.scale,
    relativeIntervals: props.relativeIntervals,
    labels: props.labels,
    filename: sanitizeFilename(props.scale.title),
    midiOctaveOffset: props.midiOctaveOffset
  }

  const exporter = new KorgExporter(params, store.korgModel, store.useOctaveFormat)
  await exporter.saveFile()

  emit('confirm')
}
</script>

<template>
  <Modal :show="show" @cancel="$emit('cancel')">
    <template #header>
      <h2>Export Korg Sound Librarian scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="model">Synth Model</label>
          <select id="model" v-model="store.korgModel">
            <option v-for="model of KorgModels" :key="model" :value="model">
              {{ KORG_MODEL_INFO[model].title }}
            </option>
          </select>
        </div>
        <div id="format" class="control radio-group">
          <label for="format">Tuning Format</label>
          <label>
            <input type="radio" :value="false" v-model="store.useOctaveFormat" />
            &nbsp;Scale (128-note table)
          </label>
          <label>
            <input type="radio" :value="true" v-model="store.useOctaveFormat" />
            &nbsp;Octave (12-note table, octave repeating with fixed C)
          </label>
        </div>
        <p>
          <label>Export Format: </label>
          {{ fileTypePreview }}
        </p>
        <div class="alert-box-danger" v-if="dialogErrorMessage.length > 0">
          <p class="alert-message-danger">
            {{ dialogErrorMessage }}
          </p>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="doExport" :disabled="dialogErrorMessage.length > 0">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
      </div>
    </template>
  </Modal>
</template>
