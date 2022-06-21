<script setup lang="ts">
import { computed } from "vue";
import TuningTable from "./TuningTable.vue";
import Scale from "@/scale";
import type ExtendedMonzo from "@/monzo";
import { parseLine } from "@/parser";
import { debounce } from "@/utils";

const props = defineProps<{
  scaleName: string;
  scaleLines: string[];
  baseFrequency: number;
  baseMidiNote: number;
  keyColors: string[];
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

const scaleAndNames = computed<[Scale, string[]]>(() => {
  const intervals: ExtendedMonzo[] = [];
  const names: string[] = [];
  props.scaleLines.forEach((line) => {
    try {
      intervals.push(parseLine(line));
      names.push(line);
    } catch {}
  });
  if (!intervals.length) {
    intervals.push(parseLine("1/1"));
    names.push("1/1");
  }
  return [Scale.fromIntervalArray(intervals, props.baseFrequency), names];
});

function updateScaleName(event: Event) {
  emit("update:scaleName", (event!.target as HTMLInputElement).value);
}

const updateBaseFrequency = debounce((event: Event) => {
  emit(
    "update:baseFrequency",
    parseFloat((event!.target as HTMLInputElement).value)
  );
});

const updatebaseMidiNote = debounce((event: Event) => {
  emit(
    "update:baseMidiNote",
    parseInt((event!.target as HTMLInputElement).value)
  );
});
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
            <a href="#"><li>Harmonic series segment</li></a>
            <a href="#"><li>Subharmonic series segment</li></a>
            <a href="#"><li>Enumerate chord</li></a>
            <a href="#"><li>Combination product set</li></a>
            <li class="divider"></li>
            <a href="#"><li>Import .scl</li></a>
            <a href="#"><li>Import .tun</li></a>
            <a href="#"><li>Import .mnlgtuns / .mnltuno</li></a>
            <li class="divider"></li>
            <a href="#" @click="$emit('update:scaleLines', [])"
              ><li>Clear scale</li></a
            >
            <a href="#"><li>Load preset scale</li></a>
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
            <a href="#"><li>Approximate by harmonics</li></a>
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
          <span>Hz</span>
        </div>

        <div class="control">
          <label>MIDI note number</label>
          <input
            type="number"
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
      </div>
    </div>
    <TuningTable
      :scale="scaleAndNames[0]"
      :names="scaleAndNames[1]"
      :lines="props.scaleLines"
      :baseFrequency="props.baseFrequency"
      :baseMidiNote="props.baseMidiNote"
    />
    <div class="column exporters">
      <h2>Export current settings</h2>
      <a href="#" class="btn">
        <p><strong>AnaMark v1 tuning (.tun)</strong></p>
        <p>Tuning file for various softsynths</p>
      </a>
      <a href="#" class="btn">
        <p><strong>AnaMark v2 tuning (.tun)</strong></p>
        <p>Tuning file for various softsynths</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Scala scale (.scl)</strong></p>
        <p>
          Scale file for various softsynths. Note that this contains only
          intervals, and most synths will assume middle C ~261Hz unless a kbm
          file is also exported.
        </p>
      </a>
      <a href="#" class="btn">
        <p><strong>Scala keyboard mapping (.kbm)</strong></p>
        <p>
          Keyboard mapping to accompany a .scl file. Maps the scale to a
          specific frequency.
        </p>
      </a>
      <a href="#" class="btn">
        <p><strong>Max/MSP coll tuning (.txt)</strong></p>
        <p>For Max/MSP coll object</p>
      </a>
      <a href="#" class="btn">
        <p><strong>PureData text tuning (.txt)</strong></p>
        <p>For PureData text object</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Kontakt tuning script (.txt)</strong></p>
        <p>For Native Instruments Kontakt</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Soniccouture tuning file (.nka)</strong></p>
        <p>For Soniccouture sample libraries</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Harmor pitch map (.fnv)</strong></p>
        <p>For Image-Line Harmor</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Sytrus pitch map (.fnv)</strong></p>
        <p>For Image-Line Sytrus</p>
      </a>
      <a href="#" class="btn">
        <p><strong>bla bla bla (.etc)</strong></p>
        <p>This list of exporters has more stuff to add</p>
      </a>
    </div>
  </div>
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
</style>
