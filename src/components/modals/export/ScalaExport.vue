<script setup lang="ts">
import { ScalaSclExporter } from '@/exporters/scala'
import { sanitizeFilename } from '@/utils'
import { computed } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import type { ExporterParams } from '@/exporters/base'
import type { Scale } from '@/scale'
import type { Interval } from 'sonic-weave'
import { useExportStore } from '@/stores/export'

const props = defineProps<{
  show: boolean
  scaleUrl: string
  newline: string
  midiOctaveOffset: number
  relativeIntervals: Interval[]
  scale: Scale
  labels: string[]
  colors: string[]
}>()

const store = useExportStore()

const emit = defineEmits(['confirm', 'cancel'])

const exportLabels = computed(() => {
  const result: string[] = []
  for (let i = 0; i < props.labels.length; ++i) {
    let label = ''
    if (store.includeLabels) {
      label += ' ' + props.labels[i]
    }
    if (store.includeColors) {
      label += ' ' + props.colors[i]
    }
    if (label.length && store.commentLabels) {
      label = ' !' + label
    }
    result.push(label)
  }
  return result
})

function doExport() {
  const params: ExporterParams = {
    scaleUrl: props.scaleUrl,
    newline: props.newline,
    scale: props.scale,
    filename: sanitizeFilename(props.scale.title),
    midiOctaveOffset: props.midiOctaveOffset,
    relativeIntervals: props.relativeIntervals,
    labels: exportLabels.value,
    centsFractionDigits: store.centsFractionDigits
  }

  const exporter = new ScalaSclExporter(params)
  exporter.saveFile()

  emit('confirm')
}
</script>

<template>
  <Modal :show="show" @confirm="doExport" @cancel="$emit('cancel')">
    <template #header>
      <h2>Scala .scl tuning</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control checkbox-container">
          <input type="checkbox" id="include-labels" v-model="store.includeLabels" />
          <label for="include-labels">Include labels</label>
        </div>
        <div class="control checkbox-container">
          <input type="checkbox" id="include-colors" v-model="store.includeColors" />
          <label for="include-colors">Include colors</label>
        </div>
        <div class="control checkbox-container">
          <input
            type="checkbox"
            id="comment-labels"
            v-model="store.commentLabels"
            :disabled="!store.includeLabels && !store.includeColors"
          />
          <label
            for="comment-labels"
            :class="{ disabled: !store.includeLabels && !store.includeColors }"
            >Use comments ("!" before label)</label
          >
        </div>
        <div class="control">
          <label for="cents-digits">Cents precision</label>
          <input type="number" id="cents-digits" v-model="store.centsFractionDigits" />
        </div>
      </div>
    </template>
  </Modal>
</template>
