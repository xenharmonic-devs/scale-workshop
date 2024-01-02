import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Input, Output } from 'webmidi'

export const useMidiStore = defineStore('midi', () => {
  const input = ref<Input | null>(null)
  const output = ref<Output | null>(null)
  // Channel 10 is reserved for percussion
  const outputChannels = ref(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16]))
  const velocityOn = ref(true)

  const whiteMode = ref<'off' | 'simple' | 'blackAverage' | 'keyColors'>('off')

  return {
    // State
    input,
    output,
    outputChannels,
    velocityOn,
    whiteMode
  }
})
