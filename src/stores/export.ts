import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { KorgModels } from '@/exporters/korg'
import type { LineFormat } from '@/exporters/base'

export const useExportStore = defineStore('export', () => {
  // Korg
  const korgModel = ref<KorgModels>(KorgModels.MINILOGUE)
  const useOctaveFormat = ref(false)

  // MTS sysex
  const presetIndex = ref(0)

  watch(presetIndex, (newValue) => {
    newValue = parseInt(newValue as any, 10)
    if (isNaN(newValue)) {
      presetIndex.value = 0
    }
    if (newValue < 0) {
      presetIndex.value = 0
    }
    if (newValue > 127) {
      presetIndex.value = 127
    }
  })

  // Reaper
  const format = ref<LineFormat>('label')
  const basePeriod = ref(0)
  const baseDegree = ref(0)
  const centsRoot = ref(0)
  const integratePeriod = ref(false)
  const displayPeriod = ref(true)

  // Scala .scl
  const centsFractionDigits = ref(6)
  const includeLabels = ref(false)
  const commentLabels = ref(true)
  const includeColors = ref(false)

  return {
    korgModel,
    useOctaveFormat,
    presetIndex,
    format,
    basePeriod,
    baseDegree,
    centsRoot,
    integratePeriod,
    displayPeriod,
    centsFractionDigits,
    includeLabels,
    commentLabels,
    includeColors
  }
})
