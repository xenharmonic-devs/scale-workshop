<script setup lang="ts">
import ReaperExporter from '@/exporters/reaper'
import { sanitizeFilename } from '@/utils'
import Modal from '@/components/ModalDialog.vue'
import type { ExporterParams, LineFormat } from '@/exporters/base'
import type { Scale } from '@/scale'
import type { Interval } from 'sonic-weave'
import { useExportStore } from '@/stores/export'

const props = defineProps<{
  show: boolean
  newline: string
  midiOctaveOffset: number
  relativeIntervals: Interval[]
  scale: Scale
  labels: string[]
}>()

const store = useExportStore()

const emit = defineEmits(['confirm', 'cancel'])

const formats: [LineFormat, string][] = [
  ['label', 'Scale data'],
  ['cents', 'Cents'],
  ['frequency', 'Frequencies'],
  ['decimal', 'Decimal ratios'],
  ['degree', 'Scale degrees']
]

function doExport() {
  const params: ExporterParams = {
    newline: props.newline,
    scale: props.scale,
    filename: sanitizeFilename(props.scale.title),
    midiOctaveOffset: props.midiOctaveOffset,
    relativeIntervals: props.relativeIntervals,
    labels: props.labels,
    format: store.format,
    basePeriod: store.basePeriod,
    baseDegree: store.baseDegree,
    centsRoot: store.centsRoot,
    integratePeriod: store.integratePeriod,
    displayPeriod: store.displayPeriod
  }

  const exporter = new ReaperExporter(params)
  exporter.saveFile()

  emit('confirm')
}
</script>

<template>
  <Modal :show="show" @confirm="doExport" @cancel="$emit('cancel')">
    <template #header>
      <h2>Export Reaper note name map</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="pitch-format">Pitch format</label>
          <select id="pitch-format" v-model="store.format">
            <option v-for="[value, name] of formats" :key="value" :value="value">
              {{ name }}
            </option>
          </select>
        </div>
        <label>Period options</label>
        <div class="control checkbox-container">
          <input type="checkbox" id="display-period" v-model="store.displayPeriod" />
          <label for="display-period">Show period number</label>
        </div>
        <div class="control checkbox-container">
          <input type="checkbox" id="integrate-period" v-model="store.integratePeriod" />
          <label for="integrate-period">Accumulate period in pitch</label>
        </div>
        <div class="control">
          <label for="base-period">Base period number</label>
          <input type="number" id="base-period" v-model="store.basePeriod" />
        </div>
        <div class="control" v-show="store.format === 'cents'">
          <label for="cents-root">Base cents value</label>
          <input type="number" id="cents-root" v-model="store.centsRoot" />
        </div>
        <div class="control" v-show="store.format === 'degree'">
          <label for="base-degree">Base degree</label>
          <input type="number" id="base-degree" v-model="store.baseDegree" />
        </div>
      </div>
    </template>
  </Modal>
</template>
