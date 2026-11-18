<script setup lang="ts">
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import Modal from '@/components/ModalDialog.vue'
import { presets, presetsByGroup } from '@/presets'
import { expandCode } from '@/utils'
import { ref } from 'vue'

defineProps<{
  show: boolean
}>()

const emit = defineEmits([
  'preview',
  'update:source',
  'update:scaleName',
  'update:baseFrequency',
  'update:baseMidiNote',
  'cancel'
])

const presetGroups = presetsByGroup()
const selectedId = ref('')

function build(expand: boolean): GeneratorResult | undefined {
  const preset = presets[selectedId.value]
  if (!preset) {
    return undefined
  }
  return {
    source: expand ? expandCode(preset.source) : preset.source,
    name: preset.name,
    baseFrequency: preset.baseFrequency,
    baseMidiNote: preset.baseMidiNote
  }
}

// Selecting a preset in the list previews it.
useGeneratorPreview(
  () => build(false),
  (result) => emit('preview', result)
)

function confirm(expand = true) {
  const result = build(expand)
  if (!result) {
    return
  }
  emit('update:scaleName', result.name)
  emit('update:baseFrequency', result.baseFrequency)
  emit('update:baseMidiNote', result.baseMidiNote)
  emit('update:source', result.source)
}
</script>

<template>
  <Modal :show="show" embedded @confirm="confirm" @cancel="$emit('cancel')">
    <template #header>
      <h2>Load preset scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <select v-model="selectedId" size="10" class="control">
            <optgroup v-for="group of presetGroups" :key="group.name" :label="group.name">
              <option v-for="preset of group.members" :key="preset.id" :value="preset.id">
                {{ preset.title }}
              </option>
            </optgroup>
          </select>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="confirm(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="confirm(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>
