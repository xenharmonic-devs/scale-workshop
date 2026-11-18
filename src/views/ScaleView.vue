<script setup lang="ts">
/**
 * Primary scale-editing view that coordinates controls and parsing.
 * Exporting lives in the top bar (`ExportMenu.vue`).
 */
import ScaleControls from '@/components/ScaleControls.vue'
import TuningTable from '@/components/TuningTable.vue'
import { setNumberOfComponents } from 'sonic-weave/monzo'
import { DEFAULT_NUMBER_OF_COMPONENTS } from '@/constants'
import { useScaleStore } from '@/stores/scale'
import { useStateStore } from '@/stores/state'
import { debounce } from '@/utils'
import { getSourceVisitor } from 'sonic-weave/parser'
import { defineAsyncComponent, defineComponent, h, nextTick, onMounted, ref, watch } from 'vue'

// The prop lets the router trigger auto-scrolling
const props = defineProps<{
  shown?: boolean
}>()

const scale = useScaleStore()
const state = useStateStore()

const controls = ref<typeof ScaleControls | null>(null)
const tuningTable = ref<typeof TuningTable | null>(null)
const newScale = ref<{ blur?: () => void } | null>(null)
const modifyScale = ref<{ blur?: () => void } | null>(null)
const isAuxiliaryPanelsRequested = ref(false)

const NewScaleButtonSkeleton = defineComponent({
  setup() {
    return () =>
      h('li', { class: 'skeleton-btn', 'aria-hidden': 'true' }, [
        h('span', { class: 'skeleton-btn-text' }, 'New scale ▼')
      ])
  }
})

const ModifyScaleButtonSkeleton = defineComponent({
  setup() {
    return () =>
      h('li', { class: 'skeleton-btn', 'aria-hidden': 'true' }, [
        h('span', { class: 'skeleton-btn-text' }, 'Modify scale ▼')
      ])
  }
})

const NewScaleAsync = defineAsyncComponent({
  loader: () => import('@/components/NewScale.vue'),
  loadingComponent: NewScaleButtonSkeleton,
  delay: 0,
  suspensible: false
})

const ModifyScaleAsync = defineAsyncComponent({
  loader: () => import('@/components/ModifyScale.vue'),
  loadingComponent: ModifyScaleButtonSkeleton,
  delay: 0,
  suspensible: false
})

const updateScale = debounce(scale.computeScale)

async function focusScaleData() {
  // Wait for the modal's focus trap and opener restoration to finish.
  await nextTick()
  controls.value?.focus()
}

watch(
  () => props.shown,
  (shown) => {
    if (shown) {
      tuningTable.value?.centerRootRow()
    }
  }
)

onMounted(() => {
  // Initialize SonicWeave stdlib
  setNumberOfComponents(DEFAULT_NUMBER_OF_COMPONENTS)
  setTimeout(() => getSourceVisitor(), 1)

  const loadAuxiliaryPanels = () => {
    isAuxiliaryPanelsRequested.value = true
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadAuxiliaryPanels, { timeout: 400 })
  } else {
    setTimeout(loadAuxiliaryPanels, 100)
  }
})
</script>

<template>
  <main>
    <div class="columns-container">
      <!-- Docked dialogs (ModalDialog with `docked`) are teleported in here. -->
      <div id="side-panel" class="column side-panel"></div>
      <div class="column scale-builder">
        <textarea
          id="scale-name"
          aria-label="Scale name"
          rows="1"
          placeholder="Untitled scale"
          v-model="scale.name"
          @focus="controls!.clearPaletteInfo"
          @input="updateScale()"
        ></textarea>
        <ul class="btn-group">
          <template v-if="isAuxiliaryPanelsRequested">
            <NewScaleAsync
              ref="newScale"
              @done="focusScaleData"
              @cancel="focusScaleData"
              @mouseenter="modifyScale?.blur?.()"
            />
            <ModifyScaleAsync
              ref="modifyScale"
              @done="focusScaleData"
              @cancel="focusScaleData"
              @mouseenter="newScale?.blur?.()"
            />
          </template>
          <template v-else>
            <li class="skeleton-btn" aria-hidden="true">
              <span class="skeleton-btn-text">New scale ▼</span>
            </li>
            <li class="skeleton-btn" aria-hidden="true">
              <span class="skeleton-btn-text">Modify scale ▼</span>
            </li>
          </template>
        </ul>
        <ScaleControls ref="controls" />
        <p class="docs">
          Read about the SonicWeave syntax in the
          <a
            href="https://github.com/xenharmonic-devs/sonic-weave?tab=readme-ov-file#sonic-weave"
            target="_blank"
            rel="noopener noreferrer"
            >documentation</a
          >
          and check out the
          <a
            href="https://github.com/xenharmonic-devs/sonic-weave/tree/main/examples"
            target="_blank"
            rel="noopener noreferrer"
            >examples</a
          >.
        </p>
      </div>
      <div class="column tuning-table">
        <TuningTable
          ref="tuningTable"
          :heldNotes="state.heldNotes"
          :frequencies="scale.frequencies"
          :centsValues="scale.centsValues"
          :baseFrequency="scale.scale.baseFrequency"
          :baseMidiNote="scale.scale.baseMidiNote"
          :colors="scale.colors"
          :labels="scale.labels"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
/*
 * Content layout. The 1px grid gap shows the container background as divider lines.
 * Small: everything stacks and the whole view scrolls.
 * Medium: scale builder and tuning table side by side, side panel below the builder.
 * Large: three full-height columns with the side panel on the left.
 */
div.columns-container {
  height: 100%;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 100%;
  grid-auto-rows: max-content;
  grid-template-areas:
    'builder'
    'table'
    'side';
  gap: 1px;
  background-color: var(--color-border);
}
div.column {
  background-color: var(--color-background);
  overflow-x: hidden;
}
div.side-panel {
  grid-area: side;
  padding: 1rem;
}
div.scale-builder {
  grid-area: builder;
  padding: 1rem;
}
div.tuning-table {
  grid-area: table;
  padding: 0rem;
}

/* Content layout (medium) */
@media screen and (min-width: 600px) {
  div.columns-container {
    overflow: hidden;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: minmax(0, 2fr) minmax(0, 1fr);
    grid-template-areas:
      'builder table'
      'side table';
  }
  div.column {
    overflow-y: auto;
  }
}

/* Content layout (large) */
@media screen and (min-width: 1100px) {
  div.columns-container {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: 'side builder table';
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

.skeleton-btn {
  display: inline-flex;
  align-items: center;
  min-height: 1.9rem;
  border-radius: 3px;
  border: var(--color-accent-text-btn) 1px solid;
  background-color: var(--color-accent-background);
  padding: 0.25rem 0.5rem;
  list-style: none;
  color: var(--color-accent-mute);
}

.skeleton-btn-text {
  opacity: 0.8;
}

.docs {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--color-text-mute);
}
</style>
