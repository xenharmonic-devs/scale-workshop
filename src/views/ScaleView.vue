<script setup lang="ts">
import NewScale from '@/components/NewScale.vue';
import ScaleControls from '@/components/ScaleControls.vue';
import TuningTable from '@/components/TuningTable.vue';
import { DEFAULT_NUMBER_OF_COMPONENTS } from '@/constants';
import { useScaleStore } from '@/stores/scale';
import { useStateStore } from '@/stores/state';
import { debounce } from '@/utils';
import { getSourceVisitor, setNumberOfComponents } from 'sonic-weave';
import { onMounted, ref } from 'vue';

const scale = useScaleStore()
const state = useStateStore()

const controls = ref<typeof ScaleControls | null>(null)

const updateScale = debounce(scale.computeScale)

onMounted(() => {
  // Initialize SonicWeave stdlib
  setNumberOfComponents(DEFAULT_NUMBER_OF_COMPONENTS)
  setTimeout(() => getSourceVisitor(), 1)
})
</script>

<template>
  <main>
    <div class="columns-container">
      <div class="column scale-builder">
        <textarea
          id="scale-name"
          rows="1"
          placeholder="Untitled scale"
          v-model="scale.name"
          @update="updateScale"
        ></textarea>
        <ul class="btn-group">
          <NewScale @done="controls!.focus()"/>
          <li class="btn-dropdown-group">
            <a class="btn" href="#">Modify scale ▼</a>
            <ul>
              <a href="#" @click="scale.sort();controls!.focus()"><li>Sort ascending</li></a>
              <a href="#" @click="scale.reduce();controls!.focus()"><li>Reduce</li></a>
            </ul>
          </li>
        </ul>
        <ScaleControls ref="controls" />
      </div>
      <div class="column tuning-table">
        <TuningTable :heldNotes="state.heldNotes" :frequencies="scale.frequencies" :baseFrequency="scale.baseFrequency" :baseMidiNote="scale.baseMidiNote" :colors="scale.colors" :labels="scale.labels" />
      </div>
      <div class="column exporters">
        <h2>Exporters</h2>
        <p>Sorry, no exporters in the alpha.</p>
        <h3>Documentation</h3>
        <p>You can read about the new syntax <a href="https://github.com/xenharmonic-devs/sonic-weave?tab=readme-ov-file#sonic-weave" target="_blank">here</a>.</p>
        <p>Remember to check out the <a href="https://github.com/xenharmonic-devs/sonic-weave/tree/main/examples" target="_blank">examples</a> too.</p>
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
div.exporters .btn {
  width: 100%;
  display: block;
  margin-bottom: 1rem;
  margin-left: 0;
}

select optgroup + optgroup {
  margin-top: 1em;
}

.real-valued:invalid {
  background-color: var(--color-background);
}
</style>
