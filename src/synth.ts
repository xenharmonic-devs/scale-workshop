// Classic variants are from Scale Workshop 2, they're softer on SW3.

import { AperiodicWave } from "sw-synth"
import { centsToValue, valueToCents } from "xen-dev-utils"
import { ceilPow2 } from "./utils"

export const BASIC_WAVEFORMS = ['sine', 'square', 'sawtooth', 'triangle']
export const CUSTOM_WAVEFORMS = [
  'warm1',
  'warm2',
  'warm3',
  'warm4',
  'octaver',
  'brightness',
  'harmonicbell',
  'semisine',
  'rich',
  'slender',
  'didacus',
  'bohlen',
  'glass',
  'boethius',
  'gold',
  'rich-classic',
  'slender-classic',
  'didacus-classic',
  'bohlen-classic',
  'glass-classic',
  'boethius-classic',
]
export const WAVEFORMS = BASIC_WAVEFORMS.concat(CUSTOM_WAVEFORMS)
export const PERIODIC_WAVES: Record<string, PeriodicWave> = {}

export const APERIODIC_WAVEFORMS = ['tin', 'bronze', 'steel', 'silver', 'platinum', 'pelog', 'slendro', '12-TET']
export const APERIODIC_WAVES: Record<string, AperiodicWave> = {}

export function initializePeriodic(audioContext: BaseAudioContext) {
  PERIODIC_WAVES.warm1 = audioContext.createPeriodicWave(
    new Float32Array([0, 10, 2, 2, 2, 1, 1, 0.5]),
    new Float32Array([0, 0, 0, 0, 0, 0, 0, 0])
  )

  PERIODIC_WAVES.warm2 = audioContext.createPeriodicWave(
    new Float32Array([0, 10, 5, 3.33, 2, 1]),
    new Float32Array([0, 0, 0, 0, 0, 0])
  )
  PERIODIC_WAVES.warm3 = audioContext.createPeriodicWave(
    new Float32Array([0, 10, 5, 5, 3]),
    new Float32Array([0, 0, 0, 0, 0])
  )
  PERIODIC_WAVES.warm4 = audioContext.createPeriodicWave(
    new Float32Array([0, 10, 2, 2, 1]),
    new Float32Array([0, 0, 0, 0, 0])
  )
  PERIODIC_WAVES.octaver = audioContext.createPeriodicWave(
    new Float32Array([0, 1000, 500, 0, 333, 0, 0, 0, 250, 0, 0, 0, 0, 0, 0, 0, 166]),
    new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  )
  PERIODIC_WAVES.brightness = audioContext.createPeriodicWave(
    new Float32Array([0, 10, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 0.75, 0.5, 0.2, 0.1]),
    new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  )
  PERIODIC_WAVES.harmonicbell = audioContext.createPeriodicWave(
    new Float32Array([0, 10, 2, 2, 2, 2, 0, 0, 0, 0, 0, 7]),
    new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  )

  // DC-blocked semisine
  const semisineSineComponents = new Float32Array(64)
  const semisineCosineComponents = new Float32Array(64)
  for (let n = 1; n < 64; ++n) {
    semisineCosineComponents[n] = 1 / (1 - 4 * n * n)
  }
  PERIODIC_WAVES.semisine = audioContext.createPeriodicWave(
    semisineCosineComponents,
    semisineSineComponents
  )

  const zeros = new Float32Array(101)

  // N squared and cubed waveforms (harmonic entries in the metallic series)
  const goldComponents = new Float32Array(101)
  for (let n = 1; n <= 10; ++n) {
    goldComponents[n*n] = n ** -0.75
  }
  PERIODIC_WAVES.gold = audioContext.createPeriodicWave(zeros, goldComponents)

  // Subgroup optimized waveforms
  // Name     | Factors
  // rich     | 2,3,5
  // slender  | 2,3,7
  // didacus  | 2,5,7
  // bohlen   | 3,5,7
  // glass    | 2,7,11
  // boethius | 2,3,19

  const rich = new Float32Array(101)
  const richClassic = new Float32Array(101)
  const slender = new Float32Array(101)
  const slenderClassic = new Float32Array(101)
  const didacus = new Float32Array(101)
  const didacusClassic = new Float32Array(101)
  const bohlen = new Float32Array(101)
  const bohlenClassic = new Float32Array(101)
  const glass = new Float32Array(101)
  const glassClassic = new Float32Array(101)
  const boethius = new Float32Array(101)
  const boethiusClassic = new Float32Array(101)

  // No multiples of 13, 17 or primes above 23
  const lowPrimeHarmonics = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 19, 20, 21, 22, 24, 25, 27, 28, 30, 32,
    33, 35, 36, 38, 40, 42, 44, 45, 48, 49, 50, 54, 55, 56, 57, 60, 63, 64, 66, 70, 72, 75, 76, 77,
    80, 81, 84, 88, 90, 95, 96, 98, 99, 100
  ]

  lowPrimeHarmonics.forEach((n) => {
    // Classics are saw-like
    const m = 1 / n
    // Modern is softer and "pink"
    const p = n ** -1.5
    if (n % 11 && n % 19) {
      if (n % 7) {
        richClassic[n] = m
        rich[n] = p
      }
      if (n % 5) {
        slenderClassic[n] = m
        slender[n] = p
      }
      if (n % 3) {
        didacusClassic[n] = m
        didacus[n] = p
      }
      if (n % 2) {
        bohlenClassic[n] = m
        bohlen[n] = p
      }
    }
    if (n % 3 && n % 5 && n % 19) {
      if (n % 7 && n % 11) {
        glassClassic[n] = m
        glass[n] = p
      } else {
        glassClassic[n] = 2 * m
        glass[n] = 2 * p
      }
    }
    if (n % 5 && n % 7 && n % 11) {
      if (n % 19) {
        boethiusClassic[n] = m
        boethius[n] = p
      } else {
        boethiusClassic[n] = 2 * m
        boethius[n] = 2 * p
      }
    }
  })

  PERIODIC_WAVES['rich-classic'] = audioContext.createPeriodicWave(zeros, richClassic)
  PERIODIC_WAVES.rich = audioContext.createPeriodicWave(zeros, rich)
  PERIODIC_WAVES['slender-classic'] = audioContext.createPeriodicWave(zeros, slenderClassic)
  PERIODIC_WAVES.slender = audioContext.createPeriodicWave(zeros, slender)
  PERIODIC_WAVES['didacus-classic'] = audioContext.createPeriodicWave(zeros, didacusClassic)
  PERIODIC_WAVES.didacus = audioContext.createPeriodicWave(zeros, didacus)
  PERIODIC_WAVES['bohlen-classic'] = audioContext.createPeriodicWave(zeros, bohlenClassic)
  PERIODIC_WAVES.bohlen = audioContext.createPeriodicWave(zeros, bohlen)
  PERIODIC_WAVES['glass-classic'] = audioContext.createPeriodicWave(zeros, glassClassic)
  PERIODIC_WAVES.glass = audioContext.createPeriodicWave(zeros, glass)
  PERIODIC_WAVES['boethius-classic'] = audioContext.createPeriodicWave(zeros, boethiusClassic)
  PERIODIC_WAVES.boethius = audioContext.createPeriodicWave(zeros, boethius)
}

function initializeAperiodic(audioContext: BaseAudioContext) {
  const ns = [...Array(129).keys()];
  ns.shift();
  const tinSpectrum = ns.map(n => n ** (7/8));
  const bronzeSpectrum = ns.map(n => n ** (4/3));
  const steelSpectrum = ns.map(n => n ** 1.5);
  const silverSpectrum = ns.map(n => n ** (5/3));
  const platinumSpectrum = ns.slice(0, 32).map(n => n ** 2.5);
  const amplitudes = ns.map(n => 0.3 * n ** -1.5);
  const maxNumberOfVoices = 7;
  const tolerance = 0.1; // In cents
  APERIODIC_WAVES['tin'] = new AperiodicWave(audioContext, tinSpectrum, amplitudes, maxNumberOfVoices, tolerance);
  APERIODIC_WAVES['steel'] = new AperiodicWave(audioContext, steelSpectrum, amplitudes, maxNumberOfVoices, tolerance);
  APERIODIC_WAVES['bronze'] = new AperiodicWave(audioContext, bronzeSpectrum, amplitudes, maxNumberOfVoices, tolerance);
  APERIODIC_WAVES['silver'] = new AperiodicWave(audioContext, silverSpectrum, amplitudes, maxNumberOfVoices, tolerance);
  APERIODIC_WAVES['platinum'] = new AperiodicWave(audioContext, platinumSpectrum, amplitudes.slice(0, 32), maxNumberOfVoices, tolerance);

  const pelog = [0, 120, 270, 540, 670, 785, 950, 1215];
  const peloctave = 1215
  const pelogSpectrumCents = [0, pelog[4], peloctave, pelog[4] + peloctave, 2 * peloctave, pelog[2] + 2 * peloctave]
  const pelogAmplitudes = [1, 0.3, 0.2, 0.5, 0.4, 0.25]
  for (let h = 7; h <= 128; ++h) {
    let cents = valueToCents(h);
    const octaves = Math.floor(cents / peloctave)
    cents -= octaves * peloctave
    let minDiff = Infinity;
    for (const pelogCents of pelog) {
      const diff = Math.abs(cents - pelogCents)
      minDiff = Math.min(minDiff, diff)
      if (diff < 25) {
        pelogSpectrumCents.push(pelogCents + octaves * peloctave)
        pelogAmplitudes.push(2 / h)
        break
      }
    }
    if (minDiff > 60) {
      pelogSpectrumCents.push(valueToCents(h))
      pelogAmplitudes.push(0.5 / h)
    }
  }
  APERIODIC_WAVES['pelog'] = new AperiodicWave(audioContext, pelogSpectrumCents.map(centsToValue), pelogAmplitudes.map(a => 0.25 * a), maxNumberOfVoices, tolerance)

  const slendro = [0, 231, 474, 717, 955, 1208]
  const slendroctave = 1208
  const slendroSpectrumCents = [0, slendro[3], slendroctave, slendro[2] + slendroctave, slendro[3] + slendroctave, 2 * slendroctave, 2 * slendroctave + slendro[1]]
  const slendroAmplitudes = [1, 0.2, 0.1, 0.05, 0.3, 0.5, 0.2]

  for (let h = 7; h <= 128; ++h) {
    let cents = valueToCents(h);
    const octaves = Math.floor(cents / slendroctave)
    cents -= octaves * slendroctave
    let minDiff = Infinity;
    for (const slendroCents of slendro) {
      const diff = Math.abs(cents - slendroCents)
      minDiff = Math.min(minDiff, diff)
      if (diff < 35) {
        slendroSpectrumCents.push(slendroCents + octaves * slendroctave)
        slendroAmplitudes.push(2 / h)
        break
      }
    }
    if (minDiff > 100) {
      slendroSpectrumCents.push(valueToCents(h))
      slendroAmplitudes.push(0.2 / h)
    }
  }
  APERIODIC_WAVES['slendro'] = new AperiodicWave(audioContext, slendroSpectrumCents.map(centsToValue), slendroAmplitudes.map(a => 0.25 * a), maxNumberOfVoices, tolerance)

  const twelveSpectrumCents = []
  const twelveAmplitudes = []
  for (let h = 1; h <= 128; ++h) {
    const cents = valueToCents(h);
    const closest = Math.round(cents / 100) * 100
    if (Math.abs(cents - closest) < 15) {
      twelveSpectrumCents.push((3 * closest + cents) / 4)
      if (h === ceilPow2(h)) {
        twelveAmplitudes.push(0.4 * h ** -2)
      } else {
        twelveAmplitudes.push(0.6 * h ** -1.5)
      }
    }
  }
  APERIODIC_WAVES['12-TET'] = new AperiodicWave(audioContext, twelveSpectrumCents.map(centsToValue), twelveAmplitudes, maxNumberOfVoices, tolerance);
}

export function initializeCustomWaves(audioContext: BaseAudioContext) {
  initializePeriodic(audioContext);
  initializeAperiodic(audioContext);
}

// Simple feedback loop bouncing sound between left and right channels.
export class PingPongDelay {
  audioContext: AudioContext
  delayL: DelayNode
  delayR: DelayNode
  gainL: GainNode
  gainR: GainNode
  panL: StereoPannerNode
  panR: StereoPannerNode
  destination: AudioNode

  constructor(audioContext: AudioContext, maxDelayTime = 5) {
    this.audioContext = audioContext
    this.delayL = audioContext.createDelay(maxDelayTime)
    this.delayR = audioContext.createDelay(maxDelayTime)
    this.gainL = audioContext.createGain()
    this.gainR = audioContext.createGain()
    this.panL = audioContext.createStereoPanner()
    this.panR = audioContext.createStereoPanner()

    // Create a feedback loop with a gain stage.
    this.delayL.connect(this.gainL).connect(this.delayR).connect(this.gainR).connect(this.delayL)
    // Tap outputs.
    this.gainL.connect(this.panL)
    this.gainR.connect(this.panR)

    // Tag input.
    this.destination = this.delayL
  }

  set delayTime(value: number) {
    const now = this.audioContext.currentTime
    this.delayL.delayTime.setValueAtTime(value, now)
    this.delayR.delayTime.setValueAtTime(value, now)
  }

  set feedback(value: number) {
    const now = this.audioContext.currentTime
    this.gainL.gain.setValueAtTime(value, now)
    this.gainR.gain.setValueAtTime(value, now)
  }

  set separation(value: number) {
    const now = this.audioContext.currentTime
    this.panL.pan.setValueAtTime(-value, now)
    this.panR.pan.setValueAtTime(value, now)
  }

  connect(destination: AudioNode) {
    this.panL.connect(destination)
    this.panR.connect(destination)
    return destination
  }

  disconnect(destination: AudioNode) {
    this.panL.disconnect(destination)
    this.panR.disconnect(destination)
    return destination
  }
}
