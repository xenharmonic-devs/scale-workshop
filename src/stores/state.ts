import { reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { UNIX_NEWLINE } from '@/constants'
import { syncValues } from '@/utils'

export const useStateStore = defineStore('state', () => {
  // Nonpersistent state of the application
  const scoreChord = reactive(new Set<string>())

  // Mapping from MIDI index to number of interfaces currently pressing the key down
  const heldNotes = reactive(new Map<number, number>())
  const typingActive = ref(true)

  const latticeType = ref<'ji' | 'et' | 'cycles' | '3d' | 'auto'>('auto')

  // These user preferences are fetched from local storage.
  const storage = window.localStorage
  const newline = ref(storage.getItem('newline') ?? UNIX_NEWLINE)

  const storedScheme = storage.getItem('colorScheme')
  const mediaScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const colorScheme = ref<'light' | 'dark'>(
    (storedScheme ?? mediaScheme) === 'dark' ? 'dark' : 'light'
  )
  const showVirtualQwerty = ref(storage.getItem('showVirtualQwerty') === 'true')
  const showMusicalScore = ref(storage.getItem('showMusicalScore') === 'true')
  const showMosTab = ref(storage.getItem('showMosTab') === 'true')
  const showKeyboardLabel = ref(storage.getItem('showKeyboardLabel') !== 'false')
  const showKeyboardCents = ref(storage.getItem('showKeyboardCents') !== 'false')
  const showKeyboardRatio = ref(storage.getItem('showKeyboardRatio') !== 'false')
  const showKeyboardFrequency = ref(storage.getItem('showKeyboardFrequency') !== 'false')

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

  // Opt-in for user statistics
  const shareStatistics = ref(storage.getItem('shareStatistics') === 'true')

  // The app doesn't fully work on Safari. Inform the user.
  const showSafariWarning = ref(storage.getItem('showSafariWarning') !== 'false')

  // Debugging features.
  const debug = ref(storage.getItem('debug') === 'true')

  /**
   * Convert live state to a format suitable for storing on the server.
   */
  function toJSON() {
    return {
      latticeType: latticeType.value,
      showMusicalScore: showMusicalScore.value
    }
  }

  /**
   * Apply revived state to current state.
   * @param data JSON data as an Object instance.
   */
  function fromJSON(data: any) {
    latticeType.value = data.latticeType
  }

  // Local storage watchers
  syncValues({
    newline,
    showVirtualQwerty,
    showMosTab,
    showKeyboardLabel,
    showKeyboardCents,
    showKeyboardRatio,
    showKeyboardFrequency,
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
    degreeDownCode,
    shareStatistics,
    showSafariWarning,
    debug
  })
  watch(
    colorScheme,
    (newValue) => {
      storage.setItem('colorScheme', newValue)
      document.documentElement.setAttribute('data-theme', newValue)
    },
    { immediate: true }
  )

  watch(showMusicalScore, (newValue) =>
    window.localStorage.setItem('showMusicalScore', newValue.toString())
  )

  return {
    // Live state
    heldNotes,
    typingActive,
    latticeType,
    scoreChord,
    // Persistent state
    newline,
    colorScheme,
    showVirtualQwerty,
    showMusicalScore,
    showMosTab,
    showKeyboardLabel,
    showKeyboardCents,
    showKeyboardRatio,
    showKeyboardFrequency,
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
    degreeDownCode,
    shareStatistics,
    showSafariWarning,
    debug,
    // Methods
    toJSON,
    fromJSON
  }
})
