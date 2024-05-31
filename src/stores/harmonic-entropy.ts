import HE_DATA_URL from '@/assets/harmonic-entropy.ydata.raw?url'
import EntropyWorker from '@/harmonic-entropy-worker?worker'
import { computed, reactive, ref, watch } from 'vue'
import { debounce } from '@/utils'
import { defineStore } from 'pinia'
import { type HarmonicEntropyOptions } from 'harmonic-entropy'

// The app freezes if we try to recalculate entropy in the main thread.
const worker = new EntropyWorker()
// Debounce doesn't block workers so we need extra guards to hide changes that would be overwritten.
let jobId = 0

// Constant options for harmonic-entropy package
const MIN_CENTS = 0
const MAX_CENTS = 6000
const RES = 0.5
const SERIES = 'tenney'
const NORMALIZE = true

export const useHarmonicEntropyStore = defineStore('harmonic-entropy', () => {
  const table = reactive<[number, number][]>([])

  // The fetched N is much larger, but we use a smaller value for the UI.
  const N = ref(10000)
  const a = ref(1)
  const s = ref(0.01)

  const minY = computed(() => Math.min(...table.map((xy) => xy[1])))
  const maxY = computed(() => Math.max(...table.map((xy) => xy[1])))

  async function fetchTable(force = false) {
    if (table.length && !force) {
      return
    }
    const response = await fetch(HE_DATA_URL)
    const buffer = await response.arrayBuffer()
    const tableY = Array.from(new Float32Array(buffer))

    table.length = 0

    let i = 0
    for (let x = 0; x <= MAX_CENTS; x += RES) {
      table.push([x, tableY[i++]])
    }
  }

  worker.onmessage = (e) => {
    if (e.data.jobId === jobId) {
      const tableY = e.data.json.tableY

      table.length = 0
      let i = 0
      for (let x = 0; x <= MAX_CENTS; x += RES) {
        table.push([x, tableY[i++]])
      }
    }
  }

  // Pinia fails to serialize EntropyCalculator so we recreate its functionality here.
  function entropyPercentage(cents: number) {
    if (!table.length) {
      return 0
    }
    cents = Math.abs(cents)
    if (cents >= MAX_CENTS) {
      return (table[table.length - 1][1] - minY.value) / (maxY.value - minY.value)
    }

    let mu = cents / RES
    const index = Math.floor(mu)
    mu -= index

    const y = table[index][1] * (1 - mu) + table[index + 1][1] * mu
    return (y - minY.value) / (maxY.value - minY.value)
  }

  watch(
    N,
    debounce((newValue) => {
      const opts = { ...options.value }
      opts.N = newValue
      worker.postMessage({ options: opts, jobId: ++jobId })
    })
  )

  watch(
    a,
    debounce((newValue) => {
      const opts = { ...options.value }
      opts.a = newValue
      worker.postMessage({ options: opts, jobId: ++jobId })
    })
  )

  watch(
    s,
    debounce((newValue) => {
      const opts = { ...options.value }
      opts.s = newValue
      worker.postMessage({ options: opts, jobId: ++jobId })
    })
  )

  const options = computed<HarmonicEntropyOptions>(() => ({
    N: N.value,
    a: a.value,
    s: s.value,
    minCents: MIN_CENTS,
    maxCents: MAX_CENTS,
    res: RES,
    series: SERIES,
    normalize: NORMALIZE
  }))
  return { table, N, a, s, minY, maxY, options, fetchTable, entropyPercentage }
})
