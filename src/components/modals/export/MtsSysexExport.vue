<script setup lang="ts">
import MtsSysexExporter from '@/exporters/mts-sysex'
import { sanitizeFilename } from '@/utils'
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import { clamp } from 'xen-dev-utils'
import type { ExporterParams } from '@/exporters/base'
import type { Scale } from '@/scale'
import type { Interval } from 'sonic-weave'

const props = defineProps<{
  newline: string
  scaleName: string
  baseMidiNote: number
  baseFrequency: number
  midiOctaveOffset: number
  relativeIntervals: Interval[]
  scale: Scale
  labels: string[]
}>()

const emit = defineEmits(['confirm', 'cancel'])

// Rarely implemented parameters
// const deviceId = ref(0);
// const bank = ref(0); (only for message 0x0804)

function clampName(name: string): string {
  return name.slice(0, 16)
}

const name = ref(clampName(props.scaleName))

function nameInputCallback(nameInput: string): void {
  name.value = clampName(nameInput)
}

watch(
  () => props.scaleName,
  (newName) => nameInputCallback(newName),
  { immediate: true }
)

function formatPresetIndex(input: string): string {
  const number = parseInt(input.replace(/\D/g, ''))
  if (Number.isNaN(number)) return '0'
  return String(clamp(0, 127, number))
}

const presetIndex = ref('0')

function presetIndexInputCallback(indexInput: string): void {
  presetIndex.value = formatPresetIndex(indexInput)
}

function doExport() {
  const params: ExporterParams = {
    newline: props.newline,
    scale: props.scale,
    filename: sanitizeFilename(props.scaleName),
    baseMidiNote: props.baseMidiNote,
    baseFrequency: props.baseFrequency,
    relativeIntervals: props.relativeIntervals,
    midiOctaveOffset: props.midiOctaveOffset,
    labels: props.labels,
    name: name.value,
    presetIndex: parseInt(presetIndex.value)
  }

  const exporter = new MtsSysexExporter(params)
  exporter.saveFile()

  emit('confirm')
}
</script>

<template>
  <Modal @confirm="doExport" @cancel="$emit('cancel')">
    <template #header>
      <h2>Export MTS Bulk Tuning Dump</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="name">Name (16-character limit)</label>
          <input
            class="half"
            type="text"
            id="name"
            v-model="name"
            @input="nameInputCallback(name)"
          />
        </div>
        <div class="control">
          <label for="preset-index">
            Preset Index&nbsp;
            <span
              @click="$event.preventDefault()"
              class="info-question"
              title="Refer to your synth's manual for a valid range"
            >
            </span>
          </label>
          <input
            class="half"
            id="preset-index"
            type="text"
            v-model="presetIndex"
            @input="presetIndexInputCallback(presetIndex)"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
