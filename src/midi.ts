import type { NoteMessageEvent, Output } from "webmidi";
import { ftom, mmod } from "xen-dev-utils";

export const bendRangeInSemitones = 2;

// Large but finite number to signify voices that are off
const EXPIRED = 10000;

// Abstraction for a pitch-bent midi channel. Polyphonic in pure octaves and 12edo in general.
type Voice = {
  age: number;
  channel: number;
  centsOffset: number;
};

const EPSILON = 1e-6;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function emptyNoteOff(rawRelease: number) {}

export type NoteOff = typeof emptyNoteOff;

export class MidiOut {
  output: Output | null;
  channels: Set<number>;
  log: (msg: string) => void;
  private voices: Voice[];

  constructor(
    output: Output | null,
    channels: Set<number>,
    log?: (msg: string) => void
  ) {
    this.output = output;
    this.channels = channels;
    if (log === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      this.log = (msg) => {};
    } else {
      this.log = log;
    }

    this.voices = [];
    this.channels.forEach((channel) => {
      this.voices.push({
        age: EXPIRED,
        centsOffset: NaN,
        channel,
      });
    });
  }

  selectVoice(noteNumber: number, centsOffset: number) {
    // Age signifies how many note ons have occured after voice intialization
    this.voices.forEach((voice) => voice.age++);

    // Re-use a channel that already has the correct pitch bend
    for (let i = 0; i < this.voices.length; ++i) {
      if (Math.abs(this.voices[i].centsOffset - centsOffset) < EPSILON) {
        this.log(`Re-using channel ${this.voices[i].channel}`);
        this.voices[i].age = 0;
        return this.voices[i];
      }
    }

    // Nothing re-usable found. Use the oldest voice.
    let oldestVoice = this.voices[0];
    this.voices.forEach((voice) => {
      if (voice.age > oldestVoice.age) {
        oldestVoice = voice;
      }
    });
    oldestVoice.age = 0;
    oldestVoice.centsOffset = centsOffset;
    return oldestVoice;
  }

  sendNoteOn(frequency: number, rawAttack: number) {
    if (this.output === null) {
      return emptyNoteOff;
    }
    if (!this.channels.size) {
      return emptyNoteOff;
    }
    const [noteNumber, centsOffset] = ftom(frequency);
    if (noteNumber < 0 || noteNumber >= 128) {
      return emptyNoteOff;
    }
    const voice = this.selectVoice(noteNumber, centsOffset);
    this.log(
      `Sending note on ${noteNumber} at velocity ${
        rawAttack / 127
      } on channel ${
        voice.channel
      } with bend ${centsOffset} resulting from frequency ${frequency}`
    );
    const bendRange = bendRangeInSemitones * 100;
    this.output.channels[voice.channel].sendPitchBend(centsOffset / bendRange);
    this.output.channels[voice.channel].sendNoteOn(noteNumber, { rawAttack });

    const noteOff = (rawRelease: number) => {
      this.log(
        `Sending note off ${noteNumber} at velocity ${
          rawRelease / 127
        } on channel ${voice.channel}`
      );
      voice.age = EXPIRED;
      this.output!.channels[voice.channel].sendNoteOff(noteNumber, {
        rawRelease,
      });
    };
    return noteOff;
  }
}

export type NoteOnCallback = (index: number, rawAttack: number) => NoteOff;

export class MidiIn {
  callback: NoteOnCallback;
  channels: Set<number>;
  noteOffMap: Map<number, (rawRelease: number) => void>;
  log: (msg: string) => void;

  constructor(
    callback: NoteOnCallback,
    channels: Set<number>,
    log?: (msg: string) => void
  ) {
    this.callback = callback;
    this.channels = channels;
    this.noteOffMap = new Map();
    if (log === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      this.log = (msg) => {};
    } else {
      this.log = log;
    }
  }

  noteOn(event: NoteMessageEvent) {
    if (!this.channels.has(event.message.channel)) {
      return;
    }
    const noteNumber = event.note.number;
    const attack = event.note.attack;
    const rawAttack = event.note.rawAttack;
    this.log(`Midi note on ${noteNumber} at velocity ${attack}`);
    const noteOff = this.callback(noteNumber, rawAttack);
    this.noteOffMap.set(noteNumber, noteOff);
  }

  noteOff(event: NoteMessageEvent) {
    if (!this.channels.has(event.message.channel)) {
      return;
    }
    const noteNumber = event.note.number;
    const release = event.note.release;
    const rawRelease = event.note.rawRelease;
    this.log(`Midi note off ${noteNumber} at velocity ${release}`);
    const noteOff = this.noteOffMap.get(noteNumber);
    if (noteOff !== undefined) {
      this.noteOffMap.delete(noteNumber);
      noteOff(rawRelease);
    }
  }

  deactivate() {
    for (const [noteNumber, noteOff] of this.noteOffMap) {
      this.noteOffMap.delete(noteNumber);
      noteOff(80);
    }
  }
}

export type MidiNoteInfo = {
  whiteNumber?: number;
  sharpOf?: number;
  flatOf?: number;
};

const WHITES = [0, 2, 4, 5, 7, 9, 11];

export function midiNoteInfo(chromaticNumber: number) {
  const octave = Math.floor(chromaticNumber / 12);
  const index = chromaticNumber - 12 * octave;
  if (WHITES.includes(index)) {
    return {
      whiteNumber: Math.floor((index + 1) / 2) + 7 * octave,
    };
  }
  if (index === 1 || index === 3) {
    return {
      sharpOf: (index - 1) / 2 + 7 * octave,
      flatOf: (index + 1) / 2 + 7 * octave,
    };
  }
  return {
    sharpOf: index / 2 + 7 * octave,
    flatOf: (index + 2) / 2 + 7 * octave,
  };
}

/**
 * Computes a mapping from white MIDI notes to white-colored scale degrees.
 *
 * If the base note is a black one the next white one will be used instead.
 *
 * Assumes that the size of the scale and number of colors is equal.
 * The user can violate this assumption, but that's just how SW is...
 */
export function computeWhiteIndices(baseMidiNote: number, colors: string[]) {
  const info = midiNoteInfo(baseMidiNote);
  colors = colors.map((c) => c.toLowerCase());

  let index = baseMidiNote;
  let whiteIndex =
    info.whiteNumber === undefined ? info.sharpOf + 1 : info.whiteNumber;
  let colorIndex = 0;
  const result = [];
  while (whiteIndex > 0 && index > -1024) {
    if (colors[mmod(colorIndex--, colors.length)] !== "black") {
      result[whiteIndex--] = index;
    }
    index--;
  }
  index = baseMidiNote;
  whiteIndex =
    info.whiteNumber === undefined ? info.sharpOf + 1 : info.whiteNumber;
  colorIndex = 0;
  while (whiteIndex < 75 && index < 1024) {
    if (colors[mmod(colorIndex++, colors.length)] !== "black") {
      result[whiteIndex++] = index;
    }
    index++;
  }
  return result;
}
