import { centsToValue } from 'xen-dev-utils/conversion'
import type { PitchBendRange } from 'sw-synth'

function sin3(phase: number) {
  const s = Math.sin(2 * Math.PI * phase)
  return s * s * s
}

/**
 * Virtual voice for tracking real notes.
 */
export type Voice = {
  /** Unique identifier. */
  id: number
  /** Start time of the note. */
  start: number
  /** Frequency of the note. */
  frequency: number
  /** Current phase of the waveform. */
  phase: number
  /** Pitch bend range. */
  pitchBendRange: PitchBendRange
  /** Waveform of the note. */
  waveform: (phase: number) => number
}

/**
 * Virtual synthesizer that doesn't make sound but keeps time.
 * Intended for per-voice visualization.
 */
export class VirtualSynth {
  /** Global audio context for timekeeping. */
  audioContext: AudioContext
  /** Currently active voices sorted from lowest frequency to highest. */
  voices: Voice[]
  /** Number of voices played during the lifetime of the synth. */
  numPlayed: number
  /** Pitch bend wheel position. */
  pitchBend: number
  /** Current time. */
  time: number

  /**
   * Create a new virtual synthesizer.
   * @param audioContext Global audio context for timekeeping.
   */
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
    this.voices = []
    this.numPlayed = 0
    this.pitchBend = 0
    this.time = 0
  }

  /**
   * Track a real note with a virtual counterpart.
   * @param frequency Frequency of the note to track.
   * @param waveform Waveform of the note. Defaults to sin³.
   * @returns Callback for turning the voice off.
   */
  voiceOn(frequency: number, pitchBendRange: PitchBendRange, waveform = sin3) {
    const start = this.audioContext.currentTime
    const id = this.numPlayed++
    const phase = 0
    this.voices.push({
      id,
      start,
      frequency,
      phase,
      pitchBendRange,
      waveform
    })
    this.voices.sort((a, b) => Math.abs(a.frequency) - Math.abs(b.frequency))

    const voiceOff = () => {
      for (let i = 0; i < this.voices.length; ++i) {
        if (this.voices[i].id === id) {
          this.voices.splice(i, 1)
        }
      }
    }

    return voiceOff
  }

  getVoiceFrequencies() {
    return this.voices.map((voice) => {
      const detune =
        (this.pitchBend >= 0 ? voice.pitchBendRange.up : voice.pitchBendRange.down) * this.pitchBend
      return voice.frequency * centsToValue(detune)
    })
  }

  /**
   * Get time domain data for each active voice.
   * Voices that went off during the data window are not included.
   * @param start Start time.
   * @param end End time.
   * @param buffers Floating point arrays to hold data.
   */
  getTimeDomainData(start: number, end: number, buffers: Float32Array[]) {
    const delta = start - this.time
    if (!buffers.length) {
      return
    }
    const dt = (end - start) / buffers[0].length
    this.voices.forEach((voice, j) => {
      if (j >= buffers.length) {
        return
      }
      const detune =
        (this.pitchBend >= 0 ? voice.pitchBendRange.up : voice.pitchBendRange.down) * this.pitchBend
      const frequency = voice.frequency * centsToValue(detune)

      // Correct for time travel
      voice.phase += delta * frequency

      // Wrap phase
      voice.phase -= Math.floor(voice.phase)

      // Travel forwards
      for (let i = 0; i < buffers[0].length; ++i) {
        voice.phase += dt * frequency
        buffers[j][i] = voice.waveform(voice.phase)
      }
    })
    // Signal unused buffers.
    for (let i = this.voices.length; i < buffers.length; ++i) {
      buffers[i][0] = NaN
    }

    this.time = end
  }
}
