<script setup lang="ts">
import { ScalaSclExporter } from '@/exporters/scala'
import { sanitizeFilename } from '@/utils'
import { computed, ref } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import type { ExporterParams } from '@/exporters/base'
import type { Scale } from '@/scale'
import type { Interval } from 'sonic-weave'

const props = defineProps<{
  show: boolean
  newline: string
  midiOctaveOffset: number
  relativeIntervals: Interval[]
  scale: Scale
  labels: string[]
  colors: string[]
}>()

const emit = defineEmits(['confirm', 'cancel'])

const centsFractionDigits = ref(6)
const includeLabels = ref(false)
const commentLabels = ref(true)
const includeColors = ref(false)

const exportLabels = computed(() => {
  const result: string[] = []
  for (let i = 0; i < props.labels.length; ++i) {
    let label = ''
    if (includeLabels.value) {
      label += ' ' + props.labels[i]
    }
    if (includeColors.value) {
      label += ' ' + props.colors[i]
    }
    if (label.length && commentLabels.value) {
      label = ' !' + label
    }
    result.push(label)
  }
  return result
})

function doExport() {
  const params: ExporterParams = {
    newline: props.newline,
    scale: props.scale,
    filename: sanitizeFilename(props.scale.title),
    midiOctaveOffset: props.midiOctaveOffset,
    relativeIntervals: props.relativeIntervals,
    labels: exportLabels.value,
    centsFractionDigits: centsFractionDigits.value
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
          <input type="checkbox" id="include-labels" v-model="includeLabels" />
          <label for="include-labels">Include labels</label>
        </div>
        <div class="control checkbox-container">
          <input type="checkbox" id="include-colors" v-model="includeColors" />
          <label for="include-colors">Include colors</label>
        </div>
        <div class="control checkbox-container">
          <input
            type="checkbox"
            id="comment-labels"
            v-model="commentLabels"
            :disabled="!includeLabels && !includeColors"
          />
          <label for="comment-labels" :class="{ disabled: !includeLabels && !includeColors }"
            >Use comments ("!" before label)</label
          >
        </div>
        <div class="control">
          <label for="cents-digits">Cents precision</label>
          <input type="number" id="cents-digits" v-model="centsFractionDigits" />
        </div>
      </div>
    </template>
  </Modal>
</template>
