<script setup lang="ts">
import { onMounted } from 'vue'
import { type Interval } from 'sonic-weave/interval'
import { useSimilarStore } from '@/stores/similar'
import { stemBasename } from '@narenratan/scale-library'

const props = defineProps<{
  relativeIntervals: Interval[]
}>()

const similar = useSimilarStore()

onMounted(async () => {
  await similar.fetchLibrary()
  similar.runComputation(props.relativeIntervals.map((i) => i.totalCents(true)))
})
</script>

<template>
  <main class="similar-scales">
    <p v-if="similar.isFetching">Fetching scale library data…</p>
    <p v-else-if="similar.fetchError" class="error">
      Failed to load scale library: {{ similar.fetchError }}
    </p>
    <template v-else-if="similar.result">
      <section>
        <h2>Similar scales</h2>
        <p v-if="!similar.result.similar.length">No similar scales found.</p>
        <table v-else>
          <thead>
            <tr>
              <th>File</th>
              <th>Notes</th>
              <th>Rotation</th>
              <th>Max diff (¢)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in similar.result.similar" :key="entry.stem">
              <td>
                <a
                  :href="`https://scalelibrary.org/scales/${entry.stem}/`"
                  target="_blank"
                  rel="noopener"
                  class="external-link"
                  >{{ stemBasename(entry.stem) }}</a
                >
              </td>
              <td>{{ entry.notes }}</td>
              <td>{{ entry.mode }}</td>
              <td>{{ entry.maxDiff.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Child scales</h2>
        <p v-if="!similar.result.children.length">No child scales found.</p>
        <table v-else>
          <thead>
            <tr>
              <th>File</th>
              <th>Notes</th>
              <th>Max diff (¢)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in similar.result.children" :key="entry.stem">
              <td>
                <a
                  :href="`https://scalelibrary.org/scales/${entry.stem}/`"
                  target="_blank"
                  rel="noopener"
                  class="external-link"
                  >{{ stemBasename(entry.stem) }}</a
                >
              </td>
              <td>{{ entry.notes }}</td>
              <td>{{ entry.maxDiff.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Parent scales</h2>
        <p v-if="!similar.result.parents.length">No parent scales found.</p>
        <table v-else>
          <thead>
            <tr>
              <th>File</th>
              <th>Notes</th>
              <th>Max diff (¢)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in similar.result.parents" :key="entry.stem">
              <td>
                <a
                  :href="`https://scalelibrary.org/scales/${entry.stem}/`"
                  target="_blank"
                  rel="noopener"
                  class="external-link"
                  >{{ stemBasename(entry.stem) }}</a
                >
              </td>
              <td>{{ entry.notes }}</td>
              <td>{{ entry.maxDiff.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </main>
</template>

<style scoped>
.similar-scales {
  padding: 0.5rem 1rem;
  overflow-y: auto;
}
.similar-scales section {
  margin-bottom: 1.5rem;
}
.similar-scales table {
  border-collapse: collapse;
}
.similar-scales th,
.similar-scales td {
  border: 1px solid var(--color-border);
  padding: 0.2rem 0.6rem;
}
.similar-scales th {
  font-weight: bold;
}
.similar-scales a {
  color: var(--color-accent-text-btn);
}
.similar-scales .error {
  color: var(--color-error);
}

a.external-link::after {
  content: '🔗';
  display: inline-block;
  margin-left: 0.25rem;
}
</style>
