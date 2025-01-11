import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Input, Output } from 'webmidi'

export const useMidiStore = defineStore('midi', () => {
  const input = ref<Input | null>(null)
  const output = ref<Output | null>(null)
  // Channel 10 is reserved for percussion
  const outputChannels = ref(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16]))
  const outputChannel = ref(1) // For 'linear' output
  const velocityOn = ref(true)
  // Lumatone multichannel-to-equave mode
  const multichannelToEquave = ref(false)
  const multichannelCenter = ref(3)
  const multichannelNumEquaves = ref(8)
  const multichannelEquavesDown = ref(4)

  const whiteMode = ref<'off' | 'simple' | 'blackAverage' | 'keyColors'>('off')
  const outputMode = ref<'pitchBend' | 'linear'>('pitchBend')

  return {
    // State
    input,
    output,
    outputChannels,
    outputChannel,
    multichannelToEquave,
    multichannelCenter,
    multichannelNumEquaves,
    multichannelEquavesDown,
    velocityOn,
    whiteMode,
    outputMode
  }
})
