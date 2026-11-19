<script setup lang="ts">
import { useGeneratorPreview, type GeneratorResult } from '@/composables/useGeneratorPreview'
import { useStageInput } from '@/rack/stage-input'
import Modal from '@/components/ModalDialog.vue'
import { useModalStore } from '@/stores/modal'
import { arrayToString } from '@/utils'
import type { Interval } from 'sonic-weave/interval'
import { computed, ref, watch } from 'vue'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['preview', 'done', 'cancel'])

const modal = useModalStore()
const input = useStageInput()

const offsetsElement = ref<HTMLInputElement | null>(null)

const explanation = computed(() => {
  switch (modal.overflowType) {
    case 'drop':
      return 'Values below 1/1 or above your equave are eliminated.'
    case 'keep':
      return 'Values below 1/1 or above your equave are preserved.'
    case 'wrap':
      return 'Values are wrapped to remain between 1/1 and your equave.'
  }
  throw new Error('Unreachable')
})

watch(
  () => modal.offsetsError,
  (newError) => offsetsElement.value!.setCustomValidity(newError)
)

function build(): GeneratorResult {
  let code = ''
  code += `\nmergeOffset(${arrayToString(modal.offsets as Interval[])}, '${modal.overflowType}')`
  return { source: code.trim(), name: `Offsets ${modal.offsetsString}, ${modal.overflowType}` }
}

useGeneratorPreview(
  build,
  (result) => emit('preview', result),
  () => input.value.code
)
</script>

<template>
  <Modal :show="show" embedded>
    <template #header>
      <h2>Merge offset copies of the scale</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Clone the scale, transpose it by the offsets and merge back in with the original.</p>
        <div class="control">
          <label for="offsets">Offsets</label>
          <input
            ref="offsetsElement"
            id="offsets"
            type="text"
            class="control"
            placeholder="5/4"
            v-model="modal.offsetsString"
          />
        </div>
        <div class="control radio-group">
          <label>Overflow</label>
          <span>
            <input type="radio" id="overflow-keep" value="keep" v-model="modal.overflowType" />
            <label for="overflow-keep">Keep</label>
          </span>

          <span>
            <input type="radio" id="overflow-drop" value="drop" v-model="modal.overflowType" />
            <label for="overflow-drop">Drop</label>
          </span>

          <span>
            <input type="radio" id="overflow-wrap" value="wrap" v-model="modal.overflowType" />
            <label for="overflow-wrap">Wrap</label>
          </span>
        </div>
        <aside>{{ explanation }}</aside>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
aside {
  font-size: smaller;
}
</style>
