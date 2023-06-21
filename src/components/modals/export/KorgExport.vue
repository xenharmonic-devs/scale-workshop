<script setup lang="ts">
import { KorgModels, KorgExporter, getKorgModelInfo } from "@/exporters/korg";
import { sanitizeFilename } from "@/utils";
import { computed, ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
import type { Scale } from "scale-workshop-core";

const props = defineProps<{
  newline: string;
  scaleName: string;
  baseMidiNote: number;
  scale: Scale;
}>();

const emit = defineEmits(["confirm", "cancel"]);

const models = [
  KorgModels.MONOLOGUE,
  KorgModels.MINILOGUE,
  KorgModels.MINILOGUE_XD,
  KorgModels.PROLOGUE
];

const modelName = ref("minilogue");
const useScaleFormat = ref(true);

const fileTypePreview = computed(() => {
  const format = getKorgModelInfo(modelName.value);
  return useScaleFormat.value ? format.scale : format.octave;
});

function doExport() {
  const params = {
    newline: props.newline,
    scale: props.scale,
    filename: sanitizeFilename(props.scaleName),
    baseMidiNote: props.baseMidiNote,
  };

  const exporter = new KorgExporter(params, modelName.value, useScaleFormat.value);
  exporter.saveFile();

  emit("confirm");
}
</script>

<template>
  <Modal @confirm="doExport" @cancel="$emit('cancel')">
    <template #header>
      <h2>Export Korg Sound Librarian scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="modelName">Synth Model</label>
          <select id="modelName" v-model="modelName">
            <option 
              v-for="name of models" 
              :key="name" 
              :value="name"
              >
                {{ getKorgModelInfo(name).title }}
            </option>
          </select>
        </div>
        <div id="format" class="control radio-group">
          <label for="format">Tuning Format</label>
          <label>
            <input type="radio" :value="true" v-model="useScaleFormat"/>
            &nbsp;Scale (128-note table)
          </label>
          <label>
            <input type="radio" :value="false" v-model="useScaleFormat"/>
            &nbsp;Octave (12-note table, octave repeating with fixed C)
          </label>
        </div>
        <p>
          <label>Export Format: </label> 
          {{ fileTypePreview }}
        </p>
      </div>
    </template>
  </Modal>
</template>
