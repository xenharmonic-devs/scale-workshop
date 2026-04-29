<script setup lang="ts">
/**
 * Primary scale-editing view that coordinates controls, parsing, and export panels.
 */
import ScaleControls from '@/components/ScaleControls.vue'
import TuningTable from '@/components/TuningTable.vue'
import { setNumberOfComponents } from 'sonic-weave/monzo'
import { DEFAULT_NUMBER_OF_COMPONENTS } from '@/constants'
import { useScaleStore } from '@/stores/scale'
import { useStateStore } from '@/stores/state'
import { debounce } from '@/utils'
import { getSourceVisitor } from 'sonic-weave/parser'
import { defineAsyncComponent, defineComponent, h, onMounted, ref, watch } from 'vue'

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
const exporterButtons = ref<{ uploadScale?: () => void } | null>(null)
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

const ExporterSkeleton = defineComponent({
  setup() {
    return () =>
      h('div', { class: 'exporter-skeleton', 'aria-hidden': 'true' }, [
        h('div', { class: 'skeleton-row' }),
        h('div', { class: 'skeleton-row' }),
        h('div', { class: 'skeleton-row' })
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

const ExporterButtonsAsync = defineAsyncComponent({
  loader: () => import('@/components/ExporterButtons.vue'),
  loadingComponent: ExporterSkeleton,
  delay: 0,
  suspensible: false
})

const updateScale = debounce(scale.computeScale)

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
              @done="controls!.focus()"
              @mouseenter="modifyScale?.blur?.()"
            />
            <ModifyScaleAsync
              ref="modifyScale"
              @done="controls!.focus()"
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
      <div class="column exporters" @mouseenter="exporterButtons?.uploadScale?.()">
        <ExporterButtonsAsync ref="exporterButtons" />
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

.exporter-skeleton {
  display: grid;
  gap: 0.5rem;
}

.skeleton-row {
  height: 2rem;
  border-radius: 4px;
  background-color: var(--color-border);
}
</style>
