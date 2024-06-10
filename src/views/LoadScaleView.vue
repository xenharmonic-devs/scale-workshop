<script setup lang="ts">
import { API_URL } from '@/constants'
import { useAudioStore } from '@/stores/audio'
import { useCyclesStore } from '@/stores/edo-cycles'
import { useGridStore } from '@/stores/grid'
import { useJiLatticeStore } from '@/stores/ji-lattice'
import { useScaleStore } from '@/stores/scale'
import { useStateStore } from '@/stores/state'
import { isRandomId, unpackPayload } from '@/utils'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const scale = useScaleStore()
const audio = useAudioStore()
const state = useStateStore()
const jiLattice = useJiLatticeStore()
const grid = useGridStore()
const cycles = useCyclesStore()

const router = useRouter()

const text = ref('Loading scale...')

onMounted(async () => {
  const route = useRoute()
  // Tildes are not wiki friendly.
  // Versions < 3.0.0-beta.38 used them. This replacing can be removed at the end of the beta cycle.
  const id = (route.params.id as string).replaceAll('~', '_')

  if (id === '000000000') {
    await router.push('/')
    return
  }

  if (!isRandomId(id)) {
    alert('Invalid identifier')
    return
  }

  if (!API_URL) {
    alert('API URL not configured')
  } else {
    try {
      // XXX: Dashes are not filesystem friendly, but that's a problem for sw-server to solve.
      const res = await fetch(new URL(`scale/${id}`, API_URL))
      if (res.ok) {
        text.value = 'Scale loaded. Redirecting...'
        const body = await res.text()
        if (body) {
          const payload = unpackPayload(body, id)
          audio.initialize()
          audio.fromJSON(payload.audio)
          scale.fromJSON(payload.scale)
          if ('state' in payload) {
            state.fromJSON(payload.state)
          }
          if ('ji-lattice' in payload) {
            jiLattice.fromJSON(payload['ji-lattice'])
          }
          if ('grid' in payload) {
            grid.fromJSON(payload.grid)
          }
          if ('edo-cycles' in payload) {
            cycles.fromJSON(payload['edo-cycles'])
          }
          await router.push('/')
        } else {
          text.value = 'Received empty response from the server.'
        }
      } else if (res.status === 404) {
        text.value = 'Scale not found.'
      } else {
        text.value = 'Internal server error.'
      }
    } catch {
      text.value = 'Failed to connect to server.'
    }
  }
})
</script>
<template>
  <div>
    <p>{{ text }}</p>
  </div>
</template>

<style scoped>
div {
  padding: 1rem;
}
p {
  font-size: large;
}
</style>
