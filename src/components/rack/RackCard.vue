<script setup lang="ts">
import { useId } from 'vue'

/**
 * One module in the Build Scale rack. The header toggles the card open or closed (the rack keeps
 * one open at a time) and shows what the module currently produces; the body holds its settings.
 * Modifiers also get a drag handle (↑/↓ on it from the keyboard) and a bypass switch.
 */
withDefaults(
  defineProps<{
    title: string
    /** What the module produces right now, e.g. the generator's scale name. */
    summary?: string
    open: boolean
    removeLabel: string
    /** Shows the drag handle and bypass switch (modifiers). */
    modifier?: boolean
    bypassed?: boolean
    /** Whether it has settings to open. */
    expandable?: boolean
    /** Where the chain fails at this stage. */
    error?: string
    /** Its baked code was made from a different input than it now receives. */
    stale?: boolean
  }>(),
  // Vue would read a missing boolean as false.
  { expandable: true }
)

const emit = defineEmits(['toggle', 'remove', 'bypass', 'move', 'dragstart'])

const bodyId = useId()

function onHandleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault()
    emit('move', event.key === 'ArrowUp' ? -1 : 1)
  }
}
</script>

<template>
  <article
    class="rack-card"
    :class="{ open, bypassed, 'has-error': !!error, modifier }"
    :aria-label="title"
  >
    <header class="rack-card-header">
      <button
        v-if="modifier"
        class="rack-card-handle"
        draggable="true"
        :aria-label="`Move ${title} (arrow keys)`"
        title="Drag to reorder"
        @dragstart="$emit('dragstart', $event)"
        @keydown="onHandleKeydown"
      >
        ⠿
      </button>
      <button
        class="rack-card-toggle"
        :aria-expanded="!expandable ? undefined : open"
        :aria-controls="!expandable ? undefined : bodyId"
        :disabled="!expandable"
        @click="$emit('toggle')"
      >
        <span v-if="expandable !== false" class="chevron" aria-hidden="true">▾</span>
        <span class="titles">
          <span class="title">{{ title }}</span>
          <span v-if="summary" class="summary">{{ summary }}</span>
        </span>
      </button>
      <button
        v-if="modifier"
        class="rack-card-bypass"
        :aria-pressed="!bypassed"
        :aria-label="bypassed ? `Turn ${title} on` : `Bypass ${title}`"
        :title="bypassed ? 'Bypassed: click to turn on' : 'On: click to bypass'"
        @click="$emit('bypass')"
      >
        <span class="led" aria-hidden="true"></span>
      </button>
      <button class="rack-card-remove" :aria-label="removeLabel" @click="$emit('remove')">×</button>
    </header>
    <p v-if="error" class="rack-card-status error" role="status">{{ error }}</p>
    <p v-else-if="stale && !open" class="rack-card-status" role="status">
      The scale above changed since this was made. Open the card to update it.
    </p>
    <div v-if="open" :id="bodyId" class="rack-card-body">
      <slot></slot>
    </div>
  </article>
</template>

<style scoped>
.rack-card {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-background);
}
.rack-card.has-error {
  border-color: var(--color-error, #d33);
}
.rack-card.bypassed .titles {
  opacity: 0.45;
}
.rack-card-header {
  display: flex;
  align-items: stretch;
}
.rack-card.open .rack-card-header {
  border-bottom: 1px solid var(--color-border);
}
.rack-card-header button {
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
}
.rack-card-handle {
  padding: 0 0.25rem 0 0.5rem;
  cursor: grab;
  opacity: 0.6;
  touch-action: none;
}
.rack-card-handle:active {
  cursor: grabbing;
}
.rack-card-toggle {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  text-align: left;
}
.rack-card-toggle:disabled {
  cursor: default;
}
.modifier .rack-card-toggle {
  padding-left: 0.25rem;
}
.chevron {
  display: inline-block;
  transition: transform 0.15s ease;
  transform: rotate(-90deg);
}
.open .chevron {
  transform: none;
}
.titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.title {
  font-weight: bold;
}
.summary {
  font-size: 0.85em;
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rack-card-bypass {
  padding: 0 0.5rem;
  display: flex;
  align-items: center;
}
.led {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background-color: var(--color-accent, #6cf);
  box-shadow: 0 0 0.3rem var(--color-accent, #6cf);
}
.bypassed .led {
  background-color: transparent;
  box-shadow: none;
  border: 1px solid currentColor;
  opacity: 0.6;
}
.rack-card-remove {
  padding: 0 0.75rem;
  font-size: 1.2rem;
  opacity: 0.6;
}
.rack-card-remove:hover,
.rack-card-remove:focus-visible,
.rack-card-handle:hover,
.rack-card-handle:focus-visible {
  opacity: 1;
}
.rack-card-status {
  margin: 0;
  padding: 0.4rem 0.75rem;
  font-size: 0.85em;
  opacity: 0.8;
}
.rack-card-status.error {
  color: var(--color-error, #d33);
  opacity: 1;
}
.rack-card-body {
  padding: 0.75rem;
}
</style>
