import { reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useSessionIdStore } from './session-id'
import { UNIX_NEWLINE, OCTAVE } from '@/constants'
import { syncValues } from '@/utils'

/**
 * Global UI/application preference store and lightweight shared runtime state.
 */
export const useStateStore = defineStore('state', () => {
  const { invalidateUploadedId } = useSessionIdStore()

  // Mapping from MIDI index to number of interfaces currently pressing the key down
  const heldNotes = reactive(new Map<number, number>())
  const typingActive = ref(true)

  const latticeType = ref<'ji' | 'et' | 'cycles' | '3d' | 'auto'>('auto')
  const trailLongevity = ref(70)
  const maxOtonalRoot = ref(16)
  const maxUtonalRoot = ref(23)
  const maxDivisions = ref(31)
  const nedjiEquave = ref(OCTAVE)
  const nedjiEquaveString = ref('2/1')
  const intervalMatrixArrangement = ref<'modes' | 'symmetric'>('modes')

  // These user preferences are fetched from local storage.
  const storage = window.localStorage
  const newline = ref(storage.getItem('newline') ?? UNIX_NEWLINE)

  const storedScheme = storage.getItem('colorScheme')
  const mediaScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const colorScheme = ref<'light' | 'dark'>(
    (storedScheme ?? mediaScheme) === 'dark' ? 'dark' : 'light'
  )
  const showVirtualQwerty = ref(storage.getItem('showVirtualQwerty') === 'true')
  const showMosTab = ref(storage.getItem('showMosTab') === 'true')
  const releaseOnBlur = ref(storage.getItem('releaseOnBlur') === 'true')
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
  const showModesUnityColumn = ref(storage.getItem('showModesUnityColumn') !== 'false')
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

  // Debugging features.
  const debug = ref(storage.getItem('debug') === 'true')

  /**
   * Convert live state to a format suitable for storing on the server.
   */
  function toJSON() {
    return { latticeType: latticeType.value }
  }

  watch(latticeType, () => {
    invalidateUploadedId()
  })

  /**
   * Apply revived state to current state.
   * @param data JSON data as an Object instance.
   */
  function fromJSON(data: { latticeType?: 'ji' | 'et' | 'cycles' | '3d' | 'auto' }) {
    if (data.latticeType) {
      latticeType.value = data.latticeType
    }
  }

  // Local storage watchers
  syncValues({
    newline,
    showVirtualQwerty,
    showMosTab,
    releaseOnBlur,
    showKeyboardLabel,
    showKeyboardCents,
    showKeyboardRatio,
    showKeyboardFrequency,
    intervalMatrixIndexing,
    maxMatrixWidth,
    calculateConstantStructureViolations,
    showModesUnityColumn,
    calculateVariety,
    calculateBrightness,
    constantStructureMargin,
    deactivationCode,
    equaveUpCode,
    equaveDownCode,
    degreeUpCode,
    degreeDownCode,
    shareStatistics,
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

  return {
    // Live state
    heldNotes,
    typingActive,
    latticeType,
    trailLongevity,
    maxOtonalRoot,
    maxUtonalRoot,
    maxDivisions,
    nedjiEquave,
    nedjiEquaveString,
    intervalMatrixArrangement,
    // Persistent state
    newline,
    colorScheme,
    showVirtualQwerty,
    showMosTab,
    releaseOnBlur,
    showKeyboardLabel,
    showKeyboardCents,
    showKeyboardRatio,
    showKeyboardFrequency,
    intervalMatrixIndexing,
    maxMatrixWidth,
    calculateConstantStructureViolations,
    showModesUnityColumn,
    calculateVariety,
    calculateBrightness,
    constantStructureMargin,
    deactivationCode,
    equaveUpCode,
    equaveDownCode,
    degreeUpCode,
    degreeDownCode,
    shareStatistics,
    debug,
    // Methods
    toJSON,
    fromJSON
  }
})
