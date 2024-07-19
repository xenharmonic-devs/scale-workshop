import { ref } from 'vue'
import { defineStore } from 'pinia'
import { KorgModels } from '@/exporters/korg'

export const useExportStore = defineStore('export', () => {
  // Korg
  const korgModel = ref<KorgModels>(KorgModels.MINILOGUE)
  const useOctaveFormat = ref(false)

  return {
    korgModel,
    useOctaveFormat
  }
})
