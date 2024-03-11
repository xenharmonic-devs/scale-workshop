<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { clamp } from 'xen-dev-utils'
import { useModalStore } from '@/stores/modal'
import { expandCode } from '@/utils'

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

const modal = useModalStore()

function generate(expand = true) {
  const clampedGuide = Math.round(clamp(1, 1000000000, modal.guideTone))
  const clampedRoot = Math.round(clamp(1, 1000000000, modal.rootTone))
  let name = `Euler-Fokker genus ${clampedGuide}`
  let source = `eulerGenus(${clampedGuide}`
  if (clampedRoot !== 1) {
    name += ` on ${clampedRoot}`
    source += `, ${clampedRoot}`
  }
  if (modal.integerEquave !== 2) {
    name += ` against ${modal.integerEquave}`
    if (clampedRoot === 1) {
      source += ', niente'
    }
    source += `, ${modal.integerEquave}`
  }
  source += ')'
  emit('update:scaleName', name)
  if (expand) {
    emit('update:source', expandCode(source))
  } else {
    emit('update:source', source)
  }
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate Euler-Fokker genus</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="guide-tone">Guide Tone</label>
          <input
            id="guide-tone"
            type="number"
            min="1"
            max="1000000000"
            class="control"
            v-model="modal.guideTone"
          />
        </div>
        <div class="control">
          <label for="guide-tone">Root Tone</label>
          <input
            id="root-tone"
            type="number"
            min="1"
            max="1000000000"
            class="control"
            v-model="modal.rootTone"
          />
        </div>
        <div class="control">
          <label for="equave">Equave</label>
          <input id="equave" type="number" min="2" class="control" v-model="modal.integerEquave" />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="() => generate(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="() => generate(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>
