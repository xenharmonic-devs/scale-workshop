<script setup lang="ts">
import { computed, ref } from "vue";
import TuningTable from "./TuningTable.vue";
import { debounce, mtof, autoKeyColors } from "@/utils";
import ScaleRule from "./ScaleRule.vue";
import { APP_TITLE, UNIX_NEWLINE } from "@/constants";
import { sanitizeFilename } from "@/utils";
import { exportFile, type ExporterKey } from "@/exporters";
import Modal from "./ModalDialog.vue";
import HarmonicSeriesModal from "./modals/generation/HarmonicSeries.vue";
import ApproximateByHarmonicsModal from "./modals/modification/ApproximateByHarmonics.vue";
import { presets, presetsByGroup } from "@/presets";
import type Scale from "@/scale";
import { importFile, type ImporterKey } from "@/importers";

const props = defineProps<{
  scaleName: string;
  scaleLines: string[];
  baseFrequency: number;
  baseMidiNote: number;
  keyColors: string[];

  scale: Scale;
  names: string[];
  frequencies: number[];
}>();

const emit = defineEmits([
  "update:scaleName",
  "update:scaleLines",
  "update:baseFrequency",
  "update:baseMidiNote",
  "update:keyColors",
]);

const joinedLines = computed({
  get() {
    return props.scaleLines.join("\n");
  },
  set: debounce((newValue: string) => {
    emit("update:scaleLines", newValue.split("\n"));
  }),
});

const joinedKeyColors = computed({
  get() {
    return props.keyColors.join(" ");
  },
  set: debounce((newValue: string) => {
    emit("update:keyColors", newValue.split(" "));
  }),
});

function updateScaleName(event: Event) {
  emit("update:scaleName", (event!.target as HTMLInputElement).value);
}

const updateBaseFrequency = debounce((event: Event) => {
  const value = parseFloat((event!.target as HTMLInputElement).value);
  if (!isNaN(value) && isFinite(value)) emit("update:baseFrequency", value);
});

const updatebaseMidiNote = debounce((event: Event) => {
  const value = parseInt((event!.target as HTMLInputElement).value);
  if (!isNaN(value)) {
    emit("update:baseMidiNote", value);
  }
});

const midiNoteNumber = ref<HTMLInputElement | null>(null);

function autoFrequency() {
  let baseMidiNote = props.baseMidiNote;
  if (midiNoteNumber.value !== null) {
    // Circumvent debouncing for this simple click
    baseMidiNote = parseInt(midiNoteNumber.value.value);
  }
  emit("update:baseFrequency", mtof(baseMidiNote));
}

function doExport(exporter: ExporterKey) {
  // TODO: Fetch newline from user preferences
  const params = {
    newline: UNIX_NEWLINE,
    name: props.scaleName,
    scaleUrl: window.location.href,
    scale: props.scale,
    filename: sanitizeFilename(props.scaleName),
    baseMidiNote: props.baseMidiNote,
    description: props.scaleName,
    lines: props.scaleLines,
    names: props.names,
    appTitle: APP_TITLE,
    date: new Date(),
  };

  exportFile(exporter, params);
}

const presetGroups = presetsByGroup();
const presetSelect = ref<HTMLSelectElement | null>(null);
const showPresetModal = ref(false);
function selectPreset() {
  const preset = presets[presetSelect.value!.value];
  emit("update:scaleName", preset.name);
  emit("update:scaleLines", preset.lines);
  emit("update:baseFrequency", preset.baseFrequency);
  emit("update:baseMidiNote", preset.baseMidiNote);
}

const showHarmonicSeriesModal = ref(false);
const showApproximateByHarmonicsModal = ref(false);

const scalaFile = ref<HTMLInputElement | null>(null);
const anamarkFile = ref<HTMLInputElement | null>(null);

async function doImport(importerKey: ImporterKey, event: Event) {
  const result = await importFile(importerKey, event);
  emit("update:scaleLines", result.scale.toScaleLines());
  if (result.name !== undefined) {
    emit("update:scaleName", result.name);
  }
  if (result.baseMidiNote !== undefined) {
    emit("update:baseMidiNote", result.baseMidiNote);
  }
}
</script>

<template>
  <div id="tab-build-scale" class="columns-container">
    <div class="column scale-builder">
      <input
        id="scale-name"
        type="text"
        placeholder="Untitled scale"
        :value="scaleName"
        @input="updateScaleName"
      />

      <ul class="btn-group">
        <li class="btn-dropdown-group">
          <a class="btn" href="#">New scale ▼</a>
          <ul>
            <a href="#"><li>Equal temperament</li></a>
            <a href="#"><li>Rank-2 temperament</li></a>
            <a href="#" @click="showHarmonicSeriesModal = true"
              ><li>Harmonic series segment</li></a
            >
            <a href="#"><li>Subharmonic series segment</li></a>
            <a href="#"><li>Enumerate chord</li></a>
            <a href="#"><li>Combination product set</li></a>
            <li class="divider"></li>
            <a href="#" @click="scalaFile?.click()"><li>Import .scl</li></a>
            <a href="#" @click="anamarkFile?.click()"><li>Import .tun</li></a>
            <a href="#"><li>Import .mnlgtuns / .mnltuno</li></a>
            <li class="divider"></li>
            <a href="#" @click="$emit('update:scaleLines', [])"
              ><li>Clear scale</li></a
            >
            <a href="#" @click="showPresetModal = true"
              ><li>Load preset scale</li></a
            >
          </ul>
        </li>
        <li class="btn-dropdown-group">
          <a class="btn" href="#">Modify scale ▼</a>
          <ul>
            <a href="#"><li>Sort ascending</li></a>
            <a href="#"><li>Reduce</li></a>
            <a href="#"><li>Rotate</li></a>
            <a href="#"><li>Subset</li></a>
            <a href="#"><li>Stretch/compress</li></a>
            <a href="#"><li>Random variance</li></a>
            <a href="#"><li>Approximate by ratios</li></a>
            <a href="#" @click="showApproximateByHarmonicsModal = true"
              ><li>Approximate by harmonics</li></a
            >
            <a href="#"><li>Approximate by subharmonics</li></a>
            <a href="#"><li>Equalize</li></a>
          </ul>
        </li>
      </ul>

      <div class="control-group">
        <h2>Scale data</h2>
        <div class="control">
          <textarea rows="12" v-model="joinedLines"></textarea>
        </div>
      </div>

      <ScaleRule :scale="props.scale" />

      <div class="control-group">
        <h2>Tuning</h2>

        <div class="control">
          <label>Interval</label>
          <select>
            <option>1/1</option>
          </select>
        </div>

        <div class="control">
          <label>Frequency</label>
          <input
            type="number"
            :value="baseFrequency"
            min="0.1"
            max="1000000"
            @input="updateBaseFrequency"
          />
          <button @click="autoFrequency">Auto</button>
          <span>Hz</span>
        </div>

        <div class="control">
          <label>MIDI note number</label>
          <input
            type="number"
            ref="midiNoteNumber"
            :value="baseMidiNote"
            min="0"
            max="127"
            step="1"
            @input="updatebaseMidiNote"
          />
          <span>A5</span>
        </div>
      </div>

      <div class="control-group">
        <h2>Key colors</h2>
        <div class="control">
          <p>
            A list of key colors, ascending from 1/1. Key colors are cosmetic
            only; they do not affect mapping.
          </p>
          <textarea v-model="joinedKeyColors"></textarea>
        </div>
        <div class="control">
          <button
            @click="$emit('update:keyColors', autoKeyColors(props.scale.size))"
          >
            Auto
          </button>
        </div>
      </div>
    </div>
    <TuningTable
      :scale="scale"
      :names="names"
      :frequencies="frequencies"
      :lines="props.scaleLines"
      :baseFrequency="props.baseFrequency"
      :baseMidiNote="props.baseMidiNote"
      :keyColors="props.keyColors"
    />
    <div class="column exporters">
      <h2>Export current settings</h2>
      <a href="#" class="btn" @click="doExport('anamarkv1')">
        <p><strong>AnaMark v1 tuning (.tun)</strong></p>
        <p>Tuning file for various softsynths</p>
      </a>
      <a href="#" class="btn" @click="doExport('anamarkv2')">
        <p><strong>AnaMark v2 tuning (.tun)</strong></p>
        <p>Tuning file for various softsynths</p>
      </a>
      <a href="#" class="btn" @click="doExport('scalascl')">
        <p><strong>Scala scale (.scl)</strong></p>
        <p>
          Scale file for various softsynths. Note that this contains only
          intervals, and most synths will assume middle C ~261Hz unless a kbm
          file is also exported.
        </p>
      </a>
      <a href="#" class="btn" @click="doExport('scalakbm')">
        <p><strong>Scala keyboard mapping (.kbm)</strong></p>
        <p>
          Keyboard mapping to accompany a .scl file. Maps the scale to a
          specific frequency.
        </p>
      </a>
      <a href="#" class="btn" @click="doExport('maxmsp')">
        <p><strong>Max/MSP coll tuning (.txt)</strong></p>
        <p>For Max/MSP coll object</p>
      </a>
      <a href="#" class="btn" @click="doExport('puredata')">
        <p><strong>PureData text tuning (.txt)</strong></p>
        <p>For PureData text object</p>
      </a>
      <a href="#" class="btn" @click="doExport('kontakt')">
        <p><strong>Kontakt tuning script (.txt)</strong></p>
        <p>For Native Instruments Kontakt</p>
      </a>
      <a href="#" class="btn" @click="doExport('soniccouture')">
        <p><strong>Soniccouture tuning file (.nka)</strong></p>
        <p>For Soniccouture sample libraries</p>
      </a>
      <a href="#" class="btn" @click="doExport('harmor')">
        <p><strong>Harmor pitch map (.fnv)</strong></p>
        <p>For Image-Line Harmor</p>
      </a>
      <a href="#" class="btn" @click="doExport('sytrus')">
        <p><strong>Sytrus pitch map (.fnv)</strong></p>
        <p>For Image-Line Sytrus</p>
      </a>
      <a href="#" class="btn" @click="doExport('mnlgtuns')">
        <p><strong>Korg 'logue tuning (.mnlgtuns)</strong></p>
        <p>For Korg 'logue Sound Librarian Scale</p>
      </a>
      <a href="#" class="btn" @click="doExport('mnlgtuno')">
        <p><strong>Korg 'logue octave map (.mnlgtuno)</strong></p>
        <p>For Korg 'logue Sound Librarian Octave</p>
      </a>
      <a href="#" class="btn" @click="doExport('deflemask')">
        <p><strong>Deflemask reference (.txt)</strong></p>
        <p>Deflemask 'fine tune' reference</p>
      </a>
    </div>
  </div>

  <!-- Hidden file inputs for importers -->
  <input
    type="file"
    ref="scalaFile"
    accept=".scl"
    style="display: none"
    @change="doImport('scalascl', $event)"
  />
  <input
    type="file"
    ref="anamarkFile"
    accept=".tun"
    style="display: none"
    @change="doImport('anamark', $event)"
  />

  <Teleport to="body">
    <HarmonicSeriesModal
      :show="showHarmonicSeriesModal"
      @update:scaleName="emit('update:scaleName', $event)"
      @update:scaleLines="
        showHarmonicSeriesModal = false;
        emit('update:scaleLines', $event);
      "
      @cancel="showHarmonicSeriesModal = false"
    />

    <Modal
      :show="showPresetModal"
      @confirm="
        showPresetModal = false;
        selectPreset();
      "
      @cancel="showPresetModal = false"
    >
      <template #header>
        <h2>Load preset scale</h2>
      </template>
      <template #body>
        <div class="control-group">
          <select ref="presetSelect" size="10" class="control">
            <optgroup
              v-for="group of presetGroups"
              :key="group.name"
              :label="group.name"
            >
              <option
                v-for="preset of group.members"
                :key="preset.id"
                :value="preset.id"
              >
                {{ preset.title }}
              </option>
            </optgroup>
          </select>
        </div>
      </template>
    </Modal>

    <ApproximateByHarmonicsModal
      :show="showApproximateByHarmonicsModal"
      @update:scaleLines="
        showApproximateByHarmonicsModal = false;
        emit('update:scaleLines', $event);
      "
      @cancel="showApproximateByHarmonicsModal = false"
      :scale="scale"
    />
  </Teleport>
</template>

<style scoped>
/* Content layout (small) */
div.columns-container {
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-border);
}
div.column {
  background-color: var(--color-background);
  overflow-x: hidden;
}
div.scale-builder {
  padding: 1rem;
}
div.tuning-table {
  padding: 0rem;
}
div.exporters {
  padding: 1rem;
}

/* Content layout (medium) */
@media screen and (min-width: 600px) {
  div.columns-container {
    column-count: 2;
    column-gap: 1px;
    overflow: hidden;
  }
  div.column {
    overflow-y: auto;
  }
  div.scale-builder {
    width: 100%;
    height: 100%;
  }
  div.tuning-table {
    width: 100%;
    height: 66%;
  }
  div.exporters {
    width: 100%;
    height: 34%;
    border-top: 1px solid var(--color-border);
  }
}

/* Content layout (large) */
@media screen and (min-width: 1100px) {
  div.columns-container {
    column-count: 3;
  }
  div.column {
    height: 100%;
  }
  div.exporters {
    border: none;
  }
}

/* UI elements */
#scale-name {
  width: 100%;
  font-size: 1.4em;
  margin-bottom: 1rem;
  padding: 0.3rem;
}
div.exporters .btn {
  width: 100%;
  display: block;
  margin-bottom: 1rem;
  margin-left: 0;
}

select optgroup + optgroup {
  margin-top: 1em;
}
</style>
