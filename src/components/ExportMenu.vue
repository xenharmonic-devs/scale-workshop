<script setup lang="ts">
/**
 * Top bar "Export" button with a dropdown listing every export format.
 *
 * The panel is teleported to the body and positioned with `position: fixed` because the
 * navigation bar scrolls horizontally and would clip an absolutely positioned child.
 */
import { defineAsyncComponent, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useScaleUpload } from '@/upload-scale'

const ExporterButtons = defineAsyncComponent(() => import('@/components/ExporterButtons.vue'))

// Keys handled by the menu itself that must not reach the global typing keyboard handlers.
const MENU_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape', 'Tab']
const VIEWPORT_MARGIN = 8

const isOpen = ref(false)
// The menu content is mounted on first open and then kept alive with v-show so that export
// modals (teleported out of the menu) survive the menu closing.
const isRequested = ref(false)
const trigger = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLDivElement | null>(null)
const position = ref({ top: 0, left: 0 })

const { uploadScale } = useScaleUpload()

function menuItems() {
  return [...(panel.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
}

function place() {
  if (!trigger.value) {
    return
  }
  const rect = trigger.value.getBoundingClientRect()
  const width = panel.value?.offsetWidth ?? 0
  position.value = {
    top: rect.bottom,
    left: Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN)
    )
  }
}

async function open() {
  isRequested.value = true
  isOpen.value = true
  // Start uploading early so that exports can embed the scale URL without a visible delay.
  void uploadScale()
  place()
  await nextTick()
  place()
}

function close(returnFocus = false) {
  isOpen.value = false
  if (returnFocus) {
    trigger.value?.focus()
  }
}

function toggle() {
  if (isOpen.value) {
    close()
  } else {
    void open()
  }
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    event.stopPropagation()
    void open().then(() => menuItems()[0]?.focus())
  }
}

function onPanelKeydown(event: KeyboardEvent) {
  if (!MENU_KEYS.includes(event.key)) {
    return
  }
  event.stopPropagation()
  if (event.key === 'Escape') {
    event.preventDefault()
    close(true)
    return
  }
  if (event.key === 'Tab') {
    close()
    return
  }
  event.preventDefault()
  const items = menuItems()
  if (!items.length) {
    return
  }
  const index = items.indexOf(document.activeElement as HTMLElement)
  let next = 0
  if (event.key === 'ArrowDown') {
    next = (index + 1) % items.length
  } else if (event.key === 'ArrowUp') {
    next = (index - 1 + items.length) % items.length
  } else if (event.key === 'End') {
    next = items.length - 1
  }
  items[next].focus()
}

function onDocumentPointerdown(event: PointerEvent) {
  const target = event.target as Node
  if (panel.value?.contains(target) || trigger.value?.contains(target)) {
    return
  }
  close()
}

function onWindowResize() {
  close()
}

// The panel is fixed in place, so close it if anything other than the panel itself scrolls.
function onScroll(event: Event) {
  if (panel.value?.contains(event.target as Node)) {
    return
  }
  close()
}

watch(isOpen, (value) => {
  if (value) {
    document.addEventListener('pointerdown', onDocumentPointerdown)
    window.addEventListener('resize', onWindowResize)
    document.addEventListener('scroll', onScroll, true)
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerdown)
    window.removeEventListener('resize', onWindowResize)
    document.removeEventListener('scroll', onScroll, true)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerdown)
  window.removeEventListener('resize', onWindowResize)
  document.removeEventListener('scroll', onScroll, true)
})
</script>

<template>
  <button
    ref="trigger"
    type="button"
    id="export-menu-trigger"
    class="export-trigger"
    :class="{ open: isOpen }"
    aria-haspopup="menu"
    aria-controls="export-menu"
    :aria-expanded="isOpen"
    @click="toggle"
    @keydown="onTriggerKeydown"
  >
    Export ▾
  </button>
  <Teleport to="body">
    <div
      v-if="isRequested"
      v-show="isOpen"
      ref="panel"
      id="export-menu"
      class="export-panel"
      role="menu"
      aria-labelledby="export-menu-trigger"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
      @keydown="onPanelKeydown"
    >
      <ExporterButtons @done="close()" />
    </div>
  </Teleport>
</template>

<style scoped>
.export-trigger {
  height: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0;
  background: none;
  color: white;
  font: inherit;
  white-space: nowrap;
  cursor: default;
}
.export-trigger:hover,
.export-trigger:focus-visible,
.export-trigger.open {
  background-color: var(--color-accent-deeper);
  outline: none;
}
.export-panel {
  position: fixed;
  z-index: 15;
  width: min(24rem, calc(100vw - 16px));
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}
</style>
