<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRackStore, type RackModule } from '@/stores/rack'
import { generatorTitle, type CardGeneratorKind } from '@/rack/generators'
import { modifierComponent, modifierDefinition, type ModifierKind } from '@/rack/modifiers'
import RackCard from '@/components/rack/RackCard.vue'
import RackStage from '@/components/rack/RackStage.vue'

/**
 * The Build Scale side panel's rack: the generator slot, then the modifier chain in order.
 * Cards only report their results to the rack; the rack writes Scale data.
 */
const rack = useRackStore()

/**
 * Cards with settings that haven't produced their first result yet. A card only produces code
 * while it is mounted, so one closed before it got there (another card opened in the same moment,
 * or while it was still loading) is kept mounted out of sight until it has.
 */
const pending = computed(() =>
  [rack.generator, ...rack.modifiers].filter(
    (module): module is RackModule =>
      !!module &&
      !module.code &&
      module.id !== rack.openId &&
      module.kind !== 'imported' &&
      (module.role === 'generator' || !!modifierComponent(module.kind as ModifierKind))
  )
)

function modifierTitle(module: RackModule) {
  return modifierDefinition(module.kind as ModifierKind).title
}

// === Reordering by drag ===

const dragIndex = ref<number | null>(null)
const dropIndex = ref<number | null>(null)

function onDragStart(index: number, event: DragEvent) {
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    // Firefox only starts a drag that carries data.
    event.dataTransfer.setData('text/plain', String(index))
    const card = (event.target as HTMLElement).closest('.rack-card')
    if (card) {
      event.dataTransfer.setDragImage(card, 16, 16)
    }
  }
}

function onDragOver(index: number, event: DragEvent) {
  if (dragIndex.value === null) {
    return
  }
  event.preventDefault()
  dropIndex.value = index
}

function onDrop(index: number) {
  if (dragIndex.value !== null) {
    rack.moveModifier(dragIndex.value, index)
  }
  endDrag()
}

function endDrag() {
  dragIndex.value = null
  dropIndex.value = null
}

function move(index: number, delta: number) {
  rack.moveModifier(index, index + delta)
}
</script>

<template>
  <section class="rack" aria-label="Scale rack">
    <p v-if="!rack.generator" class="rack-note">
      Choose a generator from <em>New scale</em> to start building a scale.
    </p>
    <RackCard
      v-else
      class="generator"
      :title="generatorTitle(rack.generator.kind as CardGeneratorKind | 'imported')"
      :summary="rack.generator.name"
      :open="rack.openId === rack.generator.id"
      :error="rack.stageErrors[rack.generator.id]"
      remove-label="Remove generator"
      @toggle="rack.toggle(rack.generator.id)"
      @remove="rack.removeGenerator()"
    >
      <p v-if="rack.generator.kind === 'imported'" class="rack-note">
        This scale arrived as finished scale data (an import, a link or a restored session). Its
        notes are in Scale data. Editing them here comes later.
      </p>
      <RackStage v-else :key="rack.generator.id" :module="rack.generator" />
    </RackCard>

    <ol v-if="rack.modifiers.length" class="chain" aria-label="Modifiers">
      <li
        v-for="(module, index) of rack.modifiers"
        :key="module.id"
        :class="{
          dragging: dragIndex === index,
          'drop-target': dropIndex === index && dragIndex !== index
        }"
        @dragover="onDragOver(index, $event)"
        @drop.prevent="onDrop(index)"
        @dragend="endDrag"
      >
        <RackCard
          modifier
          :title="modifierTitle(module)"
          :summary="module.name"
          :open="rack.openId === module.id"
          :expandable="!!modifierComponent(module.kind as ModifierKind)"
          :bypassed="module.bypassed"
          :error="rack.stageErrors[module.id]"
          :stale="rack.staleIds.has(module.id)"
          :remove-label="`Remove ${modifierTitle(module)}`"
          @toggle="rack.toggle(module.id)"
          @remove="rack.removeModule(module.id)"
          @bypass="rack.toggleBypass(module.id)"
          @move="move(index, $event)"
          @dragstart="onDragStart(index, $event)"
        >
          <RackStage :key="module.id" :module="module" />
        </RackCard>
      </li>
    </ol>

    <div hidden>
      <RackStage v-for="module of pending" :key="module.id" :module="module" />
    </div>
  </section>
</template>

<style scoped>
.rack-note {
  opacity: 0.7;
}
.chain {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
}
.chain li + li {
  margin-top: 0.5rem;
}
/* A line from card to card: the chain runs top to bottom. */
.chain li {
  position: relative;
}
.chain li::before {
  content: '';
  position: absolute;
  left: 1rem;
  top: -0.5rem;
  height: 0.5rem;
  border-left: 1px solid var(--color-border);
}
.chain li.dragging {
  opacity: 0.4;
}
.chain li.drop-target {
  outline: 2px dashed var(--color-accent, #6cf);
  outline-offset: 2px;
  border-radius: 6px;
}
</style>
