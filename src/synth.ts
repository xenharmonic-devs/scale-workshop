// Exponential approach conversion, smaller value results in more eager envelopes
const TIME_CONSTANT = 0.5;

// Large but finite number to signify voices that are off
const EXPIRED = 10000;

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
  // Name     | Factors
  // rich     | 2,3,5
  // slender  | 2,3,7
  // didacus  | 2,5,7
  // bohlen   | 3,5,7
  // glass    | 2,7,11
  // boethius | 2,3,19

  const zeros = new Float32Array(101);
  const rich = new Float32Array(101);
  const slender = new Float32Array(101);
  const didacus = new Float32Array(101);
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
    const m = 1 / n;
    if (n % 11 && n % 19) {
      if (n % 7) {
        rich[n] = m;
      }
      if (n % 5) {
        slender[n] = m;
      }
      if (n % 3) {
        didacus[n] = m;
      }
      if (n % 2) {
        bohlen[n] = m;
      }
    }
    if (n % 3 && n % 5 && n % 19) {
      if (n % 7 && n % 11) {
        glass[n] = m;
      } else {
        glass[n] = 2 * m;
      }
    }
    if (n % 5 && n % 7 && n % 11) {
      if (n % 19) {
        boethius[n] = m;
      } else {
        boethius[n] = 2 * m;
      }
    }
  });

  CUSTOM_WAVEFORMS.rich = audioContext.createPeriodicWave(zeros, rich);
  CUSTOM_WAVEFORMS.slender = audioContext.createPeriodicWave(zeros, slender);
  CUSTOM_WAVEFORMS.didacus = audioContext.createPeriodicWave(zeros, didacus);
  CUSTOM_WAVEFORMS.bohlen = audioContext.createPeriodicWave(zeros, bohlen);
  CUSTOM_WAVEFORMS.glass = audioContext.createPeriodicWave(zeros, glass);
  CUSTOM_WAVEFORMS.boethius = audioContext.createPeriodicWave(zeros, boethius);
}

// Tracking numbers for voice stealing
// Technically we could run out of note identifiers,
// but who is going to play 9007199254740991 notes in one session?
let NOTE_ID = 1;

// Simple combination of envelope and oscillator
class Voice {
  age: number;
  audioContext: AudioContext;
  oscillator: OscillatorNode;
  envelope: GainNode;
  noteId: number;

  constructor(audioContext: AudioContext, destination: AudioNode) {
    this.age = EXPIRED;
    this.audioContext = audioContext;

    this.oscillator = this.audioContext.createOscillator();
    this.envelope = this.audioContext.createGain();
    this.oscillator.connect(this.envelope).connect(destination);
    const now = this.audioContext.currentTime;
    this.envelope.gain.setValueAtTime(0, now);
    this.oscillator.start(now);
    this.oscillator.addEventListener("ended", () => {
      this.envelope.disconnect();
      this.oscillator.disconnect();
    });

    this.noteId = 0;
  }

  noteOn(
    frequency: number,
    velocity: number,
    waveform: string,
    attackTime: number,
    decayTime: number,
    sustainLevel: number,
    releaseTime: number,
    noteId: number
  ) {
    this.age = 0;
    this.noteId = noteId;

    if (BASIC_WAVEFORMS.includes(waveform)) {
      this.oscillator.type = waveform as OscillatorType;
    } else {
      this.oscillator.setPeriodicWave(CUSTOM_WAVEFORMS[waveform]);
    }

    const now = this.audioContext.currentTime;
    this.oscillator.frequency.setValueAtTime(frequency, now);
    this.envelope.gain.setValueAtTime(0, now);
    this.envelope.gain.setTargetAtTime(
      velocity,
      now,
      attackTime * TIME_CONSTANT
    );
    this.envelope.gain.setTargetAtTime(
      velocity * sustainLevel,
      now + attackTime,
      decayTime * TIME_CONSTANT
    );

    const noteOff = () => {
      // Do nothing if the voice has been stolen.
      if (this.noteId !== noteId) {
        return;
      }
      this.age = EXPIRED;
      const then = this.audioContext.currentTime;
      this.envelope.gain.cancelScheduledValues(then);
      this.envelope.gain.setTargetAtTime(0, then, releaseTime * TIME_CONSTANT);
    };

    return noteOff;
  }

  dispose() {
    this.oscillator.stop();
  }
}

// Simple web audio synth of finite polyphony.
export class Synth {
  audioContext: AudioContext;
  destination: AudioNode;
  waveform: string;
  attackTime: number;
  decayTime: number;
  sustainLevel: number;
  releaseTime: number;
  voices: Voice[];

  constructor(
    audioContext: AudioContext,
    destination: AudioNode,
    waveform = "semisine",
    attackTime = 0.01,
    decayTime = 0.3,
    sustainLevel = 0.8,
    releaseTime = 0.01,
    maxPolyphony = 6
  ) {
    this.audioContext = audioContext;
    this.destination = destination;
    this.waveform = waveform;
    this.attackTime = attackTime;
    this.decayTime = decayTime;
    this.sustainLevel = sustainLevel;
    this.releaseTime = releaseTime;

    this.voices = [];
    this.setPolyphony(maxPolyphony);
  }

  setPolyphony(maxPolyphony: number) {
    while (this.voices.length > maxPolyphony) {
      this.voices.pop()?.dispose();
    }
    while (this.voices.length < maxPolyphony) {
      this.voices.push(new Voice(this.audioContext, this.destination));
    }
  }

  get maxPolyphony() {
    return this.voices.length;
  }
  set maxPolyphony(value: number) {
    this.setPolyphony(value);
  }

  noteOn(frequency: number, velocity: number) {
    // Allocate voices based on age.
    // Boils down to:
    // a) Pick the oldest released voice.
    // b) If there are no released voices, replace the oldest currently playing voice.
    let oldestVoice: Voice | undefined;
    for (const voice of this.voices) {
      voice.age++;
      if (oldestVoice === undefined || voice.age > oldestVoice.age) {
        oldestVoice = voice;
      }
    }
    if (oldestVoice === undefined) {
      return () => {};
    }

    return oldestVoice.noteOn(
      frequency,
      velocity,
      this.waveform,
      this.attackTime,
      this.decayTime,
      this.sustainLevel,
      this.releaseTime,
      NOTE_ID++
    );
  }
}
