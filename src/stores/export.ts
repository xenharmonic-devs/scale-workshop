import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { KorgModels } from '@/exporters/korg'

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

  return {
    korgModel,
    useOctaveFormat,
    presetIndex
  }
})
