<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title: string
}>()
defineEmits(['mouseenter'])
const element = ref<HTMLLIElement | null>(null)
function blur() {
  if (!element.value) {
    return
  }
  element.value.blur()

  // XXX: This should recurse to grandchildren
  for (const child of element.value.children) {
    if (child instanceof HTMLElement) {
      child.blur()
    }
  }
}
defineExpose({ blur })
</script>
<template>
  <li ref="element" class="btn-dropdown-group" @mouseenter="$emit('mouseenter')">
    <a class="btn" href="#">{{ title }} ▼</a>
    <slot></slot>
  </li>
</template>
<style>
.btn-dropdown-group ul {
  list-style: none;
  padding-left: unset;
}
.btn-dropdown-group ul {
  display: none;
  position: absolute;
  width: 16rem;
  margin-top: -1px;
  z-index: 10;
  background-color: var(--color-accent-background);
  border: 1px solid var(--color-accent-text-btn);
}
.btn-dropdown-group li {
  padding: 0rem 0.5rem;
}
.btn-dropdown-group li.divider {
  border-bottom: 1px solid var(--color-accent-text-btn);
}

.btn-dropdown-group.active ul,
.btn-dropdown-group:hover ul,
.btn-dropdown-group:focus-within ul {
  display: block;
}
.btn-dropdown-group ul a {
  color: var(--color-accent-text-btn);
}
.btn-dropdown-group a {
  text-decoration: none;
}
.btn-dropdown-group a:hover li {
  color: white;
  background-color: var(--color-accent);
}
.btn-dropdown-group ul {
  list-style: none;
  padding-left: unset;
}
</style>
