<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { Interval, type Scale } from 'scale-workshop-core'
import { useModalStore } from '@/stores/modal'
import { THIRD } from '@/constants'

const props = defineProps<{
  scale: Scale
}>()

const emit = defineEmits(['update:scale', 'cancel'])

const modal = useModalStore()

function modify() {
  let transposed = props.scale.transpose(modal.offset)
  if (modal.overflowType === 'filter') {
    transposed = transposed.filter()
  } else if (modal.overflowType === 'reduce') {
    transposed = transposed.reduce()
  }
  let scale: Scale
  if (modal.overflowType === 'intuitive') {
    scale = props.scale.variant([...props.scale.intervals])
    let unison: Interval
    if (scale.intervals.length) {
      unison = scale.intervals.shift()!
      scale = scale.merge(transposed)
      if (scale.intervals.length) {
        const highest = scale.intervals.pop()!
        const equave = scale.equave
        if (highest.compare(equave) > 0) {
          scale.intervals.push(equave)
          scale.equave = highest
          scale.sortInPlace(false)
        }
      }
      scale.intervals.unshift(unison!)
    } else {
      scale = props.scale.merge(transposed)
    }
  } else {
    scale = props.scale.merge(transposed)
  }
  emit('update:scale', scale)
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Merge an offset copy of the scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Clone the scale, transpose it by the offset and merge back in with the original.</p>
        <div class="control">
          <label for="offset">Offset</label>
          <ScaleLineInput
            id="offset"
            placeholder="5/4"
            v-model="modal.offsetString"
            :defaultValue="THIRD"
            @update:value="modal.offset = $event"
          />
        </div>
        <div class="control radio-group">
          <label>Overflow</label>
          <span>
            <input
              type="radio"
              id="overflow-intuitive"
              value="intuitive"
              v-model="modal.overflowType"
            />
            <label for="overflow-intuitive"> Keep </label>
          </span>

          <span>
            <input type="radio" id="overflow-filter" value="filter" v-model="modal.overflowType" />
            <label for="method-vals"> Drop </label>
          </span>

          <span>
            <input type="radio" id="overflow-reduce" value="reduce" v-model="modal.overflowType" />
            <label for="overflow-reduce"> Wrap </label>
          </span>
        </div>
      </div>
    </template>
  </Modal>
</template>
