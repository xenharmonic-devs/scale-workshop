import { computed, ref, watch, type Ref } from 'vue'
import { defineStore } from 'pinia'
import {
  APERIODIC_WAVEFORMS,
  APERIODIC_WAVES,
  BASIC_WAVEFORMS,
  CUSTOM_WAVEFORMS,
  initializeCustomWaves,
  PERIODIC_WAVES,
  PingPongDelay
} from '../synth'
import { VirtualSynth } from '../virtual-synth'
import {
  AperiodicSynth,
  Synth,
  UnisonSynth,
  type OscillatorVoiceParams,
  type UnisonVoiceParams,
  type VoiceBaseParams,
  type AperiodicVoiceParams,
  AperiodicWave
} from 'sw-synth'

// The compiler chokes on this store so we need an explicit type annotation
type AudioStore = {
  initialize: () => void
  unintialize: () => Promise<void>
  context: Ref<AudioContext>
  mainVolume: Ref<number>
  waveform: Ref<string>
  attackTime: Ref<number>
  decayTime: Ref<number>
  sustainLevel: Ref<number>
  releaseTime: Ref<number>
  stackSize: Ref<number>
  spread: Ref<number>
  aperiodicWaveform: Ref<string>
  audioDelay: Ref<number>
  maxPolyphony: Ref<number>
  synth: Ref<Synth | UnisonSynth | AperiodicSynth | null>
  synthType: Ref<'none' | 'oscillator' | 'unison' | 'aperiodic'>
  virtualSynth: Ref<VirtualSynth>
  pingPongDelay: Ref<PingPongDelay>
  pingPongDelayTime: Ref<number>
  pingPongFeedback: Ref<number>
  pingPongGain: Ref<number>
  pingPongSeparation: Ref<number>
  mainGain: Ref<GainNode>
  mainLowpass: Ref<BiquadFilterNode>
  mainHighpass: Ref<BiquadFilterNode>
}

export const useAudioStore = defineStore<'audio', AudioStore>('audio', () => {
  const context = ref<AudioContext | null>(null)
  // Chromium has some issues with audio nodes as props
  // so we need this extra ref and the associated watcher.
  const mainVolume = ref(0.18)
  // Protect the user's audio system by limiting
  // the gain and frequency response.
  const mainGain = ref<GainNode | null>(null)
  const mainLowpass = ref<BiquadFilterNode | null>(null)
  const mainHighpass = ref<BiquadFilterNode | null>(null)
  const synth = ref<Synth | UnisonSynth | AperiodicSynth | null>(null)
  const synthType = ref<'none' | 'oscillator' | 'unison' | 'aperiodic'>('none')

  // One of these gets swapped in the ref.
  let oscillatorSynth: Synth
  let unisonSynth: UnisonSynth
  let aperiodicSynth: AperiodicSynth

  // Synth params
  const waveform = ref('semisine')
  const attackTime = ref(0.01)
  const decayTime = ref(0.3)
  const sustainLevel = ref(0.8)
  const releaseTime = ref(0.01)
  const stackSize = ref(3)
  const spread = ref(2.5)
  const aperiodicWaveform = ref('steel')
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

  const _voiceBase: VoiceBaseParams = {
    audioDelay: audioDelay.value,
    attackTime: attackTime.value,
    decayTime: decayTime.value,
    sustainLevel: sustainLevel.value,
    releaseTime: releaseTime.value
  }

  const oscillatorVoiceParams: OscillatorVoiceParams = {
    ..._voiceBase,
    type: 'triangle',
    periodicWave: undefined
  }

  const unisonVoiceParams: UnisonVoiceParams = {
    ...oscillatorVoiceParams,
    spread: spread.value,
    stackSize: stackSize.value
  }

  const aperiodicVoiceParams: AperiodicVoiceParams = {
    ..._voiceBase,
    aperiodicWave: null as unknown as AperiodicWave // Pacifies the type checker. Set properly during init.
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

    initializeCustomWaves(context.value)

    oscillatorVoiceParams.type = 'custom'
    oscillatorVoiceParams.periodicWave = PERIODIC_WAVES['semisine'].value
    unisonVoiceParams.type = 'custom'
    unisonVoiceParams.periodicWave = PERIODIC_WAVES['semisine'].value
    aperiodicVoiceParams.aperiodicWave = APERIODIC_WAVES['steel'].value

    // These all should start with polyphony 0 to save resources
    oscillatorSynth = new Synth(context.value, audioDestination)
    unisonSynth = new UnisonSynth(context.value, audioDestination)
    aperiodicSynth = new AperiodicSynth(context.value, audioDestination)

    // The content of these references will be manipulated in-place
    oscillatorSynth.voiceParams = oscillatorVoiceParams
    unisonSynth.voiceParams = unisonVoiceParams
    aperiodicSynth.voiceParams = aperiodicVoiceParams

    const storedMaxPolyphony = maxPolyphony.value

    synthType.value = 'oscillator'
    synth.value = oscillatorSynth
    synth.value.maxPolyphony = storedMaxPolyphony

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
    oscillatorVoiceParams.audioDelay = newValue
    unisonVoiceParams.audioDelay = newValue
    aperiodicVoiceParams.audioDelay = newValue
  })

  watch(synthType, (newValue) => {
    const storedMaxPolyphony = maxPolyphony.value
    switch (newValue) {
      case 'none':
        synth.value = null
        oscillatorSynth.maxPolyphony = 0
        unisonSynth.maxPolyphony = 0
        aperiodicSynth.maxPolyphony = 0
        break
      case 'oscillator':
        synth.value = oscillatorSynth
        oscillatorSynth.maxPolyphony = storedMaxPolyphony
        unisonSynth.maxPolyphony = 0
        aperiodicSynth.maxPolyphony = 0
        break
      case 'unison':
        synth.value = unisonSynth
        oscillatorSynth.maxPolyphony = 0
        unisonSynth.maxPolyphony = storedMaxPolyphony
        aperiodicSynth.maxPolyphony = 0
        break
      case 'aperiodic':
        synth.value = aperiodicSynth
        oscillatorSynth.maxPolyphony = 0
        unisonSynth.maxPolyphony = 0
        aperiodicSynth.maxPolyphony = storedMaxPolyphony
        break
    }
  })

  watch(waveform, (newValue) => {
    if (BASIC_WAVEFORMS.includes(newValue)) {
      oscillatorVoiceParams.type = unisonVoiceParams.type = newValue as any
      oscillatorVoiceParams.periodicWave = unisonVoiceParams.periodicWave = undefined
    } else if (CUSTOM_WAVEFORMS.includes(newValue)) {
      oscillatorVoiceParams.type = unisonVoiceParams.type = 'custom'
      oscillatorVoiceParams.periodicWave = unisonVoiceParams.periodicWave =
        PERIODIC_WAVES[newValue].value
    }
  })

  watch(aperiodicWaveform, (newValue) => {
    if (APERIODIC_WAVEFORMS.includes(newValue)) {
      aperiodicVoiceParams.aperiodicWave = APERIODIC_WAVES[newValue].value
    }
  })

  watch(attackTime, (newValue) => {
    oscillatorVoiceParams.attackTime =
      unisonVoiceParams.attackTime =
      aperiodicVoiceParams.attackTime =
        newValue
  })

  watch(decayTime, (newValue) => {
    oscillatorVoiceParams.decayTime =
      unisonVoiceParams.decayTime =
      aperiodicVoiceParams.decayTime =
        newValue
  })

  watch(sustainLevel, (newValue) => {
    oscillatorVoiceParams.sustainLevel =
      unisonVoiceParams.sustainLevel =
      aperiodicVoiceParams.sustainLevel =
        newValue
  })

  watch(releaseTime, (newValue) => {
    oscillatorVoiceParams.releaseTime =
      unisonVoiceParams.releaseTime =
      aperiodicVoiceParams.releaseTime =
        newValue
  })

  watch(stackSize, (newValue) => {
    unisonVoiceParams.stackSize = newValue
  })

  watch(spread, (newValue) => {
    unisonVoiceParams.spread = newValue
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
    stackSize,
    spread,
    aperiodicWaveform,
    audioDelay,
    maxPolyphony,
    synth,
    synthType,
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
  } as AudioStore
})
