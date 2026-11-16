<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick, useId } from 'vue'

const props = defineProps({
  show: {
    default: true,
    type: Boolean
  },
  right: {
    default: false,
    type: Boolean
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const body = ref<HTMLDivElement | null>(null)
const container = ref<HTMLDivElement | null>(null)
const headerId = useId()
let opener: HTMLElement | null = null

function isActive() {
  const dialogs = [...document.querySelectorAll<HTMLElement>('[data-modal-active="true"]')]
  return props.show && dialogs[dialogs.length - 1] === container.value
}

function focusableElements(root: HTMLElement) {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]'
    )
  ].filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled') &&
      !element.closest('[inert]') &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== 'hidden'
  )
}

function focusFirst() {
  if (!container.value) return
  const first =
    (body.value && focusableElements(body.value)[0]) ||
    focusableElements(container.value)[0] ||
    container.value
  first.focus()
}

function restoreFocus() {
  const target = opener
  opener = null
  if (!target?.isConnected) return
  // Submenu items may be hidden once the modal takes focus.
  const fallback = target.closest('.btn-dropdown-group')?.querySelector<HTMLElement>('a.btn')
  if (target.getClientRects().length) target.focus()
  else fallback?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (!isActive() || !container.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopImmediatePropagation()
    emit('cancel')
  } else if (event.key === 'Tab') {
    const elements = focusableElements(container.value)
    const first = elements[0]
    const last = elements[elements.length - 1]
    if (
      !first ||
      !container.value.contains(document.activeElement) ||
      (event.shiftKey &&
        (document.activeElement === first || document.activeElement === container.value)) ||
      (!event.shiftKey && document.activeElement === last)
    ) {
      event.preventDefault()
      ;(event.shiftKey ? last : first)?.focus()
      if (!first) container.value.focus()
    }
  }
}

function onFocusIn(event: FocusEvent) {
  if (isActive() && !container.value?.contains(event.target as Node)) focusFirst()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown, true)
  document.addEventListener('focusin', onFocusIn)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown, true)
  document.removeEventListener('focusin', onFocusIn)
  restoreFocus()
})

watch(
  () => props.show,
  (show) => {
    if (show) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
      nextTick(() => {
        if (isActive()) focusFirst()
      })
    } else {
      restoreFocus()
    }
  },
  { immediate: true, flush: 'post' }
)
</script>

<template>
  <Transition name="modal">
    <div v-if="show" :class="{ 'modal-mask': true, right }" @mousedown.self="$emit('cancel')">
      <div class="modal-wrapper">
        <div
          ref="container"
          class="modal-container"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="headerId"
          :data-modal-active="show"
          tabindex="-1"
        >
          <div class="modal-header" :id="headerId">
            <slot name="header">default header</slot>
          </div>

          <div class="modal-body" ref="body">
            <slot name="body">default body</slot>
          </div>

          <div class="modal-footer">
            <slot name="footer">
              <div class="btn-group">
                <button @click="$emit('confirm')">OK</button>
                <button @click="$emit('cancel')">Cancel</button>
              </div>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style>
.modal-mask {
  position: fixed;
  z-index: 20;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-accent-dimmed);
  transition: opacity 0.3s ease;
}
/* Content layout (medium) */
@media screen and (min-width: 600px) {
  .modal-mask.right {
    justify-content: right;
  }
}
.modal-wrapper {
  vertical-align: middle;
}
.modal-container {
  padding: 1rem;
  background-color: var(--color-background);
  box-shadow: var(--color-drop-shadow) 0 0 12.5rem;
  max-height: 100vh;
  max-width: 22rem;
  min-width: 20rem;
  transition: all 0.3s ease;
  display: flex;
  flex-flow: column;
}
.modal-header h2 {
  margin-bottom: 0;
}
.modal-body {
  overflow-y: auto;
  padding-right: 0.5rem;
}
.modal-footer {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 *
 * You can easily play with the modal transition by editing
 * these styles.
 */

.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>
