<script setup lang="ts">
import { APP_TITLE } from '@/constants';
import { exportFile, type ExporterKey } from '@/exporters';
import type { ExporterParams } from '@/exporters/base';
import { useScaleStore } from '@/stores/scale';
import { useStateStore } from '@/stores/state';
import { sanitizeFilename } from '@/utils';

const state = useStateStore()
const scale = useScaleStore()

function doExport(exporter: ExporterKey) {
  const params: ExporterParams = {
    newline: state.newline,
    name: scale.name,
    scaleUrl: window.location.href,
    filename: sanitizeFilename(scale.name),
    relativeIntervals: scale.relativeIntervals,
    baseFrequency: scale.baseFrequency,
    baseMidiNote: scale.baseMidiNote,
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
  <h2>Export current settings</h2>
  <a href="#" class="btn" @click="doExport('scalascl')">
    <p><strong>Scala scale (.scl)</strong></p>
    <p>
      Scale file for various synths.<br />If you use this file without an accompanying .kbm
      file, most synths will assume your scale starts on C ~261Hz
    </p>
  </a>
  <a href="#" class="btn" @click="doExport('scalakbm')">
    <p><strong>Scala keyboard mapping (.kbm)</strong></p>
    <p>Maps an accompanying .scl file to start on a specific MIDI note and frequency</p>
  </a>
  <h3>Documentation</h3>
  <p>You can read about the new syntax <a href="https://github.com/xenharmonic-devs/sonic-weave?tab=readme-ov-file#sonic-weave" target="_blank">here</a>.</p>
  <p>Remember to check out the <a href="https://github.com/xenharmonic-devs/sonic-weave/tree/main/examples" target="_blank">examples</a> too.</p>
</template>

<style scoped>
.btn {
  width: 100%;
  display: block;
  margin-bottom: 1rem;
  margin-left: 0;
}
</style>