<script setup lang="ts">
import ReaperExporter from '@/exporters/reaper'
import { sanitizeFilename } from '@/utils'
import { ref } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import type { ExporterParams, LineFormat } from '@/exporters/base'
import type { Scale } from '@/scale'
import type { Interval } from 'sonic-weave'

const props = defineProps<{
  newline: string
  midiOctaveOffset: number
  relativeIntervals: Interval[]
  scale: Scale
  labels: string[]
}>()

const emit = defineEmits(['confirm', 'cancel'])

const formats: [LineFormat, string][] = [
  ['label', 'Scale data'],
  ['cents', 'Cents'],
  ['frequency', 'Frequencies'],
  ['decimal', 'Decimal ratios'],
  ['degree', 'Scale degrees']
]
const format = ref<LineFormat>('label')
const basePeriod = ref(0)
const baseDegree = ref(0)
const centsRoot = ref(0)
const integratePeriod = ref(false)
const displayPeriod = ref(true)

function doExport() {
  const params: ExporterParams = {
    newline: props.newline,
    scale: props.scale,
    filename: sanitizeFilename(props.scale.title),
    midiOctaveOffset: props.midiOctaveOffset,
    relativeIntervals: props.relativeIntervals,
    labels: props.labels,
    format: format.value,
    basePeriod: basePeriod.value,
    baseDegree: baseDegree.value,
    centsRoot: centsRoot.value,
    integratePeriod: integratePeriod.value,
    displayPeriod: displayPeriod.value
  }

  const exporter = new ReaperExporter(params)
  exporter.saveFile()

  emit('confirm')
}
</script>

<template>
  <Modal @confirm="doExport" @cancel="$emit('cancel')">
    <template #header>
      <h2>Export Reaper note name map</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="pitch-format">Pitch format</label>
          <select id="pitch-format" v-model="format">
            <option v-for="[value, name] of formats" :key="value" :value="value">
              {{ name }}
            </option>
          </select>
        </div>
        <label>Period options</label>
        <div class="control checkbox-container">
          <input type="checkbox" id="display-period" v-model="displayPeriod" />
          <label for="display-period">Show period number</label>
        </div>
        <div class="control checkbox-container">
          <input type="checkbox" id="integrate-period" v-model="integratePeriod" />
          <label for="integrate-period">Accumulate period in pitch</label>
        </div>
        <div class="control">
          <label for="base-period">Base period number</label>
          <input type="number" id="base-period" v-model="basePeriod" />
        </div>
        <div class="control" v-show="format === 'cents'">
          <label for="cents-root">Base cents value</label>
          <input type="number" id="cents-root" v-model="centsRoot" />
        </div>
        <div class="control" v-show="format === 'degree'">
          <label for="base-degree">Base degree</label>
          <input type="number" id="base-degree" v-model="baseDegree" />
        </div>
      </div>
    </template>
  </Modal>
</template>
