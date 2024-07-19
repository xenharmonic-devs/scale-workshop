<script setup lang="ts">
import MtsSysexExporter from '@/exporters/mts-sysex'
import { sanitizeFilename } from '@/utils'
import { ref, watch } from 'vue'
import Modal from '@/components/ModalDialog.vue'
import type { ExporterParams } from '@/exporters/base'
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

// Rarely implemented parameters
// const deviceId = ref(0);
// const bank = ref(0); (only for message 0x0804)

function clampName(name: string): string {
  return name.slice(0, 16)
}

// This state is intentionally not persisted
const name = ref(clampName(props.scale.title))

function nameInputCallback(nameInput: string): void {
  name.value = clampName(nameInput)
}

watch(
  () => props.scale.title,
  (newName) => nameInputCallback(newName),
  { immediate: true }
)

function doExport() {
  const params: ExporterParams = {
    newline: props.newline,
    scale: props.scale,
    filename: sanitizeFilename(props.scale.title),
    relativeIntervals: props.relativeIntervals,
    midiOctaveOffset: props.midiOctaveOffset,
    labels: props.labels,
    presetIndex: store.presetIndex
  }

  const exporter = new MtsSysexExporter(params)
  exporter.saveFile()

  emit('confirm')
}
</script>

<template>
  <Modal :show="show" @confirm="doExport" @cancel="$emit('cancel')">
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
              @click.prevent
              class="info-question"
              title="Refer to your synth's manual for a valid range"
            >
            </span>
          </label>
          <input
            class="half"
            id="preset-index"
            type="number"
            min="0"
            max="127"
            step="1"
            v-model="store.presetIndex"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
