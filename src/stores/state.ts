import { reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { UNIX_NEWLINE } from '@/constants'
import { syncValues } from '@/utils'

export const useStateStore = defineStore('state', () => {
  const isomorphicVertical = ref(5)
  const isomorphicHorizontal = ref(1)
  // Mapping from MIDI index to number of interfaces currently pressing the key down
  const heldNotes = reactive(new Map<number, number>())
  const typingActive = ref(true)

  const latticeType = ref<'ji' | 'et'>('et')

  // These user preferences are fetched from local storage.
  const storage = window.localStorage
  const newline = ref(storage.getItem('newline') ?? UNIX_NEWLINE)

  const storedScheme = storage.getItem('colorScheme')
  const mediaScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const colorScheme = ref<'light' | 'dark'>(
    (storedScheme ?? mediaScheme) === 'dark' ? 'dark' : 'light'
  )
  const centsFractionDigits = ref(parseInt(storage.getItem('centsFractionDigits') ?? '3', 10))
  const decimalFractionDigits = ref(parseInt(storage.getItem('decimalFractionDigits') ?? '5', 10))
  const showVirtualQwerty = ref(storage.getItem('showVirtualQwerty') === 'true')

  // Analysis preferences
  const intervalMatrixIndexing = ref(parseInt(storage.getItem('intervalMatrixIndexing') ?? '0', 10))
  const maxMatrixWidth = ref(parseInt(storage.getItem('maxMatrixWidth') ?? '100', 10))
  const calculateConstantStructureViolations = ref(
    storage.getItem('calculateConstantStructureViolations') === 'true'
  )
  const calculateVariety = ref(storage.getItem('calculateVariety') === 'true')
  const calculateBrightness = ref(storage.getItem('calculateBrightness') === 'true')
  const constantStructureMargin = ref(
    parseInt(storage.getItem('constantStructureMargin') ?? '0', 10)
  )

  // Special keyboard codes also from local storage.
  const deactivationCode = ref(storage.getItem('deactivationCode') ?? 'Backquote')
  const equaveUpCode = ref(storage.getItem('equaveUpCode') ?? 'NumpadMultiply')
  const equaveDownCode = ref(storage.getItem('equaveDownCode') ?? 'NumpadDivide')
  const degreeUpCode = ref(storage.getItem('degreeUpCode') ?? 'NumpadAdd')
  const degreeDownCode = ref(storage.getItem('degreeDownCode') ?? 'NumpadSubtract')

  // Local storage watchers
  syncValues({
    newline,
    centsFractionDigits,
    decimalFractionDigits,
    showVirtualQwerty,
    intervalMatrixIndexing,
    maxMatrixWidth,
    calculateConstantStructureViolations,
    calculateVariety,
    calculateBrightness,
    constantStructureMargin,
    deactivationCode,
    equaveUpCode,
    equaveDownCode,
    degreeUpCode,
    degreeDownCode
  })
  watch(
    colorScheme,
    (newValue) => {
      storage.setItem('colorScheme', newValue)
      document.documentElement.setAttribute('data-theme', newValue)
    },
    { immediate: true }
  )

  return {
    // Live state
    isomorphicVertical,
    isomorphicHorizontal,
    heldNotes,
    typingActive,
    latticeType,
    // Persistent state
    newline,
    colorScheme,
    centsFractionDigits,
    decimalFractionDigits,
    showVirtualQwerty,
    intervalMatrixIndexing,
    maxMatrixWidth,
    calculateConstantStructureViolations,
    calculateVariety,
    calculateBrightness,
    constantStructureMargin,
    deactivationCode,
    equaveUpCode,
    equaveDownCode,
    degreeUpCode,
    degreeDownCode
  }
})
