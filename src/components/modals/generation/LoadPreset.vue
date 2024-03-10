<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { presets, presetsByGroup } from '@/presets'
import { expandCode } from '@/utils'
import { ref } from 'vue'

const emit = defineEmits([
  'update:source',
  'update:scaleName',
  'update:baseFrequency',
  'update:baseMidiNote',
  'cancel'
])

const presetGroups = presetsByGroup()
const presetSelect = ref<HTMLSelectElement | null>(null)

function confirm(expand = true) {
  const preset = presets[presetSelect.value!.value]
  emit('update:scaleName', preset.name)
  emit('update:baseFrequency', preset.baseFrequency)
  emit('update:baseMidiNote', preset.baseMidiNote)
  if (expand) {
    emit('update:source', expandCode(preset.source))
  } else {
    emit('update:source', preset.source)
  }
}
</script>

<template>
  <Modal @confirm="confirm" @cancel="$emit('cancel')">
    <template #header>
      <h2>Load preset scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <select ref="presetSelect" size="10" class="control">
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
