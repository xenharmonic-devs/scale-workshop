<script setup lang="ts">
import MtsSysexExporter from "@/exporters/mts-sysex";
import { sanitizeFilename } from "@/utils";
import { ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
import type { Scale } from "scale-workshop-core";

const props = defineProps<{
  newline: string;
  scaleName: string;
  baseMidiNote: number;
  scale: Scale;
}>();

const emit = defineEmits(["confirm", "cancel"]);

function clampName(name: string): string {
    return name.slice(0, 16);
}

// Rarely implemented parameters
// const deviceId = ref(0);
// const bank = ref(0);

const presetIndex = ref(0);
const name = ref(clampName(props.scaleName));

function doExport() {
  const params = {
    newline: props.newline,
    scale: props.scale,
    filename: sanitizeFilename(props.scaleName),
    baseMidiNote: props.baseMidiNote,
    name: name.value,
    presetIndex: presetIndex.value
  };

  const exporter = new MtsSysexExporter(params);
  exporter.saveFile();

  emit("confirm");
}
</script>

<template>
  <Modal @confirm="doExport" @cancel="$emit('cancel')">
    <template #header>
      <h2>Export MTS Sysex Bulk Tuning Dump</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="name">Name</label>
          <input id="name" v-model="name" />
        </div>
        <div class="Preset Index">
          <label for="preset-index">Preset Index</label>
          <input type="number" id="preset-index" v-model="presetIndex" />
        </div>
      </div>
    </template>
  </Modal>
</template>
