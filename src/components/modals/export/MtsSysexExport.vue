<script setup lang="ts">
import MtsSysexExporter from "@/exporters/mts-sysex";
import { sanitizeFilename } from "@/utils";
import { ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
import type { Scale } from "scale-workshop-core";
import { clamp } from "xen-dev-utils";

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

function clampPreset(index: number): number {
  return clamp(0, 127, index);
}

// Rarely implemented parameters
// const deviceId = ref(0);
// const bank = ref(0); (only for message 0x0804)

const name = ref(clampName(props.scaleName));
const presetIndex = ref(clampPreset(0));

function doExport() {
  const params = {
    newline: props.newline,
    scale: props.scale,
    filename: sanitizeFilename(props.scaleName),
    baseMidiNote: props.baseMidiNote,
    name: name.value,
    presetIndex: presetIndex.value,
  };

  const exporter = new MtsSysexExporter(params);
  exporter.saveFile();

  emit("confirm");
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
            maxlength="16"
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
              ?
            </span>
          </label>
          <input
            class="half"
            type="number"
            id="preset-index"
            v-model="presetIndex"
            min="0"
            max="127"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>

<style>
input.half {
  flex-grow: 0.25 !important;
}

span.info-question {
  border-radius: 50%;
  border-width: 2px;
  border-style: solid;
  padding-left: 4px;
  padding-right: 4px;
  font-size: smaller;

  transition: 0.3s ease;
}

span.info-question:hover {
  background: white;
  color: black;
  border-color: white;
  transition: all 0.3s ease;
}
</style>
