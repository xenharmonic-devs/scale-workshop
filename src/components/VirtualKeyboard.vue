<script setup lang="ts">
import { LEFT_MOUSE_BTN } from '@/constants'
import { computed, onMounted, onUnmounted } from 'vue'
import VirtualKeyboardKey from '@/components/VirtualKeyboardKey.vue'
import VirtualKeyInfo from '@/components/VirtualKeyInfo.vue'
import type { Scale } from '@/scale'
import type { NoteOnCallback } from '@/types'
import { axisOffset } from '@/utils'
import { useSlidingTouches } from '@/composables/useSlidingTouches'

type ColorMap = (index: number) => string
type LabelMap = (index: number) => string

const props = defineProps<{
  baseIndex: number // Should incorporate equave shift
  isomorphicHorizontal: number[]
  isomorphicVertical: number[]
  noteOn: NoteOnCallback
  heldNotes: Map<number, number>
  scale: Scale
  colorMap: ColorMap
  labelMap: LabelMap
  showLabel: boolean
  showCents: boolean
  showRatio: boolean
  showFrequency: boolean
  slideBehavior: boolean
}>()

type VirtualKey = {
  x: number
  y: number
  id: string
  index: number
  color: string
  frequency: number
  cents: number
  ratio: number
  label: string
}

const virtualKeys = computed(() => {
  const horizontal = props.isomorphicHorizontal
  const vertical = props.isomorphicVertical
  const result: [number, VirtualKey[]][] = []
  for (let y = 3; y >= -1; y--) {
    const row = []
    for (let x = 0; x <= 12; ++x) {
      const index = props.baseIndex + axisOffset(x, horizontal) + axisOffset(y, vertical)
      const color = props.colorMap(index)
      const ratio = props.scale.getRatio(index)
      const frequency = props.scale.baseFrequency * ratio
      const cents = props.scale.getCents(index)
      const label = props.labelMap(index)
      row.push({
        x,
        y,
        id: `${x},${y}`,
        index,
        color,
        frequency,
        cents,
        ratio,
        label
      })
    }
    result.push([y, row])
  }
  return result
})

const virtualKeyMap = computed(() => {
  const keyMap = new Map<string, VirtualKey>()
  for (const [, row] of virtualKeys.value) {
    for (const key of row) {
      keyMap.set(key.id, key)
    }
  }
  return keyMap
})

const {
  onTouchStart,
  onTouchEnd,
  onTouchMove,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  isKeyActive,
  releaseAll
} = useSlidingTouches({
  slideEnabled: () => props.slideBehavior,
  getKeyFromElement: (element) => {
    const keyElement = element?.closest('[data-key-id]') as HTMLElement | null
    const keyId = keyElement?.dataset.keyId
    if (!keyId) {
      return undefined
    }
    return virtualKeyMap.value.get(keyId)
  },
  noteOn: props.noteOn
})

function windowMouseUp(event: MouseEvent) {
  if (event.button !== LEFT_MOUSE_BTN) {
    return
  }
  releaseAll()
}

onMounted(() => {
  window.addEventListener('mouseup', windowMouseUp)
})

onUnmounted(() => {
  releaseAll()
  window.removeEventListener('mouseup', windowMouseUp)
})
</script>

<template>
  <table>
    <tbody>
      <tr v-for="[y, row] of virtualKeys" :key="y" :class="{ 'hidden-sm': y < 0 || y > 3 }">
        <VirtualKeyboardKey
          v-for="key of row"
          :key="key.id"
          :class="{ 'hidden-sm': key.x > 8 }"
          :key-id="key.id"
          :color="key.color"
          :active="isKeyActive(key)"
          :held="(heldNotes.get(key.index) || 0) > 0"
          @touchstart="onTouchStart($event, key)"
          @touchend="onTouchEnd($event)"
          @touchcancel="onTouchEnd($event)"
          @touchmove="onTouchMove"
          @mousedown="onMouseDown($event, key)"
          @mouseup="onMouseUp($event)"
          @mouseenter="onMouseEnter($event, key)"
        >
          <VirtualKeyInfo
            :label="key.label"
            :cents="key.cents"
            :ratio="key.ratio"
            :frequency="key.frequency"
            :showLabel="props.showLabel"
            :showCents="props.showCents"
            :showRatio="props.showRatio"
            :showFrequency="props.showFrequency"
          />
        </VirtualKeyboardKey>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
table {
  background-color: white;
  border-spacing: 0;
  width: 100%;
  height: 100%;
  min-width: 500px; /* this stops the keys getting too close together for portrait mobile users */
  table-layout: fixed;
}
</style>
