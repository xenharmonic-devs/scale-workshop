<script setup lang="ts">
import { computed, ref } from 'vue'
import { useScaleStore } from '@/stores/scale'
import { useModalStore } from '@/stores/modal'
import { useApproximateByRatiosStore } from '@/stores/approximate-by-ratios'
import { useRackStore } from '@/stores/rack'
import DropdownGroup from '@/components/DropdownGroup.vue'
import { capitalizeFirstLetter } from '@/utils'
import { MODIFIERS, type ModifierKind } from '@/rack/modifiers'

defineEmits(['done', 'cancel', 'mouseenter'])

const scale = useScaleStore()
const modal = useModalStore()
const approx = useApproximateByRatiosStore()
const rack = useRackStore()

const element = ref<typeof DropdownGroup | null>(null)

/**
 * Settings a new modifier starts from that depend on the scale it receives. Each runs once the
 * scale shows the whole chain, which is what a modifier appended at the end receives.
 */
const SETUP: Partial<Record<ModifierKind, () => void>> = {
  rotate: () => modal.initialize(scale.scale.size),
  subset: () => modal.initialize(scale.scale.size),
  'approximate-ratios': () => approx.initialize(),
  reorder: () => {
    modal.reorderOrder = []
  },
  random: () => {
    modal.varianceSeed = Math.floor(Math.random() * 2 ** 31)
  }
}

const items = computed(() =>
  (Object.keys(MODIFIERS) as ModifierKind[]).map((kind) => ({
    kind,
    title:
      kind === 'reduce'
        ? `${capitalizeFirstLetter(scale.nameOfEquave)} reduce`
        : MODIFIERS[kind].title
  }))
)

/** Appends this modifier to the rack's chain. */
function addModifier(kind: ModifierKind) {
  rack.addModifier(kind, SETUP[kind])
}

function blur() {
  if (!element.value) {
    return
  }
  element.value.blur()
}

defineExpose({ blur })
</script>
<template>
  <DropdownGroup ref="element" title="Modify scale" @mouseenter="$emit('mouseenter')">
    <ul>
      <a v-for="item of items" :key="item.kind" href="#" @click.prevent="addModifier(item.kind)"
        ><li>{{ item.title }}</li></a
      >
    </ul>
  </DropdownGroup>
</template>
