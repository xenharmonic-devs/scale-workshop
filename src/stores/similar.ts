import { ref } from 'vue'
import { defineStore } from 'pinia'
import { computeSimilarScales, type LibraryScale, type SimilarResult } from '@/similar-scales'

export const SCALE_LIBRARY_BASE = 'https://scalelibrary.org'
const SCALE_CENTS_URL = `${SCALE_LIBRARY_BASE}/scale-cents.json`

/**
 * Scale library cache and similar-scales computation store.
 */
export const useSimilarStore = defineStore('similar', () => {
  const library = ref<LibraryScale[]>([])
  const isFetching = ref(false)
  const fetchError = ref<string | null>(null)
  const result = ref<SimilarResult | null>(null)

  async function fetchLibrary() {
    if (library.value.length || isFetching.value) return
    isFetching.value = true
    fetchError.value = null
    try {
      const response = await fetch(SCALE_CENTS_URL)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const raw: Record<string, number[]> = await response.json()
      library.value = Object.entries(raw).map(([stem, cents]) => ({
        stem,
        cents: cents.slice(0, -1),
        period: cents[cents.length - 1]
      }))
    } catch (e) {
      fetchError.value = e instanceof Error ? e.message : String(e)
    } finally {
      isFetching.value = false
    }
  }

  function runComputation(allCents: number[]) {
    if (!library.value.length) return
    const queryPeriod = allCents[allCents.length - 1]
    const queryCents = allCents.slice(0, -1).sort((a, b) => a - b)
    result.value = computeSimilarScales(queryCents, queryPeriod, library.value)
  }

  return { library, isFetching, fetchError, result, fetchLibrary, runComputation }
})
