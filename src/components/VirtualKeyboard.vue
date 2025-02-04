<script setup lang="ts">
import { computed, ref } from 'vue'
import VirtualKeyboardKey from '@/components/VirtualKeyboardKey.vue'
import VirtualKeyInfo from '@/components/VirtualKeyInfo.vue'
import type { Scale } from '@/scale'


//added by kFXs
import ScoreView from '@/components/ScoreView.vue'
import { useStateStore } from '@/stores/state'

const state = useStateStore()



type NoteOff = () => void
type NoteOnCallback = (index: number) => NoteOff
type ColorMap = (index: number) => string
type LabelMap = (index: number) => string

const props = defineProps<{
  baseIndex: number // Should incorporate equave shift
  isomorphicHorizontal: number
  isomorphicVertical: number
  noteOn: NoteOnCallback
  heldNotes: Map<number, number>
  scale: Scale
  colorMap: ColorMap
  labelMap: LabelMap
  showLabel: boolean
  showCents: boolean
  showRatio: boolean
  showFrequency: boolean
}>()

type VirtualKey = {
  x: number
  y: number
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
      const index = props.baseIndex + x * horizontal + y * vertical
      const color = props.colorMap(index)
      const ratio = props.scale.getRatio(index)
      const frequency = props.scale.baseFrequency * ratio
      const cents = props.scale.getCents(index)
      const label = props.labelMap(index)
      row.push({
        x,
        y,
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

const isMousePressed = ref(false)
</script>
<template>

  <!---added by kFXs-->
  <ScoreView v-show="state.showMusicalScore" />
  <!-------------------------->
  
  <table>
    <tbody>
      <tr v-for="[y, row] of virtualKeys" :key="y" :class="{ 'hidden-sm': y < 0 || y > 3 }">
        <VirtualKeyboardKey
          v-for="key of row"
          :key="key.x"
          :class="{
            'hidden-sm': key.x > 8,
            held: (heldNotes.get(key.index) || 0) > 0
          }"
          :index="key.index"
          :color="key.color"
          :isMousePressed="isMousePressed"
          :noteOn="() => noteOn(key.index)"
          @press="isMousePressed = true"
          @unpress="isMousePressed = false"
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
  border-spacing: 0px;
  width: 100%;
  height: 100%;
  min-width: 500px; /* this stops the keys getting too close together for portrait mobile users */
  table-layout: fixed;
}
</style>
