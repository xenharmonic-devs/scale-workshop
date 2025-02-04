<script setup lang="ts">
import NewScale from '@/components/NewScale.vue'
import ModifyScale from '@/components/ModifyScale.vue'
import ScaleControls from '@/components/ScaleControls.vue'
import TuningTable from '@/components/TuningTable.vue'
import ExporterButtons from '@/components/ExporterButtons.vue'
import { DEFAULT_NUMBER_OF_COMPONENTS } from '@/constants'
import { useScaleStore } from '@/stores/scale'
import { useStateStore } from '@/stores/state'
import { debounce } from '@/utils'
import { getSourceVisitor, setNumberOfComponents } from 'sonic-weave'
import { onMounted, onUnmounted, ref } from 'vue'


//added by kFXs
import ScoreView from '@/components/ScoreView.vue'



const scale = useScaleStore()
const state = useStateStore()

const controls = ref<typeof ScaleControls | null>(null)
const newScale = ref<typeof NewScale | null>(null)
const modifyScale = ref<typeof ModifyScale | null>(null)
const exporterButtons = ref<typeof ExporterButtons | null>(null)

const updateScale = debounce(scale.computeScale)

onMounted(() => {
  // Initialize SonicWeave stdlib
  setNumberOfComponents(DEFAULT_NUMBER_OF_COMPONENTS)
  setTimeout(() => getSourceVisitor(), 1)
})

onUnmounted(() => {
  // Prepare to include other state in the server payload
  scale.rerollId()
})
</script>

<template>
    <!---added by kFXs------------->
    <ScoreView v-show="state.showMusicalScore" />
    <!------------------------------->

  <main>
    <div class="columns-container">
      <div class="column scale-builder">
        <textarea
          id="scale-name"
          rows="1"
          placeholder="Untitled scale"
          v-model="scale.name"
          @focus="controls!.clearPaletteInfo"
          @input="updateScale()"
        ></textarea>
        <ul class="btn-group">
          <NewScale ref="newScale" @done="controls!.focus()" @mouseenter="modifyScale!.blur()" />
          <ModifyScale ref="modifyScale" @done="controls!.focus()" @mouseenter="newScale!.blur()" />
        </ul>
        <ScaleControls ref="controls" />
      </div>
      <div class="column tuning-table">
        <TuningTable
          :heldNotes="state.heldNotes"
          :frequencies="scale.frequencies"
          :centss="scale.centss"
          :baseFrequency="scale.scale.baseFrequency"
          :baseMidiNote="scale.scale.baseMidiNote"
          :colors="scale.colors"
          :labels="scale.labels"

          :symbolTable="state.symbolTable"
          
          :symbols="scale.symbols"
        />
      </div>
      <div class="column exporters" @mouseenter="exporterButtons!.uploadScale()">
        <ExporterButtons ref="exporterButtons" />
      </div>
    </div>
  </main>
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
  font-family: sans-serif;
  resize: vertical;
}

select optgroup + optgroup {
  margin-top: 1em;
}

.real-valued:invalid {
  background-color: var(--color-background);
}
</style>
