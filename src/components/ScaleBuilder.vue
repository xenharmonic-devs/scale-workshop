<script setup lang="ts">
import { computed } from "vue";
import TuningTable from "./TuningTable.vue";

const props = defineProps<{
  scaleLines: string[];
  baseFrequency: number;
  baseMidiNote: number;
}>();

const emit = defineEmits([
  "update:scaleLines",
  "update:baseFrequency",
  "update:baseMidiNote",
]);

const joinedLines = computed({
  get() {
    return props.scaleLines.join("\n");
  },
  set(newValue: string) {
    emit("update:scaleLines", newValue.split("\n"));
  },
});
</script>

<template>
  <div id="tab-build-scale" class="columns-container">
    <div class="column scale-builder">
      <input id="scale-name" type="text" placeholder="Untitled scale" />
      <div class="btn-group">
        <a class="btn" href="#">New scale ▼</a>
        <a class="btn" href="#">Modify scale ▼</a>
      </div>

      <div class="control-group">
        <p class="control-group-heading">Scale data</p>
        <textarea rows="12" v-model="joinedLines"></textarea>
        <p>Placeholder for scale graphic</p>
      </div>

      <div class="control-group">
        <p class="control-group-heading">Keyboard mapping</p>
        <label>Base frequency (note 1/1)</label>
        <input
          type="number"
          :value="baseFrequency"
          min="0.1"
          max="1000000"
          @input="$emit('update:baseFrequency', $event)"
        />
        <label>Base MIDI note (note 1/1)</label>
        <input
          type="number"
          :value="baseMidiNote"
          min="0"
          max="127"
          step="1"
          @input="$emit('update:baseMidiNote', $event)"
        />
      </div>

      <div class="control-group">
        <label>Key colours</label>
        <p>
          A list of key colours, ascending from 1/1. Key colours are cosmetic
          only; they do not affect mapping.
        </p>
        <textarea>
white black white white black white black white white black white black</textarea
        >
      </div>
    </div>
    <TuningTable
      :lines="props.scaleLines"
      :baseFrequency="props.baseFrequency"
      :baseMidiNote="props.baseMidiNote"
    />
    <div class="column exporters">
      <p class="control-group-heading">Export current settings</p>
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
