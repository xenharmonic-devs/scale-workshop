<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import {
  RouterLink,
  RouterView,
  useRouter,
  type LocationQuery,
} from "vue-router";
import { NEWLINE_TEST, NUMBER_OF_NOTES, UNIX_NEWLINE } from "@/constants";
import { ScaleWorkshopOneData } from "@/scale-workshop-one";
import type { Input, Output } from "webmidi";
import Scale from "@/scale";
import { parseLine } from "@/parser";
import { bendRangeInSemitones, MidiIn, midiNoteInfo, MidiOut } from "@/midi";
import { Keyboard, type CoordinateKeyboardEvent } from "@/keyboard";
import { decodeQuery, encodeQuery, type DecodedState } from "@/url-encode";
import { debounce } from "@/utils";
import { version } from "../package.json";
import type { Interval } from "@/interval";
import { arraysEqual } from "xen-dev-utils";
import {
  mapWhiteAsdfBlackQwerty,
  mapWhiteQweZxcBlack123Asd,
} from "./keyboard-mapping";
import { VirtualSynth } from "./virtual-synth";
import { Synth } from "@/synth";

// === Root props and audio ===
const rootProps = defineProps<{
  audioContext: AudioContext;
}>();
// Protect the user's audio system by limiting
// the gain and frequency response.
const mainGain = ref<GainNode | null>(null);
const mainLowpass = ref<BiquadFilterNode | null>(null);
const mainHighpass = ref<BiquadFilterNode | null>(null);
// Keep a reference to the intended destination of the filter stack.
const audioDestination = ref<AudioNode | null>(null);
// Chromium has some issues with audio nodes as props
// so we need this extra ref and the associated watcher.
const mainVolume = ref(0.175);

// === Application state ===
const scaleName = ref("");
const scaleLines = ref<string[]>([]);
const scale = reactive(Scale.fromIntervalArray([parseLine("1/1")]));
const baseMidiNote = ref(69);
const keyColors = ref([
  "white",
  "black",
  "white",
  "white",
  "black",
  "white",
  "black",
  "white",
  "white",
  "black",
  "white",
  "black",
]);
const isomorphicVertical = ref(5);
const isomorphicHorizontal = ref(1);
const keyboardMapping = reactive<Map<string, number>>(new Map());
mapWhiteAsdfBlackQwerty(keyColors.value, keyboardMapping);
const keyboardMode = ref<"isomorphic" | "mapped">("isomorphic");
const equaveShift = ref(0);
const degreeShift = ref(0);
const heldNotes = reactive(new Map<number, number>());
const typingActive = ref(true);
const synth = reactive(new Synth(rootProps.audioContext));
const midiInput = ref<Input | null>(null);
const midiOutput = ref<Output | null>(null);
const midiInputChannels = reactive(new Set([1]));
// Channel 10 is reserved for percussion
const midiOutputChannels = ref(
  new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16])
);
const virtualSynth = reactive(new VirtualSynth(rootProps.audioContext));
const midiVelocityOn = ref(true);
const midiWhiteMode = ref(false);
const midiBlackAverage = ref(false);
// These are user preferences and are fetched from local storage.
const newline = ref(UNIX_NEWLINE);
const colorScheme = ref<"light" | "dark">("light");
const centsFractionDigits = ref(3);
const decimalFractionDigits = ref(5);
// Special keyboard codes also from local storage.
const deactivationCode = ref("Backquote");
const equaveUpCode = ref("NumpadMultiply");
const equaveDownCode = ref("NumpadDivide");
const degreeUpCode = ref("NumpadAdd");
const degreeDownCode = ref("NumpadSubtract");

// === Computed state ===
const frequencies = computed(() =>
  [...Array(NUMBER_OF_NOTES).keys()].map((i) =>
    scale.getFrequency(i - baseMidiNote.value)
  )
);

function updateFromScaleLines(lines: string[]) {
  if (arraysEqual(lines, scaleLines.value)) {
    return;
  }
  scaleLines.value = lines;
  const intervals: Interval[] = [];
  lines.forEach((line) => {
    try {
      const interval = parseLine(line);
      intervals.push(interval);
    } catch {}
  });
  if (!intervals.length) {
    intervals.push(parseLine("1/1"));
  }

  const surrogate = Scale.fromIntervalArray(intervals);
  scale.intervals = surrogate.intervals;
  scale.equave = surrogate.equave;
}

function updateFromScale(surrogate: Scale) {
  scale.intervals = surrogate.intervals;
  scale.equave = surrogate.equave;
  scaleLines.value = scale.toStrings();
}

// == State encoding ==
const router = useRouter();

// Flags to prevent infinite decode - watch - encode loops
let justEncodedUrl = false;
let justDecodedUrl = false;

// Debounced to stagger navigation loops if the flags fail
const encodeState = debounce(() => {
  // Navigation loop prevention
  if (justDecodedUrl) {
    justDecodedUrl = false;
    return;
  }
  justEncodedUrl = true;

  const state: DecodedState = {
    scaleName: scaleName.value,
    scaleLines: scaleLines.value,
    baseFrequency: scale.baseFrequency,
    baseMidiNote: baseMidiNote.value,
    keyColors: keyColors.value,
    isomorphicHorizontal: isomorphicHorizontal.value,
    isomorphicVertical: isomorphicVertical.value,
    keyboardMode: keyboardMode.value,
    keyboardMapping,
    equaveShift: equaveShift.value,
    degreeShift: degreeShift.value,
    waveform: synth.waveform,
    attackTime: synth.attackTime,
    decayTime: synth.decayTime,
    sustainLevel: synth.sustainLevel,
    releaseTime: synth.releaseTime,
  };

  const query = encodeQuery(state) as LocationQuery;
  query.version = version;

  // XXX: There are some sporadic issues with useRoute().fullPath
  // so we use native URL.pathname.
  const url = new URL(window.location.href);
  router.push({ path: url.pathname, query });
}, 200);

watch(
  [
    scaleName,
    scaleLines,
    scale,
    baseMidiNote,
    keyColors,
    isomorphicHorizontal,
    isomorphicVertical,
    keyboardMode,
    keyboardMapping,
    equaveShift,
    degreeShift,
    synth,
  ],
  encodeState
);

// == State decoding ==
router.afterEach((to, from) => {
  if (to.fullPath === from.fullPath) {
    return;
  }
  // Navigation loop prevention
  if (justEncodedUrl) {
    justEncodedUrl = false;
    return;
  }

  // XXX: There are some sporadic issues with useRoute().fullPath
  // so we use native URL.searchParams.
  const url = new URL(window.location.href);
  const query = url.searchParams;
  if (query.has("version")) {
    try {
      const state = decodeQuery(query);
      justDecodedUrl = true;

      scaleName.value = state.scaleName;
      scale.baseFrequency = state.baseFrequency;
      baseMidiNote.value = state.baseMidiNote;
      keyColors.value = state.keyColors;
      isomorphicHorizontal.value = state.isomorphicHorizontal;
      isomorphicVertical.value = state.isomorphicVertical;
      keyboardMode.value = state.keyboardMode;
      updateFromScaleLines(state.scaleLines);
      keyboardMapping.clear();
      for (const [key, value] of state.keyboardMapping) {
        keyboardMapping.set(key, value);
      }
      equaveShift.value = state.equaveShift;
      degreeShift.value = state.degreeShift;
      synth.waveform = state.waveform;
      synth.attackTime = state.attackTime;
      synth.decayTime = state.decayTime;
      synth.sustainLevel = state.sustainLevel;
      synth.releaseTime = state.releaseTime;
    } catch (error) {
      console.error(`Error parsing version ${query.get("version")} URL`, error);
    }
  }
});

// === Tuning table highlighting ===
// We use hacks to bypass Vue state management for real-time gains
function tuningTableKeyOn(index: number) {
  if ("TUNING_TABLE_ROWS" in window && index >= 0 && index < 128) {
    const tuningTableRow = (window as any).TUNING_TABLE_ROWS[index];
    if (tuningTableRow?._rawValue) {
      tuningTableRow._rawValue.classList.add("active");
      tuningTableRow.heldKeys++;
    }
  }
  // Virtual keyboard state is too complex so we take the performance hit.
  heldNotes.set(index, (heldNotes.get(index) || 0) + 1);
}

function tuningTableKeyOff(index: number) {
  if ("TUNING_TABLE_ROWS" in window && index >= 0 && index < 128) {
    const tuningTableRow = (window as any).TUNING_TABLE_ROWS[index];
    if (tuningTableRow?._rawValue) {
      if (!--tuningTableRow.heldKeys) {
        tuningTableRow._rawValue.classList.remove("active");
      }
    }
  }
  heldNotes.set(index, (heldNotes.get(index) || 1) - 1);
}

// === MIDI input / output ===
function getFrequency(index: number) {
  if (index >= 0 && index < frequencies.value.length) {
    return frequencies.value[index];
  } else {
    // Support more than 128 notes with some additional computational cost
    return scale.getFrequency(index - baseMidiNote.value);
  }
}

const midiOut = computed(() => {
  return new MidiOut(midiOutput.value as Output, midiOutputChannels.value);
});

function sendNoteOn(frequency: number, rawAttack: number) {
  const midiOff = midiOut.value.sendNoteOn(frequency, rawAttack);

  if (audioDestination.value !== null) {
    // Trigger web audio API synth.
    const synthOff = synth.noteOn(
      frequency,
      rawAttack / 127,
      audioDestination.value
    );

    // Trigger virtual synth for per-voice visualization.
    const virtualOff = virtualSynth.voiceOn(frequency);

    const off = (rawRelease: number) => {
      midiOff(rawRelease);
      synthOff();
      virtualOff();
    };

    return off;
  } else {
    return midiOff;
  }
}

// Offset such that default base MIDI note doesn't move
const WHITE_MODE_OFFSET = 69 - 40;

function midiNoteOn(index: number, rawAttack: number) {
  let frequency = frequencies.value[index];
  if (!midiVelocityOn.value) {
    rawAttack = 80;
  }

  // Store state to ensure consistent note off.
  const info = midiNoteInfo(index);
  const whiteMode = midiWhiteMode.value;
  const blackAverage = midiBlackAverage.value;

  if (whiteMode) {
    if (info.whiteNumber === undefined) {
      info.flatOf += WHITE_MODE_OFFSET;
      info.sharpOf += WHITE_MODE_OFFSET;
      if (blackAverage) {
        frequency = Math.sqrt(
          getFrequency(info.flatOf) * getFrequency(info.sharpOf)
        );
        tuningTableKeyOn(info.flatOf);
        tuningTableKeyOn(info.sharpOf);
      } else {
        frequency = NaN;
      }
    } else {
      info.whiteNumber += WHITE_MODE_OFFSET;
      frequency = getFrequency(info.whiteNumber);
      tuningTableKeyOn(info.whiteNumber);
    }
  } else {
    tuningTableKeyOn(index);
  }

  if (isNaN(frequency)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (rawRelease: number) => {};
  }

  const noteOff = sendNoteOn(frequency, rawAttack);
  return (rawRelease: number) => {
    if (!midiVelocityOn.value) {
      rawRelease = 80;
    }
    if (whiteMode) {
      if (info.whiteNumber === undefined) {
        if (blackAverage) {
          tuningTableKeyOff(info.flatOf);
          tuningTableKeyOff(info.sharpOf);
        }
      } else {
        tuningTableKeyOff(info.whiteNumber);
      }
    } else {
      tuningTableKeyOff(index);
    }
    noteOff(rawRelease);
  };
}

const midiIn = new MidiIn(midiNoteOn, midiInputChannels);

const RESERVED_MESSAGES = ["noteon", "noteoff", "pitchbend"];

watch(midiInput, (newValue, oldValue) => {
  if (oldValue !== null) {
    oldValue.removeListener();
  }
  if (newValue !== null) {
    newValue.addListener("noteon", midiIn.noteOn.bind(midiIn));
    newValue.addListener("noteoff", midiIn.noteOff.bind(midiIn));

    // Pass everything else through and distrubute among the channels
    newValue.addListener("midimessage", (event) => {
      if (
        !RESERVED_MESSAGES.includes(event.message.type) &&
        midiOutput.value !== null
      ) {
        if (
          event.message.isChannelMessage &&
          midiInputChannels.has(event.message.channel)
        ) {
          const status = event.message.statusByte & 0b11110000;
          for (const channel of midiOutputChannels.value) {
            const data = [...event.message.data];
            data[0] = status | (channel - 1);
            midiOutput.value.send(data);
          }
        } else {
          midiOutput.value.send(event.message);
        }
      }
    });
  }
});

function sendPitchBendRange() {
  const output = midiOutput.value;
  if (output !== null) {
    midiOutputChannels.value.forEach((channel) => {
      output.channels[channel].sendPitchBendRange(bendRangeInSemitones, 0);
    });
  }
}

// === Virtual and typing keyboard ===
function keyboardNoteOn(index: number) {
  tuningTableKeyOn(index);
  const noteOff = sendNoteOn(getFrequency(index), 80);
  function keyOff() {
    tuningTableKeyOff(index);
    return noteOff(80);
  }
  return keyOff;
}

// === Typing keyboard state ===
function windowKeydownOrUp(event: KeyboardEvent | MouseEvent) {
  const target = event.target;
  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement
  ) {
    typingActive.value = false;
  } else {
    typingActive.value = true;
  }
}

// === Handle special keys ===
function windowKeydown(event: KeyboardEvent) {
  // Currently editing the scale, bail out
  if (!typingActive.value) {
    return;
  }

  // The key left of Digit1 releases sustained keys
  if (event.code === deactivationCode.value) {
    typingKeyboard.deactivate();
    return;
  }

  // "Octave" keys
  if (event.code === equaveUpCode.value) {
    equaveShift.value++;
    return;
  }
  if (event.code === equaveDownCode.value) {
    equaveShift.value--;
    return;
  }

  // "Transpose" keys
  if (event.code === degreeUpCode.value) {
    degreeShift.value++;
    return;
  }
  if (event.code === degreeDownCode.value) {
    degreeShift.value--;
    return;
  }

  typingKeyboard.keydown(event);
}

// Keyups don't make new sounds so they can be passed through.
function windowKeyup(event: KeyboardEvent) {
  typingKeyboard.keyup(event);
}

// === Typing keyboard input ===
const typingKeyboard = new Keyboard();

function emptyKeyup() {}

function typingKeydown(event: CoordinateKeyboardEvent) {
  // Key not mapped to layers, bail out
  if (event.coordinates === undefined) {
    return emptyKeyup;
  }

  const [x, y, z] = event.coordinates;

  // Key not in the layer with digits and letters, bail out
  if (z !== 1) {
    return emptyKeyup;
  }

  let index = baseMidiNote.value + scale.size * equaveShift.value;

  if (keyboardMode.value === "isomorphic") {
    index +=
      degreeShift.value +
      x * isomorphicHorizontal.value +
      (2 - y) * isomorphicVertical.value;
  } else {
    if (keyboardMapping.has(event.code)) {
      index += keyboardMapping.get(event.code)!;
    } else {
      // No user mapping for the key, bail out
      return emptyKeyup;
    }
  }

  return keyboardNoteOn(index);
}

// === Lifecycle ===
onMounted(() => {
  window.addEventListener("keydown", windowKeydown);
  window.addEventListener("keyup", windowKeyup);
  window.addEventListener("keydown", windowKeydownOrUp);
  window.addEventListener("keyup", windowKeydownOrUp);
  window.addEventListener("mousedown", windowKeydownOrUp);
  typingKeyboard.addKeydownListener(typingKeydown);

  const url = new URL(window.location.href);
  const query = url.searchParams;

  // Special handling for the empty app state so that
  // the browser's back button can undo to the clean state.
  if (![...query.keys()].length) {
    router.push({ path: url.pathname, query: { version } });
  }
  // Scale Workshop 1 compatibility
  else if (!query.has("version")) {
    try {
      const scaleWorkshopOneData = new ScaleWorkshopOneData();

      scaleName.value = scaleWorkshopOneData.name;
      scale.baseFrequency = scaleWorkshopOneData.freq;
      baseMidiNote.value = scaleWorkshopOneData.midi;
      isomorphicHorizontal.value = scaleWorkshopOneData.horizontal;
      isomorphicVertical.value = scaleWorkshopOneData.vertical;
      if (scaleWorkshopOneData.colors !== undefined) {
        keyColors.value = scaleWorkshopOneData.colors.split(" ");
      }

      if (scaleWorkshopOneData.data !== undefined) {
        // Check that the scale is valid by attempting a parse
        scaleWorkshopOneData.parseTuningData();
        // Store raw text lines
        updateFromScaleLines(scaleWorkshopOneData.data.split(NEWLINE_TEST));
      }

      synth.waveform = scaleWorkshopOneData.waveform || "semisine";
      synth.attackTime = scaleWorkshopOneData.attackTime;
      synth.decayTime = scaleWorkshopOneData.decayTime;
      synth.sustainLevel = scaleWorkshopOneData.sustainLevel;
      synth.releaseTime = scaleWorkshopOneData.releaseTime;
    } catch (error) {
      console.error("Error parsing version 1 URL", error);
    }
  }
  // Audio
  const ctx = rootProps.audioContext;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(mainVolume.value, ctx.currentTime);
  gain.connect(ctx.destination);
  mainGain.value = gain;

  const lowpass = ctx.createBiquadFilter();
  lowpass.frequency.setValueAtTime(5000, ctx.currentTime);
  lowpass.Q.setValueAtTime(Math.sqrt(0.5), ctx.currentTime);
  lowpass.type = "lowpass";
  lowpass.connect(gain);
  mainLowpass.value = lowpass;

  const highpass = ctx.createBiquadFilter();
  highpass.frequency.setValueAtTime(30, ctx.currentTime);
  highpass.Q.setValueAtTime(Math.sqrt(0.5), ctx.currentTime);
  highpass.type = "highpass";
  highpass.connect(lowpass);
  mainHighpass.value = highpass;

  // Intended point of audio connection
  audioDestination.value = highpass;

  // Fetch user preferences
  const storage = window.localStorage;
  if ("newline" in storage) {
    newline.value = storage.getItem("newline")!;
  }
  if ("colorScheme" in storage) {
    const scheme = storage.getItem("colorScheme");
    if (scheme === "light" || scheme === "dark") {
      colorScheme.value = scheme;
    }
  } else {
    // Infer based on a media query.
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      colorScheme.value = "dark";
    } else {
      colorScheme.value = "light";
    }
  }
  if ("centsFractionDigits" in storage) {
    centsFractionDigits.value = parseInt(
      storage.getItem("centsFractionDigits")!
    );
  }
  if ("decimalFractionDigits" in storage) {
    decimalFractionDigits.value = parseInt(
      storage.getItem("decimalFractionDigits")!
    );
  }

  // Fetch special key map
  if ("deactivationCode" in storage) {
    deactivationCode.value = storage.getItem("deactivationCode")!;
  }
  if ("equaveUpCode" in storage) {
    equaveUpCode.value = storage.getItem("equaveUpCode")!;
  }
  if ("equaveDownCode" in storage) {
    equaveDownCode.value = storage.getItem("equaveDownCode")!;
  }
  if ("degreeUpCode" in storage) {
    degreeUpCode.value = storage.getItem("degreeUpCode")!;
  }
  if ("degreeDownCode" in storage) {
    degreeDownCode.value = storage.getItem("degreeDownCode")!;
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", windowKeydown);
  window.removeEventListener("keyup", windowKeyup);
  window.removeEventListener("keydown", windowKeydownOrUp);
  window.removeEventListener("keyup", windowKeydownOrUp);
  window.removeEventListener("mousedown", windowKeydownOrUp);
  typingKeyboard.removeEventListener(typingKeydown);
  if (midiInput.value !== null) {
    midiInput.value.removeListener();
  }
  // Audio
  if (mainGain.value !== null) {
    mainGain.value.disconnect();
  }
  if (mainLowpass.value !== null) {
    mainLowpass.value.disconnect();
  }
  if (mainHighpass.value !== null) {
    mainHighpass.value.disconnect();
  }
  mainGain.value = null;
  mainLowpass.value = null;
  mainHighpass.value = null;
  audioDestination.value = null;
});

watch(mainVolume, (newValue) => {
  if (mainGain.value === null) {
    return;
  }
  mainGain.value.gain.setTargetAtTime(
    newValue,
    rootProps.audioContext.currentTime,
    0.01
  );
});

watch(midiOutput, sendPitchBendRange);
watch(midiOutputChannels, sendPitchBendRange);

function updateMidiInputChannels(newValue: Set<number>) {
  midiInputChannels.clear();
  newValue.forEach((channel) => midiInputChannels.add(channel));
}

function panic() {
  console.log("Firing global key off.");
  typingKeyboard.deactivate();
  midiIn.deactivate();
  if (midiOutput.value !== null) {
    midiOutput.value.sendAllNotesOff({
      channels: [...midiOutputChannels.value],
    });
  }
}

// Code for hard panic if needed in the future.
/*
function hardPanic() {
  console.warn("Cutting all audio!");
  typingKeyboad.deactivate();
  midiIn.deactivate();
  if (midiOutput.value !== null) {
    midiOutput.value.sendAllNotesOff();
    midiOutput.value.sendAllSoundOff();
    midiOutput.value.sendStop();
  }
  rootProps.audioContext.suspend();
}

function unpanic() {
  console.log("Resuming audio.");
  rootProps.audioContext.resume();
}
*/
// Store user preferences
watch(newline, (newValue) => window.localStorage.setItem("newline", newValue));
watch(colorScheme, (newValue) => {
  window.localStorage.setItem("colorScheme", newValue);
  document.documentElement.setAttribute("data-theme", newValue);
});
watch(centsFractionDigits, (newValue) =>
  window.localStorage.setItem("centsFractionDigits", newValue.toString())
);
watch(decimalFractionDigits, (newValue) =>
  window.localStorage.setItem("decimalFractionDigits", newValue.toString())
);
// Store keymaps
watch(deactivationCode, (newValue) =>
  window.localStorage.setItem("deactivationCode", newValue)
);
watch(equaveUpCode, (newValue) =>
  window.localStorage.setItem("equaveUpCode", newValue)
);
watch(equaveDownCode, (newValue) =>
  window.localStorage.setItem("equaveDownCode", newValue)
);
watch(degreeUpCode, (newValue) =>
  window.localStorage.setItem("degreeUpCode", newValue)
);
watch(degreeDownCode, (newValue) =>
  window.localStorage.setItem("degreeDownCode", newValue)
);
</script>

<template>
  <nav id="app-navigation">
    <ul>
      <li>
        <RouterLink to="/about"><strong>Sw</strong></RouterLink>
      </li>
      <li><RouterLink to="/">Build Scale</RouterLink></li>
      <li><RouterLink to="/analysis">Analysis</RouterLink></li>
      <li><RouterLink to="/vk">Virtual Keyboard</RouterLink></li>
      <li><RouterLink to="/synth">Synth</RouterLink></li>
      <li><RouterLink to="/midi">MIDI I/O</RouterLink></li>
      <li><RouterLink to="/prefs">Preferences</RouterLink></li>
      <template v-if="typingActive"
        ><span class="typing-info">KEY</span></template
      >
      <template v-else></template>
    </ul>
  </nav>
  <RouterView
    :audioContext="audioContext"
    :audioOutput="mainGain"
    :mainVolume="mainVolume"
    :scaleName="scaleName"
    :scaleLines="scaleLines"
    :baseMidiNote="baseMidiNote"
    :keyColors="keyColors"
    :scale="scale"
    :frequencies="frequencies"
    :keyboardMode="keyboardMode"
    :keyboardMapping="keyboardMapping"
    :isomorphicHorizontal="isomorphicHorizontal"
    :isomorphicVertical="isomorphicVertical"
    :equaveShift="equaveShift"
    :degreeShift="degreeShift"
    :midiInput="midiInput"
    :midiOutput="midiOutput"
    :noteOn="keyboardNoteOn"
    :heldNotes="heldNotes"
    :midiInputChannels="midiInputChannels"
    :midiOutputChannels="midiOutputChannels"
    :synth="synth"
    :virtualSynth="virtualSynth"
    :newline="newline"
    :colorScheme="colorScheme"
    :centsFractionDigits="centsFractionDigits"
    :decimalFractionDigits="decimalFractionDigits"
    :midiVelocityOn="midiVelocityOn"
    :midiWhiteMode="midiWhiteMode"
    :midiBlackAverage="midiBlackAverage"
    :deactivationCode="deactivationCode"
    :equaveUpCode="equaveUpCode"
    :equaveDownCode="equaveDownCode"
    :degreeUpCode="degreeUpCode"
    :degreeDownCode="degreeDownCode"
    @update:mainVolume="mainVolume = $event"
    @update:scaleName="scaleName = $event"
    @update:scaleLines="updateFromScaleLines"
    @update:scale="updateFromScale"
    @update:baseMidiNote="baseMidiNote = $event"
    @update:baseFrequency="scale.baseFrequency = $event"
    @update:keyColors="keyColors = $event"
    @update:isomorphicVertical="isomorphicVertical = $event"
    @update:isomorphicHorizontal="isomorphicHorizontal = $event"
    @update:keyboardMode="keyboardMode = $event"
    @update:equaveShift="equaveShift = $event"
    @update:degreeShift="degreeShift = $event"
    @update:midiInput="midiInput = $event"
    @update:midiOutput="midiOutput = $event"
    @update:midiInputChannels="updateMidiInputChannels"
    @update:midiOutputChannels="midiOutputChannels = $event"
    @mapAsdf="mapWhiteAsdfBlackQwerty(keyColors, keyboardMapping)"
    @mapZxcv0="
      mapWhiteQweZxcBlack123Asd(keyColors, keyboardMapping, scale.size, 0)
    "
    @mapZxcv1="
      mapWhiteQweZxcBlack123Asd(keyColors, keyboardMapping, scale.size, 1)
    "
    @update:midiVelocityOn="midiVelocityOn = $event"
    @update:midiWhiteMode="midiWhiteMode = $event"
    @update:midiBlackAverage="midiBlackAverage = $event"
    @update:newline="newline = $event"
    @update:colorScheme="colorScheme = $event"
    @update:centsFractionDigits="centsFractionDigits = $event"
    @update:decimalFractionDigits="decimalFractionDigits = $event"
    @update:deactivationCode="deactivationCode = $event"
    @update:equaveUpCode="equaveUpCode = $event"
    @update:equaveDownCode="equaveDownCode = $event"
    @update:degreeUpCode="degreeUpCode = $event"
    @update:degreeDownCode="degreeDownCode = $event"
    @panic="panic"
  />
</template>

<style>
@import "@/assets/base.css";

#app {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100vh;
}

nav#app-navigation {
  flex: 0 0 auto;
}

#app > main {
  flex: 1 1 auto;
  overflow-y: hidden;
}

/* Navigation tabs */
nav#app-navigation {
  background-color: var(--color-accent);
  color: white;
  max-width: 100%;
  overflow-x: auto;
}
nav#app-navigation ul {
  padding: 0px;
  margin: 0px;
  white-space: nowrap;
}
nav#app-navigation ul li {
  list-style-type: none;
  display: inline-block;
}
nav#app-navigation ul li a {
  display: inline-block;
  padding: 0.75rem 1rem;
  color: white;
  text-decoration: none;
  cursor: default;
}

nav#app-navigation ul li a:hover {
  background-color: var(--color-accent-deeper);
}

nav#app-navigation ul li a.router-link-exact-active,
nav#app-navigation ul li a.router-link-exact-active:hover {
  background-color: var(--color-background);
  color: var(--color-text);
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

.typing-info {
  background-color: var(--color-accent-deeper);
  padding: 0 0.3rem;
}

.panic a {
  color: black;
}
</style>
