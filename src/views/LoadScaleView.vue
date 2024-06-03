<script setup lang="ts">
import { API_URL } from '@/constants'
import { useAudioStore } from '@/stores/audio'
import { useScaleStore } from '@/stores/scale'
import { isRandomId, unpackPayload } from '@/utils'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const scale = useScaleStore()
const audio = useAudioStore()

const router = useRouter()

const text = ref('Loading scale...')

onMounted(() => {
  const route = useRoute()
  // Tildes are now wiki or filesystem friendly.
  // Versions < 3.0.0-beta.38 used them. This replacing can be removed at the end of the beta cycle.
  const id = (route.params.id as string).replaceAll('~', '_')

  if (id === '000000000') {
    router.push('/')
    return
  }

  if (!isRandomId(id)) {
    alert('Invalid identifier')
    return
  }

  if (!API_URL) {
    alert('API URL not configured')
  } else {
    fetch(new URL(`scale/${id}.json.gz`, API_URL))
      .then((res) => {
        if (res.ok) {
          text.value = 'Scale loaded. Redirecting...'
          return res.text()
        } else if (res.status === 404) {
          text.value = 'Scale not found.'
        } else {
          text.value = 'Internal server error.'
        }
      })
      .then((body) => {
        if (body) {
          const payload = unpackPayload(body, id)
          audio.initialize()
          audio.fromJSON(payload.audio)
          scale.fromJSON(payload.scale)
          router.push('/')
        }
      })
      .catch(() => (text.value = 'Failed to connect to server.'))
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
