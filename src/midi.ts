import type { NoteMessageEvent, Output } from "webmidi";
import { ftom } from "xen-dev-utils";

export const bendRangeInSemitones = 2;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function emptyNoteOff(rawRelease: number) {}

export type NoteOff = typeof emptyNoteOff;

// TODO: Juggle multiple channels and pitch bends.
export class MidiOut {
  output: Output | null;
  log: (msg: string) => void;

  constructor(output: Output | null, log?: (msg: string) => void) {
    this.output = output;
    if (log === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      this.log = (msg) => {};
    } else {
      this.log = log;
    }
  }

  sendNoteOn(frequency: number, rawAttack: number) {
    if (this.output === null) {
      return emptyNoteOff;
    }
    const [noteNumber, centsOffset] = ftom(frequency);
    if (noteNumber < 0 || noteNumber >= 128) {
      return emptyNoteOff;
    }
    this.log(
      `Sending note on ${noteNumber} at velocity ${
        rawAttack / 127
      } with bend ${centsOffset} resulting from frequency ${frequency}`
    );
    const bendRange = bendRangeInSemitones * 100;
    this.output.channels[1].sendPitchBend(centsOffset / bendRange);
    this.output.channels[1].sendNoteOn(noteNumber, { rawAttack });

    const noteOff = (rawRelease: number) => {
      this.log(
        `Sending note off ${noteNumber} at velocity ${rawRelease / 127}`
      );
      this.output!.channels[1].sendNoteOff(noteNumber, { rawRelease });
    };
    return noteOff;
  }
}

export type NoteOnCallback = (frequency: number, rawAttack: number) => NoteOff;

export class MidiIn {
  noteNumberToFrequency: (noteNumber: number) => number;
  callback: NoteOnCallback;
  noteOffMap: Map<number, (rawRelease: number) => void>;
  log: (msg: string) => void;

  constructor(
    noteNumberToFrequency: (noteNumber: number) => number,
    callback: NoteOnCallback,
    log?: (msg: string) => void
  ) {
    this.noteNumberToFrequency = noteNumberToFrequency;
    this.callback = callback;
    this.noteOffMap = new Map();
    if (log === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      this.log = (msg) => {};
    } else {
      this.log = log;
    }
  }

  noteOn(event: NoteMessageEvent) {
    const noteNumber = event.note.number;
    const attack = event.note.attack;
    const rawAttack = event.note.rawAttack;
    const frequency = this.noteNumberToFrequency(noteNumber);
    this.log(
      `Midi note on ${noteNumber} resulting in frequency ${frequency} at velocity ${attack}`
    );
    const noteOff = this.callback(frequency, rawAttack);
    this.noteOffMap.set(noteNumber, noteOff);
  }

  noteOff(event: NoteMessageEvent) {
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
}
