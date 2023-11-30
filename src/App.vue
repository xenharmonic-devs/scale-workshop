<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import {
  RouterLink,
  RouterView,
  useRouter,
  type LocationQuery,
} from "vue-router";
import {
  DEFAULT_NUMBER_OF_COMPONENTS,
  NEWLINE_TEST,
  NUMBER_OF_NOTES,
  UNIX_NEWLINE,
  WHITE_MODE_OFFSET,
} from "@/constants";
import { ScaleWorkshopOneData } from "@/scale-workshop-one";
import type { Input, Output } from "webmidi";
import { computeWhiteIndices } from "@/midi";
import { MidiIn, midiKeyInfo, MidiOut } from "xen-midi";
import { Keyboard, type CoordinateKeyboardEvent } from "@/keyboard";
import { decodeQuery, encodeQuery, type DecodedState } from "@/url-encode";
import { debounce } from "@/utils";
import { version } from "../package.json";
import { arraysEqual } from "xen-dev-utils";
import {
  mapWhiteAsdfBlackQwerty,
  mapWhiteQweZxcBlack123Asd,
} from "./keyboard-mapping";
import { useAudioStore } from "@/stores/audio";
import {
  Interval,
  parseLine,
  Scale,
  type IntervalOptions,
  reverseParseScale,
} from "scale-workshop-core";

// === Pinia-managed state ===
const audio = useAudioStore();

// === Application state ===
const scaleName = ref("");
const scaleLines = ref<string[]>([]);
const scale = reactive(
  Scale.fromIntervalArray([parseLine("1/1", DEFAULT_NUMBER_OF_COMPONENTS)])
);
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
// Keyboard mode affects both physical qwerty and virtual keyboards
const keyboardMode = ref<"isomorphic" | "piano">("isomorphic");
// Physical layout mimics a piano layout in one or two layers
const pianoMode = ref<"Asdf" | "QweZxc0" | "QweZxc1">("Asdf");
const equaveShift = ref(0);
const degreeShift = ref(0);
const heldNotes = reactive(new Map<number, number>());
const typingActive = ref(true);
const midiInput = ref<Input | null>(null);
const midiOutput = ref<Output | null>(null);
const midiInputChannels = reactive(new Set([1]));
// Channel 10 is reserved for percussion
const midiOutputChannels = ref(
  new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16])
);
const midiVelocityOn = ref(true);

const midiWhiteMode = ref<"off" | "simple" | "blackAverage" | "keyColors">(
  "off"
);

// These are user preferences and are fetched from local storage.
const newline = ref(UNIX_NEWLINE);
const colorScheme = ref<"light" | "dark">("light");
const centsFractionDigits = ref(3);
const decimalFractionDigits = ref(5);
const showVirtualQwerty = ref(false);
const midiOctaveOffset = ref(-1);
const intervalMatrixIndexing = ref(0);

// Special keyboard codes also from local storage.
const deactivationCode = ref("Backquote");
const equaveUpCode = ref("NumpadMultiply");
const equaveDownCode = ref("NumpadDivide");
const degreeUpCode = ref("NumpadAdd");
const degreeDownCode = ref("NumpadSubtract");

// === Computed state ===
const frequencies = computed(() =>
  scale.getFrequencyRange(
    -baseMidiNote.value,
    NUMBER_OF_NOTES - baseMidiNote.value
  )
);

// For midi mapping
const whiteIndices = computed(() =>
  computeWhiteIndices(baseMidiNote.value, keyColors.value)
);

const keyboardMapping = computed<Map<string, number>>(() => {
  const baseIndex =
    baseMidiNote.value + equaveShift.value * scale.size + degreeShift.value;
  if (pianoMode.value === "Asdf") {
    return mapWhiteAsdfBlackQwerty(
      keyColors.value,
      baseMidiNote.value,
      baseIndex
    );
  } else if (pianoMode.value === "QweZxc0") {
    return mapWhiteQweZxcBlack123Asd(
      keyColors.value,
      scale.size,
      baseMidiNote.value,
      baseIndex,
      0
    );
  } else {
    return mapWhiteQweZxcBlack123Asd(
      keyColors.value,
      scale.size,
      baseMidiNote.value,
      baseIndex,
      1
    );
  }
});

// === State updates ===
function updateFromScaleLines(lines: string[]) {
  if (arraysEqual(lines, scaleLines.value)) {
    return;
  }
  scaleLines.value = lines;
  const intervals: Interval[] = [];
  const options: IntervalOptions = {
    centsFractionDigits: centsFractionDigits.value,
    decimalFractionDigits: decimalFractionDigits.value,
  };
  lines.forEach((line) => {
    try {
      const interval = parseLine(line, DEFAULT_NUMBER_OF_COMPONENTS, options);
      intervals.push(interval);
    } catch { /* empty */ }
  });
  if (!intervals.length) {
    intervals.push(parseLine("1/1", DEFAULT_NUMBER_OF_COMPONENTS, options));
  }

  const surrogate = Scale.fromIntervalArray(intervals);
  scale.intervals = surrogate.intervals;
  scale.equave = surrogate.equave;
}

function updateFromScale(surrogate: Scale) {
  scale.intervals = surrogate.intervals;
  scale.equave = surrogate.equave;
  scaleLines.value = reverseParseScale(scale);
}

// == URL path handling ==
/**
 * Strip away base path such as /scaleworkshop-dev/
 */
function getPath(url: URL) {
  return url.pathname.slice(import.meta.env.BASE_URL.length);
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
    pianoMode: pianoMode.value,
    equaveShift: equaveShift.value,
    degreeShift: degreeShift.value,
    waveform: audio.waveform,
    attackTime: audio.attackTime,
    decayTime: audio.decayTime,
    sustainLevel: audio.sustainLevel,
    releaseTime: audio.releaseTime,
    pingPongDelayTime: audio.pingPongDelayTime,
    pingPongFeedback: audio.pingPongFeedback,
    pingPongSeparation: audio.pingPongSeparation,
    pingPongGain: audio.pingPongGain,
  };

  const query = encodeQuery(state) as LocationQuery;
  query.version = version;

  // XXX: There are some sporadic issues with useRoute().fullPath
  // so we use native URL.pathname.
  const url = new URL(window.location.href);

  router.push({ path: getPath(url), query });
}, 200);

watch(baseMidiNote, (newValue) => {
  if (isNaN(newValue)) {
    baseMidiNote.value = 69;
  } else if (Math.round(newValue) != newValue) {
    baseMidiNote.value = Math.round(newValue);
  }
});

watch(
  () => [
    scaleName.value,
    scaleLines.value,
    scale,
    baseMidiNote.value,
    keyColors.value,
    isomorphicHorizontal.value,
    isomorphicVertical.value,
    keyboardMode.value,
    pianoMode.value,
    equaveShift.value,
    degreeShift.value,
    audio.waveform,
    audio.attackTime,
    audio.decayTime,
    audio.sustainLevel,
    audio.releaseTime,
    audio.pingPongDelayTime,
    audio.pingPongFeedback,
    audio.pingPongSeparation,
    audio.pingPongGain,
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
      pianoMode.value = state.pianoMode;
      updateFromScaleLines(state.scaleLines);
      equaveShift.value = state.equaveShift;
      degreeShift.value = state.degreeShift;
      audio.waveform = state.waveform;
      audio.attackTime = state.attackTime;
      audio.decayTime = state.decayTime;
      audio.sustainLevel = state.sustainLevel;
      audio.releaseTime = state.releaseTime;
      audio.pingPongDelayTime = state.pingPongDelayTime;
      audio.pingPongFeedback = state.pingPongFeedback;
      audio.pingPongSeparation = state.pingPongSeparation;
      audio.pingPongGain = state.pingPongGain;
    } catch (error) {
      console.error(`Error parsing version ${query.get("version")} URL`, error);
    }
  }
});

// === Tuning table highlighting ===
// We use hacks to bypass Vue state management for real-time gains
function tuningTableKeyOn(index: number) {
  if (index >= 0 && index < 128) {
    let tuningTableRow = (window as any).TUNING_TABLE_ROWS[index];
    if (tuningTableRow === undefined) {
      tuningTableRow = { heldKeys: 0, element: null };
    }
    tuningTableRow.heldKeys++;
    if (tuningTableRow.element?._rawValue) {
      tuningTableRow.element._rawValue.classList.add("active");
    }
    (window as any).TUNING_TABLE_ROWS[index] = tuningTableRow;
  }
  // Virtual keyboard state is too complex so we take the performance hit.
  heldNotes.set(index, (heldNotes.get(index) || 0) + 1);
}

function tuningTableKeyOff(index: number) {
  if (index >= 0 && index < 128) {
    let tuningTableRow = (window as any).TUNING_TABLE_ROWS[index];
    if (tuningTableRow === undefined) {
      tuningTableRow = { heldKeys: 0, element: null };
    }
    tuningTableRow.heldKeys--;
    if (tuningTableRow.element?._rawValue) {
      if (!tuningTableRow.heldKeys) {
        tuningTableRow.element._rawValue.classList.remove("active");
      }
      (window as any).TUNING_TABLE_ROWS[index] = tuningTableRow;
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

const midiOut = computed(
  () => new MidiOut(midiOutput.value as Output, midiOutputChannels.value)
);

function sendNoteOn(frequency: number, rawAttack: number) {
  const midiOff = midiOut.value.sendNoteOn(frequency, rawAttack);

  if (audio.synth === null || audio.virtualSynth === null) {
    return midiOff;
  }

  // Trigger web audio API synth.
  const synthOff = audio.synth.noteOn(frequency, rawAttack / 127);

  // Trigger virtual synth for per-voice visualization.
  const virtualOff = audio.virtualSynth.voiceOn(frequency);

  const off = (rawRelease: number) => {
    midiOff(rawRelease);
    synthOff();
    virtualOff();
  };

  return off;
}

function midiNoteOn(index: number, rawAttack?: number) {
  if (rawAttack === undefined) {
    rawAttack = 80;
  }
  let frequency = frequencies.value[index];
  if (!midiVelocityOn.value) {
    rawAttack = 80;
  }

  // Store state to ensure consistent note off.
  const info = midiKeyInfo(index);
  const whiteMode = midiWhiteMode.value;
  const indices = whiteIndices.value;

  if (whiteMode === "off") {
    tuningTableKeyOn(index);
  } else if (whiteMode === "simple") {
    if (info.whiteNumber === undefined) {
      frequency = NaN;
    } else {
      info.whiteNumber += WHITE_MODE_OFFSET;
      frequency = getFrequency(info.whiteNumber);
      tuningTableKeyOn(info.whiteNumber);
    }
  } else if (whiteMode === "blackAverage") {
    if (info.whiteNumber === undefined) {
      info.flatOf += WHITE_MODE_OFFSET;
      info.sharpOf += WHITE_MODE_OFFSET;
      frequency = Math.sqrt(
        getFrequency(info.flatOf) * getFrequency(info.sharpOf)
      );
      tuningTableKeyOn(info.flatOf);
      tuningTableKeyOn(info.sharpOf);
    } else {
      info.whiteNumber += WHITE_MODE_OFFSET;
      frequency = getFrequency(info.whiteNumber);
      tuningTableKeyOn(info.whiteNumber);
    }
  } else if (whiteMode === "keyColors") {
    if (indices.length) {
      if (info.whiteNumber === undefined) {
        // Use a black key if available
        index = indices[info.sharpOf] + 1;
        // Eliminate duplicates
        if (index === indices[info.sharpOf + 1]) {
          frequency = NaN;
        } else {
          frequency = getFrequency(index);
          tuningTableKeyOn(index);
        }
      } else {
        index = indices[info.whiteNumber];
        frequency = getFrequency(index);
        tuningTableKeyOn(index);
      }
    } else {
      frequency = NaN;
    }
  }

  if (isNaN(frequency)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (rawRelease?: number) => {};
  }

  const noteOff = sendNoteOn(frequency, rawAttack);
  return (rawRelease?: number) => {
    if (rawRelease === undefined) {
      rawRelease = 80;
    }
    if (!midiVelocityOn.value) {
      rawRelease = 80;
    }
    if (whiteMode === "simple") {
      if (info.whiteNumber !== undefined) {
        tuningTableKeyOff(info.whiteNumber);
      }
    } else if (whiteMode === "blackAverage") {
      if (info.whiteNumber === undefined) {
        tuningTableKeyOff(info.flatOf);
        tuningTableKeyOff(info.sharpOf);
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
    midiIn.unlisten(oldValue as Input);
  }
  if (newValue !== null) {
    midiIn.listen(newValue as Input);

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
  // Audio context must be initialized as a response to user gesture
  audio.initialize();

  const target = event.target;
  // Keep typing activated while adjusting sliders
  if (
    target instanceof HTMLInputElement &&
    ["range", "radio", "checkbox"].includes(target.type)
  ) {
    typingActive.value = true;
    return;
  }
  // Disable typing for other types of input elements
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

  // Disable browser specific features like quick find on Firefox
  event.preventDefault();

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
    if (keyboardMapping.value.has(event.code)) {
      index = keyboardMapping.value.get(event.code)!;
    } else {
      // No user mapping for the key, bail out
      return emptyKeyup;
    }
  }

  return keyboardNoteOn(index);
}

// === Lifecycle ===
onMounted(() => {
  window.addEventListener("keyup", windowKeyup);
  window.addEventListener("keydown", windowKeydownOrUp);
  window.addEventListener("keyup", windowKeydownOrUp);
  window.addEventListener("mousedown", windowKeydownOrUp);
  window.addEventListener("keydown", windowKeydown);
  window.addEventListener("touchstart", audio.initialize);
  typingKeyboard.addKeydownListener(typingKeydown);

  const url = new URL(window.location.href);
  const query = url.searchParams;

  // Special handling for the empty app state so that
  // the browser's back button can undo to the clean state.
  if (![...query.keys()].length) {
    router.push({ path: getPath(url), query: { version } });
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

      audio.waveform = scaleWorkshopOneData.waveform || "semisine";
      audio.attackTime = scaleWorkshopOneData.attackTime;
      audio.decayTime = scaleWorkshopOneData.decayTime;
      audio.sustainLevel = scaleWorkshopOneData.sustainLevel;
      audio.releaseTime = scaleWorkshopOneData.releaseTime;
    } catch (error) {
      console.error("Error parsing version 1 URL", error);
    }
  }

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
  if ("showVirtualQwerty" in storage) {
    showVirtualQwerty.value = storage.getItem("showVirtualQwerty") === "true";
  }
  if ("midiOctaveOffset" in storage) {
    midiOctaveOffset.value = parseInt(storage.getItem("midiOctaveOffset")!);
  }
  if ("intervalMatrixIndexing" in storage) {
    intervalMatrixIndexing.value = parseInt(
      storage.getItem("intervalMatrixIndexing") ?? "0",
      10
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
  window.removeEventListener("touchstart", audio.initialize);
  typingKeyboard.removeEventListener(typingKeydown);
  if (midiInput.value !== null) {
    midiInput.value.removeListener();
  }
  audio.unintialize();
});

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
  if (audio.synth !== null) {
    audio.synth.allNotesOff();
  }
}

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
watch(showVirtualQwerty, (newValue) =>
  window.localStorage.setItem("showVirtualQwerty", newValue.toString())
);
watch(midiOctaveOffset, (newValue) =>
  window.localStorage.setItem("midiOctaveOffset", newValue.toString())
);
watch(intervalMatrixIndexing, (newValue) =>
  window.localStorage.setItem("intervalMatrixIndexing", newValue.toString())
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
    <ul id="app-tabs">
      <li>
        <RouterLink to="/about"><strong>Sw</strong></RouterLink>
      </li>
      <li><RouterLink to="/">Build Scale</RouterLink></li>
      <li><RouterLink to="/analysis">Analysis</RouterLink></li>
      <li><RouterLink to="/lattice">Lattice</RouterLink></li>
      <li><RouterLink to="/vk">Virtual Keyboard</RouterLink></li>
      <li v-if="showVirtualQwerty">
        <RouterLink to="/qwerty">Virtual QWERTY</RouterLink>
      </li>
      <li><RouterLink to="/synth">Synth</RouterLink></li>
      <li><RouterLink to="/midi">MIDI I/O</RouterLink></li>
      <li><RouterLink to="/prefs">Preferences</RouterLink></li>
    </ul>
    <div id="app-tray" class="hidden-sm">
      <ul>
        <template v-if="typingActive">
          <li title="Type on your computer keyboard to hear the synth">
            <span class="typing-info active">Key</span>
          </li>
        </template>
        <template v-else>
          <li
            title="Synth will not respond to keypresses until you click outside the input field"
          >
            <span class="typing-info">Key</span>
          </li>
        </template>
      </ul>
    </div>
  </nav>
  <RouterView
    :scaleName="scaleName"
    :scaleLines="scaleLines"
    :baseMidiNote="baseMidiNote"
    :keyColors="keyColors"
    :scale="scale"
    :frequencies="frequencies"
    :keyboardMode="keyboardMode"
    :pianoMode="pianoMode"
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
    :newline="newline"
    :colorScheme="colorScheme"
    :centsFractionDigits="centsFractionDigits"
    :decimalFractionDigits="decimalFractionDigits"
    :midiVelocityOn="midiVelocityOn"
    :midiWhiteMode="midiWhiteMode"
    :deactivationCode="deactivationCode"
    :equaveUpCode="equaveUpCode"
    :equaveDownCode="equaveDownCode"
    :degreeUpCode="degreeUpCode"
    :degreeDownCode="degreeDownCode"
    :typingKeyboard="typingKeyboard"
    :keyboardMapping="keyboardMapping"
    :showVirtualQwerty="showVirtualQwerty"
    :midiOctaveOffset="midiOctaveOffset"
    :intervalMatrixIndexing="intervalMatrixIndexing"
    @update:scaleName="scaleName = $event"
    @update:scaleLines="updateFromScaleLines"
    @update:scale="updateFromScale"
    @update:baseMidiNote="baseMidiNote = $event"
    @update:baseFrequency="scale.baseFrequency = $event"
    @update:keyColors="keyColors = $event"
    @update:isomorphicVertical="isomorphicVertical = $event"
    @update:isomorphicHorizontal="isomorphicHorizontal = $event"
    @update:keyboardMode="keyboardMode = $event"
    @update:pianoMode="pianoMode = $event"
    @update:equaveShift="equaveShift = $event"
    @update:degreeShift="degreeShift = $event"
    @update:midiInput="midiInput = $event"
    @update:midiOutput="midiOutput = $event"
    @update:midiInputChannels="updateMidiInputChannels"
    @update:midiOutputChannels="midiOutputChannels = $event"
    @update:midiVelocityOn="midiVelocityOn = $event"
    @update:midiWhiteMode="midiWhiteMode = $event"
    @update:newline="newline = $event"
    @update:colorScheme="colorScheme = $event"
    @update:centsFractionDigits="centsFractionDigits = $event"
    @update:decimalFractionDigits="decimalFractionDigits = $event"
    @update:showVirtualQwerty="showVirtualQwerty = $event"
    @update:midiOctaveOffset="midiOctaveOffset = $event"
    @update:intervalMatrixIndexing="intervalMatrixIndexing = $event"
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
  display: flex;
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
ul#app-tabs {
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

nav#app-navigation ul#app-tabs li a:hover {
  background-color: var(--color-accent-deeper);
}

nav#app-navigation ul#app-tabs li a.router-link-exact-active,
nav#app-navigation ul#app-tabs li a.router-link-exact-active:hover {
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

/* Status indicator tray */
#app-tray {
  width: 100%;
  text-align: right;
  cursor: default;
}

#app-tray ul {
  display: inline-block;
  padding: 0.75rem 1rem;
  background-color: var(--color-accent-deeper);
}

#app-tray ul li {
  color: var(--color-accent);
}

#app-tray ul li .active {
  color: var(--color-accent-text);
}
</style>
