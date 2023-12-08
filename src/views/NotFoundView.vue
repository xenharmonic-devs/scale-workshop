<script setup lang="ts">
/**
 * 404 page with an easter egg for generating an octaplex scale
 */

import OctaplexPortal from '@/components/modals/generation/SummonOctaplex.vue'
import { encodeQuery } from '@/url-encode'
import type { Scale } from 'scale-workshop-core'
import { nextTick, ref } from 'vue'
import { useRouter, type LocationQuery } from 'vue-router'
import { version } from '../../package.json'

const props = defineProps<{
  scaleName: string
  scaleLines: string[]
  baseMidiNote: number
  keyColors: string[]

  scale: Scale

  isomorphicHorizontal: number
  isomorphicVertical: number

  keyboardMode: 'isomorphic' | 'piano'
  pianoMode: 'Asdf' | 'QweZxc0' | 'QweZxc1'

  equaveShift: number
  degreeShift: number

  waveform: string
  attackTime: number
  decayTime: number
  sustainLevel: number
  releaseTime: number

  pingPongDelayTime: number
  pingPongFeedback: number
  pingPongSeparation: number
  pingPongGain: number
}>()

const emit = defineEmits(['update:scale', 'update:scaleName'])

const ritualInProgress = ref(false)

const router = useRouter()

function openTheGates(scale: Scale) {
  emit('update:scale', scale)

  // Unfortunately we need to encode the state here.
  // Simply navigating to "/" triggers decoding of the default empty state.
  nextTick(() => {
    const state = {
      scaleName: props.scaleName,
      scaleLines: props.scaleLines,
      baseFrequency: props.scale.baseFrequency,
      baseMidiNote: props.baseMidiNote,
      keyColors: props.keyColors,
      isomorphicHorizontal: props.isomorphicHorizontal,
      isomorphicVertical: props.isomorphicVertical,
      keyboardMode: props.keyboardMode,
      pianoMode: props.pianoMode,
      equaveShift: props.equaveShift,
      degreeShift: props.degreeShift,

      waveform: props.waveform,
      attackTime: props.attackTime,
      decayTime: props.decayTime,
      sustainLevel: props.sustainLevel,
      releaseTime: props.releaseTime,

      pingPongDelayTime: props.pingPongDelayTime,
      pingPongFeedback: props.pingPongFeedback,
      pingPongSeparation: props.pingPongSeparation,
      pingPongGain: props.pingPongGain
    }

    const query = encodeQuery(state) as LocationQuery
    query.version = version

    router.push({ path: '/', query })
  })
}
</script>

<template>
  <main>
    <div class="labyrinth">
      <h2>Not found</h2>
      <p>
        We couldn't find what you were looking for, but
        <a href="#" @click="ritualInProgress = true">here's an octaplex</a>.
      </p>
    </div>
    <Teleport to="body">
      <OctaplexPortal
        :show="ritualInProgress"
        @update:scaleName="emit('update:scaleName', $event)"
        @update:scale="openTheGates"
        @cancel="ritualInProgress = false"
      />
    </Teleport>
  </main>
</template>

<style scoped>
.labyrinth {
  height: 100%;
  padding: 1rem;
}
.labyrinth > * {
  max-width: 30rem;
}
</style>
