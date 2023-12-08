import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { Synth, initializeCustomWaveforms, PingPongDelay } from '../synth'
import { VirtualSynth } from '../virtual-synth'

export const useAudioStore = defineStore('audio', () => {
  const context = ref<AudioContext | null>(null)
  // Chromium has some issues with audio nodes as props
  // so we need this extra ref and the associated watcher.
  const mainVolume = ref(0.175)
  // Protect the user's audio system by limiting
  // the gain and frequency response.
  const mainGain = ref<GainNode | null>(null)
  const mainLowpass = ref<BiquadFilterNode | null>(null)
  const mainHighpass = ref<BiquadFilterNode | null>(null)
  const synth = ref<Synth | null>(null)

  // Synth params
  const waveform = ref('semisine')
  const attackTime = ref(0.01)
  const decayTime = ref(0.3)
  const sustainLevel = ref(0.8)
  const releaseTime = ref(0.01)
  // Fix Firefox issues with audioContext.currentTime being in the past using a delay.
  // This is a locally stored user preference, but shown on the Synth tab.
  const audioDelay = ref(0.001)

  // A virtual synth is used to "play" the chord wheels in the Analysis tab.
  const virtualSynth = ref<VirtualSynth | null>(null)

  // Stereo ping pong delay and associated params
  const pingPongDelay = ref<PingPongDelay | null>(null)
  const pingPongGainNode = ref<GainNode | null>(null)
  const pingPongDelayTime = ref(0.3)
  const pingPongFeedback = ref(0.8)
  const pingPongSeparation = ref(1)
  const pingPongGain = ref(0)

  // Fetch user-specific state
  if ('audioDelay' in window.localStorage) {
    const value = window.localStorage.getItem('audioDelay')
    if (value !== null) {
      audioDelay.value = parseFloat(value)
      if (isNaN(audioDelay.value)) {
        audioDelay.value = 0.001
      }
    }
  }

  const maxPolyphony = computed({
    get() {
      if (synth.value === null) {
        if ('maxPolyphony' in window.localStorage) {
          return parseInt(window.localStorage.getItem('maxPolyphony')!)
        }
        return 6
      }
      return synth.value.maxPolyphony
    },
    set(newValue) {
      if (newValue < 1) {
        newValue = 1
      }
      if (newValue > 128) {
        newValue = 128
      }
      if (!isNaN(newValue)) {
        newValue = Math.round(newValue)
        window.localStorage.setItem('maxPolyphony', newValue.toString())
        if (synth.value !== null) {
          synth.value.setPolyphony(newValue)
        }
      }
    }
  })

  function initialize() {
    if (context.value) {
      context.value.resume()
      return
    }
    context.value = new AudioContext({ latencyHint: 'interactive' })

    pingPongDelay.value = new PingPongDelay(context.value)
    pingPongGainNode.value = context.value.createGain()
    pingPongDelay.value.delayTime = pingPongDelayTime.value
    pingPongDelay.value.feedback = pingPongFeedback.value
    pingPongDelay.value.separation = pingPongFeedback.value
    pingPongGainNode.value.gain.setValueAtTime(pingPongGain.value, context.value.currentTime)

    const gain = context.value.createGain()
    gain.gain.setValueAtTime(mainVolume.value, context.value.currentTime)
    gain.connect(context.value.destination)
    gain.connect(pingPongDelay.value.destination)
    pingPongDelay.value.connect(pingPongGainNode.value).connect(context.value.destination)
    mainGain.value = gain

    const lowpass = context.value.createBiquadFilter()
    lowpass.frequency.setValueAtTime(5000, context.value.currentTime)
    lowpass.Q.setValueAtTime(Math.sqrt(0.5), context.value.currentTime)
    lowpass.type = 'lowpass'
    lowpass.connect(gain)
    mainLowpass.value = lowpass

    const highpass = context.value.createBiquadFilter()
    highpass.frequency.setValueAtTime(30, context.value.currentTime)
    highpass.Q.setValueAtTime(Math.sqrt(0.5), context.value.currentTime)
    highpass.type = 'highpass'
    highpass.connect(lowpass)
    mainHighpass.value = highpass

    // Intended point of audio connection
    const audioDestination = highpass

    initializeCustomWaveforms(context.value)

    synth.value = new Synth(
      context.value,
      audioDestination,
      audioDelay.value,
      waveform.value,
      attackTime.value,
      decayTime.value,
      sustainLevel.value,
      releaseTime.value,
      maxPolyphony.value
    )

    virtualSynth.value = new VirtualSynth(context.value)
  }

  async function unintialize() {
    if (!context.value) {
      return
    }
    if (mainGain.value) {
      mainGain.value.disconnect()
    }
    if (mainLowpass.value) {
      mainLowpass.value.disconnect()
    }
    if (mainHighpass.value) {
      mainHighpass.value.disconnect()
    }
    if (synth.value) {
      synth.value.setPolyphony(0)
    }
    await context.value.close()
    context.value = null
  }

  watch(mainVolume, (newValue) => {
    if (!context.value || !mainGain.value) {
      return
    }
    mainGain.value.gain.setValueAtTime(newValue, context.value.currentTime)
  })

  watch(audioDelay, (newValue) => {
    window.localStorage.setItem('audioDelay', newValue.toString())
    if (!synth.value) {
      return
    }
    synth.value.audioDelay = newValue
  })

  watch(waveform, (newValue) => {
    if (!synth.value) {
      return
    }
    synth.value.waveform = newValue
  })

  watch(attackTime, (newValue) => {
    if (!synth.value) {
      return
    }
    synth.value.attackTime = newValue
  })

  watch(decayTime, (newValue) => {
    if (!synth.value) {
      return
    }
    synth.value.decayTime = newValue
  })

  watch(sustainLevel, (newValue) => {
    if (!synth.value) {
      return
    }
    synth.value.sustainLevel = newValue
  })

  watch(releaseTime, (newValue) => {
    if (!synth.value) {
      return
    }
    synth.value.releaseTime = newValue
  })

  // Ping pong delay parameter watchers
  watch(pingPongDelayTime, (newValue) => {
    if (!pingPongDelay.value) {
      return
    }
    pingPongDelay.value.delayTime = newValue
  })
  watch(pingPongFeedback, (newValue) => {
    if (!pingPongDelay.value) {
      return
    }
    pingPongDelay.value.feedback = newValue
  })
  watch(pingPongSeparation, (newValue) => {
    if (!pingPongDelay.value) {
      return
    }
    pingPongDelay.value.separation = newValue
  })
  watch(pingPongGain, (newValue) => {
    if (!pingPongGainNode.value || !context.value) {
      return
    }
    pingPongGainNode.value.gain.setValueAtTime(newValue, context.value.currentTime)
  })

  return {
    // Methods
    initialize,
    unintialize,

    // Public state
    context,
    mainVolume,
    waveform,
    attackTime,
    decayTime,
    sustainLevel,
    releaseTime,
    audioDelay,
    maxPolyphony,
    synth,
    virtualSynth,
    pingPongDelay,
    pingPongDelayTime,
    pingPongFeedback,
    pingPongGain,
    pingPongSeparation,

    // "Private" state must be exposed for Pinia
    mainGain,
    mainLowpass,
    mainHighpass
  }
})
