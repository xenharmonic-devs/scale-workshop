<script setup lang="ts">
import { useRackStore } from '@/stores/rack'
import { generatorComponent, generatorTitle } from '@/rack/generators'
import type { GeneratorResult } from '@/composables/useGeneratorPreview'
import RackCard from '@/components/rack/RackCard.vue'

/**
 * The Build Scale side panel's rack: the generator slot (and, later, the modifier chain).
 * Cards only report their results to the rack; the rack writes Scale data.
 */
const rack = useRackStore()

function onPreview(id: string, result: GeneratorResult) {
  rack.updateGenerator(id, result)
}
</script>

<template>
  <section class="rack" aria-label="Scale rack">
    <p v-if="!rack.generator" class="rack-empty">
      Choose a generator from <em>New scale</em> to start building a scale.
    </p>
    <RackCard
      v-else
      :title="generatorTitle(rack.generator.kind)"
      :summary="rack.generator.name"
      :open="rack.openId === rack.generator.id"
      remove-label="Remove generator"
      @toggle="rack.toggle(rack.generator.id)"
      @remove="rack.removeGenerator()"
    >
      <p v-if="rack.generator.kind === 'imported'" class="rack-note">
        This scale arrived as finished scale data (an import, a preset link or a Modify scale
        result). Its notes are in Scale data. Editing them here comes later.
      </p>
      <component
        v-else
        :is="generatorComponent(rack.generator.kind)"
        :key="rack.generator.id"
        :show="true"
        @preview="onPreview(rack.generator.id, $event)"
      />
    </RackCard>
  </section>
</template>

<style scoped>
.rack-empty,
.rack-note {
  opacity: 0.7;
}
</style>
