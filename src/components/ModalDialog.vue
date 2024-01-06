<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'

const props = defineProps({
  show: {
    default: true,
    type: Boolean
  },
  extraStyle: {
    default: '',
    type: String
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const body = ref<HTMLDivElement | null>(null)

function cancelOnEsc(event: KeyboardEvent) {
  if (!props.show) {
    return
  }
  if (event.code === 'Escape') {
    emit('cancel')
  }
}

onMounted(() => {
  window.addEventListener('keydown', cancelOnEsc)
})

onUnmounted(() => {
  window.removeEventListener('keydown', cancelOnEsc)
})

/**
 * Focus the first focusable child element.
 * @param element The modal body (or its child).
 * @returns `true` if a focusable element was found.
 */
function focusFirst(element: Element) {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    element.focus()
    return true
  }

  for (const child of element.children) {
    if (focusFirst(child)) {
      return true
    }
  }

  return false
}

watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      nextTick(() => {
        if (body.value) {
          focusFirst(body.value)
        }
      })
    }
  }
)
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-mask" @mousedown.self="$emit('cancel')">
      <div class="modal-wrapper">
        <div class="modal-container" :style="extraStyle">
          <div class="modal-header">
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
.modal-wrapper {
  vertical-align: middle;
}
.modal-container {
  padding: 1rem;
  background-color: var(--color-background);
  box-shadow: var(--color-drop-shadow) 0px 0px 200px;
  max-height: 100vh;
  max-width: 100vw;
  width: 20rem;
  transition: all 0.3s ease;
  display: flex;
  flex-flow: column;
}
.modal-header h2 {
  margin-bottom: 0;
}
.modal-body {
  overflow-y: auto;
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
