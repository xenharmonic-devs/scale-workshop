<script setup lang="ts">
/**
 * 404 page with an easter egg for generating an octaplex scale
 */

import OctaplexPortal from '@/components/modals/generation/SummonOctaplex.vue'
import { useRouter } from 'vue-router'
import { useScaleStore } from '@/stores/scale'
import { ref } from 'vue'

const ritualInProgress = ref(false)

const router = useRouter()
const scale = useScaleStore()

async function openTheGates(source: string) {
  scale.sourceText = source
  scale.computeScale()
  ritualInProgress.value = false
  await router.push({ path: '/' })
}
</script>

<template>
  <main>
    <div class="labyrinth">
      <h2>Not found</h2>
      <p>
        We couldn't find what you were looking for, but
        <a id="octaplex" href="#" @click="ritualInProgress = true">here's an octaplex</a>.
      </p>
    </div>
    <Teleport to="body">
      <OctaplexPortal
        :show="ritualInProgress"
        @update:scaleName="scale.name = $event"
        @update:source="openTheGates"
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
