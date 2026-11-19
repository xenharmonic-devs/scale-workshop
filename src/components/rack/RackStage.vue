<script setup lang="ts">
import { computed, provide } from 'vue'
import { useRackStore, type RackModule } from '@/stores/rack'
import { generatorComponent, type CardGeneratorKind } from '@/rack/generators'
import { modifierComponent, type ModifierKind } from '@/rack/modifiers'
import { STAGE_INPUT, type StageInput } from '@/rack/stage-input'
import type { GeneratorResult } from '@/composables/useGeneratorPreview'

/**
 * One module's card contents, wired to the rack: it hands a modifier the chain above it as its
 * input, and reports every result back as the module's code.
 */
const props = defineProps<{ module: RackModule }>()

const rack = useRackStore()

const isModifier = computed(() => props.module.role === 'modifier')

const input = computed(() => (isModifier.value ? rack.stageInput(props.module.id) : null))

// Read only while the card is rendered, which is only while the input exists.
provide(
  STAGE_INPUT,
  computed(() => input.value as StageInput)
)

const component = computed(() =>
  isModifier.value
    ? modifierComponent(props.module.kind as ModifierKind)
    : generatorComponent(props.module.kind as CardGeneratorKind)
)

function onPreview(result: GeneratorResult) {
  rack.updateModule(props.module.id, result)
}
</script>

<template>
  <p v-if="isModifier && !input" class="rack-note">
    Nothing reaches this card: the chain above it doesn't produce a scale.
  </p>
  <component v-else :is="component" :show="true" @preview="onPreview" />
</template>

<style scoped>
.rack-note {
  opacity: 0.7;
}
</style>
