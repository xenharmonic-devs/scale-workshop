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
import { useAudioStore } from '@/stores/audio'
import { useStateStore } from '@/stores/state'

const ritualInProgress = ref(false)

const router = useRouter()

const state = useStateStore()

const audio = useAudioStore()

function openTheGates(scale: Scale) {
  state.scale = scale

  // Unfortunately we need to encode the state here.
  // Simply navigating to "/" triggers decoding of the default empty state.
  nextTick(() => {
    const encodedState = {
      scaleName: state.scaleName,
      scaleLines: state.scaleLines,
      baseFrequency: state.scale.baseFrequency,
      baseMidiNote: state.baseMidiNote,
      keyColors: state.keyColors,
      isomorphicHorizontal: state.isomorphicHorizontal,
      isomorphicVertical: state.isomorphicVertical,
      keyboardMode: state.keyboardMode,
      pianoMode: state.pianoMode,
      equaveShift: state.equaveShift,
      degreeShift: state.degreeShift,

      waveform: audio.waveform,
      attackTime: audio.attackTime,
      decayTime: audio.decayTime,
      sustainLevel: audio.sustainLevel,
      releaseTime: audio.releaseTime,

      pingPongDelayTime: audio.pingPongDelayTime,
      pingPongFeedback: audio.pingPongFeedback,
      pingPongSeparation: audio.pingPongSeparation,
      pingPongGain: audio.pingPongGain
    }

    const query = encodeQuery(encodedState) as LocationQuery
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
        @update:scaleName="state.scaleName = $event"
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
