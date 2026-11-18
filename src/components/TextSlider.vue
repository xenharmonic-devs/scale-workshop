<script setup lang="ts">
/**
 * Text-based drag slider, ported from Omnitonal Performer's `OCTextSlider`.
 *
 * - Drag up/down changes the value by `step * dragScale` per pixel (Shift = 0.1x fine).
 * - Double-click resets to `defaultValue` when one is given.
 * - Click focuses. Arrow up/down nudge by `step` (Shift = x10).
 * - Typing a digit, '-' or '.' starts an in-place edit: Enter commits, Escape cancels
 *   (or blurs when not editing), Backspace deletes, and losing focus commits.
 *
 * Interactive changes are clamped to [min, max]. Drags snap to the `step` grid, while a typed
 * value is kept as typed (only clamped), so e.g. fractional divisions stay possible.
 *
 * Not ported: Performer's pitch/ratio features (`acceptsRatio`, `keepsRatio`, pitch modifiers),
 * label caption (use a regular <label> with `aria-labelledby`) and its carved/card paints.
 */
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    min: number
    max: number
    step?: number
    decimals?: number
    dragScale?: number
    defaultValue?: number
    unit?: string
    disabled?: boolean
  }>(),
  {
    step: 1,
    decimals: 0,
    dragScale: 1,
    defaultValue: undefined,
    unit: '',
    disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

// Pointer travel (px) before a press becomes a drag: DragGesture(minimumDistance: 2).
const DRAG_THRESHOLD = 2
const FINE_MULTIPLIER = 0.1
const COARSE_KEY_MULTIPLIER = 10
const NUMBER_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)$/

const root = ref<HTMLDivElement | null>(null)
const isEditing = ref(false)
const editText = ref('')
const isDragging = ref(false)

let pointerId: number | null = null
let downX = 0
let downY = 0
let lastDy = 0
// Unrounded running value so sub-step pixel movement accumulates across frames.
let accumulator = 0

const displayText = computed(() =>
  props.decimals > 0 ? props.modelValue.toFixed(props.decimals) : String(props.modelValue)
)

function clamp(value: number) {
  return Math.min(props.max, Math.max(props.min, value))
}

function decimalsOf(value: number) {
  const text = String(value)
  const dot = text.indexOf('.')
  return dot < 0 ? 0 : text.length - dot - 1
}

function snapToStep(value: number) {
  const snapped = Math.round(value / props.step) * props.step
  // Strip floating point noise such as 0.30000000000000004.
  const digits = Math.max(props.decimals, decimalsOf(props.step))
  return clamp(Number(snapped.toFixed(digits)))
}

function setValueInteractive(value: number) {
  if (Number.isNaN(value)) {
    return
  }
  const clamped = clamp(value)
  if (clamped !== props.modelValue) {
    emit('update:modelValue', clamped)
  }
}

// --- Pointer ---

function onPointerdown(event: PointerEvent) {
  if (props.disabled || event.button !== 0) {
    return
  }
  // No preventDefault here: that would suppress the follow-up mousedown the app relies on to
  // know a text field has focus (so typing doesn't play notes). Selection is blocked in
  // onMousedown instead, and focus is set explicitly below.
  if (isEditing.value) {
    commitEdit()
  }
  root.value?.focus()
  pointerId = event.pointerId
  downX = event.clientX
  downY = event.clientY
  lastDy = 0
  isDragging.value = false
  root.value?.setPointerCapture?.(event.pointerId)
}

function onMousedown(event: MouseEvent) {
  // Stops text selection (including double-click word selection) from starting in the box.
  // The event still bubbles to the app's listeners.
  event.preventDefault()
  window.getSelection()?.removeAllRanges()
}

function onPointermove(event: PointerEvent) {
  if (event.pointerId !== pointerId) {
    return
  }
  const dy = event.clientY - downY
  if (!isDragging.value) {
    if (Math.hypot(event.clientX - downX, dy) < DRAG_THRESHOLD) {
      return
    }
    isDragging.value = true
    accumulator = props.modelValue
    lastDy = 0
  }
  const perPixel = props.step * props.dragScale * (event.shiftKey ? FINE_MULTIPLIER : 1)
  accumulator = clamp(accumulator - (dy - lastDy) * perPixel)
  lastDy = dy
  const snapped = snapToStep(accumulator)
  if (snapped !== props.modelValue) {
    emit('update:modelValue', snapped)
  }
}

function onPointerup(event: PointerEvent) {
  if (event.pointerId !== pointerId) {
    return
  }
  if (root.value?.hasPointerCapture?.(event.pointerId)) {
    root.value.releasePointerCapture(event.pointerId)
  }
  pointerId = null
  isDragging.value = false
}

function onDoubleClick() {
  if (props.disabled || props.defaultValue === undefined) {
    return
  }
  setValueInteractive(props.defaultValue)
}

// --- Keyboard ---

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) {
    return
  }
  // Select all would highlight the whole page from here; there is no text to select.
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return
  }
  let handled = true
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    if (!isEditing.value) {
      const delta = event.shiftKey ? props.step * COARSE_KEY_MULTIPLIER : props.step
      setValueInteractive(props.modelValue + (event.key === 'ArrowUp' ? delta : -delta))
    }
  } else if (event.key === 'Enter') {
    if (isEditing.value) {
      commitEdit()
    }
  } else if (event.key === 'Escape') {
    if (isEditing.value) {
      cancelEdit()
    } else {
      root.value?.blur()
    }
  } else if (event.key === 'Backspace') {
    if (isEditing.value) {
      editText.value = editText.value.slice(0, -1)
    }
  } else if (/^[0-9.-]$/.test(event.key)) {
    if (isEditing.value) {
      editText.value += event.key
    } else {
      editText.value = event.key
      isEditing.value = true
    }
  } else {
    // Tab and everything else keep their default behavior.
    handled = false
  }
  if (handled) {
    event.preventDefault()
    event.stopPropagation()
  }
}

function commitEdit() {
  if (!isEditing.value) {
    return
  }
  const typed = editText.value.trim()
  // A failed parse keeps the old value.
  if (NUMBER_PATTERN.test(typed)) {
    setValueInteractive(parseFloat(typed))
  }
  cancelEdit()
}

function cancelEdit() {
  isEditing.value = false
  editText.value = ''
}

defineExpose({ focus: () => root.value?.focus() })
</script>

<template>
  <div
    ref="root"
    class="text-slider"
    :class="{ editing: isEditing, dragging: isDragging, disabled }"
    role="spinbutton"
    :tabindex="disabled ? -1 : 0"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-valuenow="modelValue"
    :aria-valuetext="unit ? `${displayText} ${unit}` : displayText"
    :aria-disabled="disabled || undefined"
    :data-editing="isEditing || undefined"
    title="Drag up or down, double-click to reset, or type a number"
    @pointerdown="onPointerdown"
    @mousedown="onMousedown"
    @pointermove="onPointermove"
    @pointerup="onPointerup"
    @pointercancel="onPointerup"
    @dblclick="onDoubleClick"
    @keydown="onKeydown"
    @blur="commitEdit"
  >
    <template v-if="isEditing">
      <span class="value">{{ editText }}</span
      ><span class="caret" aria-hidden="true"></span>
    </template>
    <template v-else>
      <span class="value">{{ displayText }}</span>
      <span v-if="unit" class="unit">{{ unit }}</span>
    </template>
  </div>
</template>

<style scoped>
.text-slider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  flex-grow: 1;
  min-width: 2.6rem;
  height: 2.25rem;
  padding: 0 0.5rem;
  border-radius: 6px;
  /* Performer: systemGray at 15% fill, accent at 60% x 35% (unfocused) / 80% (focused) edge. */
  background-color: rgba(142, 142, 147, 0.15);
  border: 1px solid color-mix(in srgb, var(--color-accent-text-btn) 21%, transparent);
  color: var(--color-accent-text-btn);
  cursor: ns-resize;
  -webkit-user-select: none;
  user-select: none;
  touch-action: none;
  outline: none;
}
.text-slider:focus-visible,
.text-slider:focus,
.text-slider.dragging {
  border-color: color-mix(in srgb, var(--color-accent-text-btn) 48%, transparent);
}
/* Never paint a selection highlight, even when a selection started elsewhere covers the box. */
.text-slider::selection,
.text-slider *::selection {
  background: transparent;
}
.text-slider.editing {
  cursor: text;
}
.text-slider.disabled {
  opacity: 0.4;
  cursor: default;
}
.value {
  font-size: 1.6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.unit {
  font-size: 0.7rem;
  opacity: 0.6;
}
.caret {
  width: 2px;
  height: 1.3rem;
  margin-left: 1px;
  background-color: currentColor;
  animation: caret-blink 1s steps(1) infinite;
}
@keyframes caret-blink {
  50% {
    opacity: 0;
  }
}
</style>
