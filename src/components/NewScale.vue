<script setup lang="ts">
import { ref } from 'vue'
import { useScaleStore } from '@/stores/scale'
import { useRackStore } from '@/stores/rack'
import DropdownGroup from '@/components/DropdownGroup.vue'
import { importFile, type ImporterKey } from '@/importers'
import { GENERATORS, type CardGeneratorKind } from '@/rack/generators'

const emit = defineEmits(['done', 'cancel', 'mouseenter'])

const scale = useScaleStore()
const rack = useRackStore()

const element = ref<typeof DropdownGroup | null>(null)
const scalaFile = ref<HTMLInputElement | null>(null)
const anamarkFile = ref<HTMLInputElement | null>(null)
const xendevsFile = ref<HTMLInputElement | null>(null)

// Every generator but the preset loader, which sits with the other ways to load a whole scale.
const generatorItems = (Object.keys(GENERATORS) as CardGeneratorKind[])
  .filter((kind) => kind !== 'preset')
  .map((kind) => ({ kind, title: GENERATORS[kind].title }))

/** Puts this generator in the rack's generator slot, replacing the current one. */
function chooseGenerator(kind: CardGeneratorKind) {
  rack.setGenerator(kind)
}

function clearScale() {
  rack.removeGenerator()
  emit('done')
}

// An import writes finished scale data, which the rack adopts as an imported scale.
async function doImport(importerKey: ImporterKey, event: Event) {
  const result = await importFile(importerKey, event)
  scale.sourceText = result.sourceText
  if (result.baseFrequency !== undefined) {
    scale.userBaseFrequency = result.baseFrequency
    scale.autoFrequency = false
  }
  if (result.name !== undefined) {
    scale.name = result.name
  }
  if (result.baseMidiNote !== undefined) {
    scale.baseMidiNote = result.baseMidiNote
  }
  scale.computeScale()
  emit('done')
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
  <DropdownGroup ref="element" title="New scale" @mouseenter="$emit('mouseenter')">
    <ul>
      <a
        v-for="item of generatorItems"
        :key="item.kind"
        href="#"
        @click="chooseGenerator(item.kind)"
        ><li>{{ item.title }}</li></a
      >
      <li class="divider"></li>
      <a href="#" @click="scalaFile!.click()"><li>Import .scl</li></a>
      <a href="#" @click="anamarkFile!.click()"><li>Import .tun</li></a>
      <a href="#" @click="xendevsFile!.click()"><li>Import .swi</li></a>
      <li class="divider"></li>
      <a href="#" @click="clearScale"><li>Clear scale</li></a>
      <a href="#" @click="chooseGenerator('preset')"><li>Load preset scale</li></a>
    </ul>
  </DropdownGroup>

  <!-- Hidden file inputs for importers -->
  <input
    type="file"
    ref="scalaFile"
    accept=".scl"
    style="display: none"
    @change="doImport('scalascl', $event)"
  />
  <input
    type="file"
    ref="anamarkFile"
    accept=".tun"
    style="display: none"
    @change="doImport('anamark', $event)"
  />
  <input
    type="file"
    ref="xendevsFile"
    accept=".swi"
    style="display: none"
    @change="doImport('xendevs', $event)"
  />
</template>
