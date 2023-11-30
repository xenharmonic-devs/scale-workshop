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

  /**
   * Create a new virtual synthesizer.
   * @param audioContext Global audio context for timekeeping.
   */
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
    this.voices = []
    this.numPlayed = 0
  }

  /**
   * Track a real note with a virtual counterpart.
   * @param frequency Frequency of the note to track.
   * @param waveform Waveform of the note. Defaults to sin³.
   * @returns Callback for turning the voice off.
   */
  voiceOn(frequency: number, waveform = sin3) {
    const start = this.audioContext.currentTime
    const id = this.numPlayed++
    this.voices.push({
      id,
      start,
      frequency,
      waveform
    })
    this.voices.sort((a, b) => a.frequency - b.frequency)

    const voiceOff = () => {
      for (let i = 0; i < this.voices.length; ++i) {
        if (this.voices[i].id === id) {
          this.voices.splice(i, 1)
        }
      }
    }

    return voiceOff
  }

  /**
   * Get time domain data for each active voice.
   * Voices that went off during the data window are not included.
   * @param start Start time.
   * @param end End time.
   * @param buffers Floating point arrays to hold data.
   */
  getTimeDomainData(start: number, end: number, buffers: Float32Array[]) {
    if (!buffers.length) {
      return
    }
    const dt = (end - start) / buffers[0].length
    for (let i = 0; i < buffers[0].length; ++i) {
      const t = start + dt * i
      this.voices.forEach((voice, j) => {
        if (j >= buffers.length) {
          return
        }
        const phase = (t - voice.start) * voice.frequency
        if (phase >= 0) {
          buffers[j][i] = voice.waveform(phase)
        } else {
          buffers[j][i] = 0
        }
      })
    }
    // Signal unused buffers.
    for (let i = this.voices.length; i < buffers.length; ++i) {
      buffers[i][0] = NaN
    }
  }
}
