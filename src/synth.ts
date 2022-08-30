// Exponential approach conversion, smaller value results in more eager envelopes
const TIME_CONSTANT = 0.5;

export const BASIC_WAVEFORMS = ["sine", "square", "sawtooth", "triangle"];
export const CUSTOM_WAVEFORMS: { [key: string]: PeriodicWave } = {};

export function initializeCustomWaveforms(audioContext: AudioContext) {
  CUSTOM_WAVEFORMS.warm1 = audioContext.createPeriodicWave(
    new Float32Array([0, 10, 2, 2, 2, 1, 1, 0.5]),
    new Float32Array([0, 0, 0, 0, 0, 0, 0, 0])
  );

  CUSTOM_WAVEFORMS.warm2 = audioContext.createPeriodicWave(
    new Float32Array([0, 10, 5, 3.33, 2, 1]),
    new Float32Array([0, 0, 0, 0, 0, 0])
  );
  CUSTOM_WAVEFORMS.warm3 = audioContext.createPeriodicWave(
    new Float32Array([0, 10, 5, 5, 3]),
    new Float32Array([0, 0, 0, 0, 0])
  );
  CUSTOM_WAVEFORMS.warm4 = audioContext.createPeriodicWave(
    new Float32Array([0, 10, 2, 2, 1]),
    new Float32Array([0, 0, 0, 0, 0])
  );
  CUSTOM_WAVEFORMS.octaver = audioContext.createPeriodicWave(
    new Float32Array([
      0, 1000, 500, 0, 333, 0, 0, 0, 250, 0, 0, 0, 0, 0, 0, 0, 166,
    ]),
    new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  );
  CUSTOM_WAVEFORMS.brightness = audioContext.createPeriodicWave(
    new Float32Array([
      0, 10, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 0.75, 0.5, 0.2,
      0.1,
    ]),
    new Float32Array([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ])
  );
  CUSTOM_WAVEFORMS.harmonicbell = audioContext.createPeriodicWave(
    new Float32Array([0, 10, 2, 2, 2, 2, 0, 0, 0, 0, 0, 7]),
    new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  );

  // DC-blocked semisine
  const semisineSineComponents = new Float32Array(64);
  const semisineCosineComponents = new Float32Array(64);
  for (let n = 1; n < 64; ++n) {
    semisineCosineComponents[n] = 1 / (1 - 4 * n * n);
  }
  CUSTOM_WAVEFORMS.semisine = audioContext.createPeriodicWave(
    semisineCosineComponents,
    semisineSineComponents
  );

  // Subgroup optimized waveforms

  const zeros = new Float32Array(101);
  const rich = new Float32Array(101);
  const bohlen = new Float32Array(101);
  const glass = new Float32Array(101);
  const boethius = new Float32Array(101);

  // No multiples of 13, 17 or primes above 23
  const lowPrimeHarmonics = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 19, 20, 21, 22, 24,
    25, 27, 28, 30, 32, 33, 35, 36, 38, 40, 42, 44, 45, 48, 49, 50, 54, 55, 56,
    57, 60, 63, 64, 66, 70, 72, 75, 76, 77, 80, 81, 84, 88, 90, 95, 96, 98, 99,
    100,
  ];

  lowPrimeHarmonics.forEach((n) => {
    if (n % 7 && n % 11 && n % 19) {
      rich[n] = 1 / n;
    }
    if (n % 2 && n % 11 && n % 19) {
      bohlen[n] = 1 / n;
    }
    if (n % 3 && n % 5 && n % 19) {
      if (n % 7 && n % 11) {
        glass[n] = 1 / n;
      } else {
        glass[n] = 2 / n;
      }
    }
    if (n % 5 && n % 7 && n % 11) {
      if (n % 19) {
        boethius[n] = 1 / n;
      } else {
        boethius[n] = 2 / n;
      }
    }
  });

  CUSTOM_WAVEFORMS.rich = audioContext.createPeriodicWave(zeros, rich);
  CUSTOM_WAVEFORMS.bohlen = audioContext.createPeriodicWave(zeros, bohlen);
  CUSTOM_WAVEFORMS.glass = audioContext.createPeriodicWave(zeros, glass);
  CUSTOM_WAVEFORMS.boethius = audioContext.createPeriodicWave(zeros, boethius);
}

// Simple web audio synth of infinite polyphony.
export class Synth {
  audioContext: AudioContext;
  waveform: string;
  attackTime: number;
  decayTime: number;
  sustainLevel: number;
  releaseTime: number;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.waveform = "semisine";
    this.attackTime = 0.01;
    this.decayTime = 0.3;
    this.sustainLevel = 0.8;
    this.releaseTime = 0.01;
  }

  noteOn(frequency: number, velocity: number, destination: AudioNode) {
    const oscillator = this.audioContext.createOscillator();
    if (BASIC_WAVEFORMS.includes(this.waveform)) {
      oscillator.type = this.waveform as OscillatorType;
    } else {
      oscillator.setPeriodicWave(CUSTOM_WAVEFORMS[this.waveform]);
    }
    const envelope = this.audioContext.createGain();
    oscillator.connect(envelope).connect(destination);
    oscillator.addEventListener("ended", () => {
      envelope.disconnect();
      oscillator.disconnect();
    });

    const now = this.audioContext.currentTime;
    oscillator.frequency.setValueAtTime(frequency, now);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.setTargetAtTime(
      velocity,
      now,
      this.attackTime * TIME_CONSTANT
    );
    envelope.gain.setTargetAtTime(
      velocity * this.sustainLevel,
      now + this.attackTime,
      this.decayTime * TIME_CONSTANT
    );

    oscillator.start(now);

    const noteOff = () => {
      const then = this.audioContext.currentTime;
      envelope.gain.cancelScheduledValues(then);
      envelope.gain.setTargetAtTime(0, then, this.releaseTime * TIME_CONSTANT);
      // Extend time a bit to let exponential tail fall off.
      oscillator.stop(then + 1.5 * this.releaseTime);
    };

    return noteOff;
  }
}
