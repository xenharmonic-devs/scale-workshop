<script setup lang="ts">
import { useId } from 'vue'

/**
 * One module in the Build Scale rack. The header toggles the card open or closed (the rack keeps
 * one open at a time) and shows what the module currently produces; the body holds its settings.
 */
defineProps<{
  title: string
  /** What the module produces right now, e.g. the generator's scale name. */
  summary?: string
  open: boolean
  removeLabel: string
}>()

defineEmits(['toggle', 'remove'])

const bodyId = useId()
</script>

<template>
  <article class="rack-card" :class="{ open }">
    <header class="rack-card-header">
      <button
        class="rack-card-toggle"
        :aria-expanded="open"
        :aria-controls="bodyId"
        @click="$emit('toggle')"
      >
        <span class="chevron" aria-hidden="true">▾</span>
        <span class="titles">
          <span class="title">{{ title }}</span>
          <span v-if="summary" class="summary">{{ summary }}</span>
        </span>
      </button>
      <button class="rack-card-remove" :aria-label="removeLabel" @click="$emit('remove')">×</button>
    </header>
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
.rack-card + .rack-card {
  margin-top: 0.5rem;
}
.rack-card-header {
  display: flex;
  align-items: stretch;
}
.rack-card.open .rack-card-header {
  border-bottom: 1px solid var(--color-border);
}
.rack-card-toggle {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
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
.rack-card-remove {
  border: none;
  background: none;
  color: inherit;
  padding: 0 0.75rem;
  font-size: 1.2rem;
  opacity: 0.6;
  cursor: pointer;
}
.rack-card-remove:hover,
.rack-card-remove:focus-visible {
  opacity: 1;
}
.rack-card-body {
  padding: 0.75rem;
}
</style>
