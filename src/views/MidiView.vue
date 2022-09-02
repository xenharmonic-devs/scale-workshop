<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";
import { Input, Output, WebMidi } from "webmidi";

const props = defineProps<{
  midiInput: Input | null;
  midiOutput: Output | null;
  midiInputChannels: Set<number>;
  midiOutputChannels: Set<number>;
  midiVelocityOn: boolean;
  midiWhiteMode: "off" | "simple" | "blackAverage" | "keyColors";
}>();

const emit = defineEmits([
  "update:midiInput",
  "update:midiOutput",
  "update:midiInputChannels",
  "update:midiOutputChannels",
  "update:midiVelocityOn",
  "update:midiWhiteMode",
]);

const inputs = reactive<Input[]>([]);
const outputs = reactive<Output[]>([]);
const midiVelocityOn = computed({
  get: () => props.midiVelocityOn,
  set: (newValue) => emit("update:midiVelocityOn", newValue),
});
const midiWhiteMode = computed({
  get: () => props.midiWhiteMode,
  set: (newValue) => emit("update:midiWhiteMode", newValue),
});

function selectMidiInput(event: Event) {
  const id = (event!.target as HTMLSelectElement).value;
  if (id === "no-midi-input") {
    emit("update:midiInput", null);
  } else {
    emit("update:midiInput", WebMidi.getInputById(id));
  }
}

function selectMidiOutput(event: Event) {
  const id = (event!.target as HTMLSelectElement).value;
  if (id === "no-midi-output") {
    emit("update:midiOutput", null);
  } else {
    emit("update:midiOutput", WebMidi.getOutputById(id));
  }
}

function refreshMidi() {
  while (inputs.length) {
    inputs.pop();
  }
  WebMidi.inputs.forEach((input) => inputs.push(input));

  while (outputs.length) {
    outputs.pop();
  }
  WebMidi.outputs.forEach((output) => outputs.push(output));
}

function toggleChannel(
  event: Event,
  prop: Set<number>,
  eventStr: "update:midiInputChannels" | "update:midiOutputChannels"
) {
  const checkbox = event.target as HTMLInputElement;
  const channel = parseInt(checkbox.value);

  const result = new Set(prop);
  if (checkbox.checked) {
    result.add(channel);
  } else {
    result.delete(channel);
  }
  emit(eventStr, result);
}

const toggleInputChannel = (event: Event) =>
  toggleChannel(event, props.midiInputChannels, "update:midiInputChannels");
const toggleOutputChannel = (event: Event) =>
  toggleChannel(event, props.midiOutputChannels, "update:midiOutputChannels");

onMounted(async () => {
  await WebMidi.enable();
  refreshMidi();

  const existingOnStateChange = WebMidi.interface.onstatechange;
  WebMidi.interface.onstatechange = (e) => {
    existingOnStateChange(e);
    // XXX: Webmidi doesn't expose this state change correctly so we'll have to use a time out hack.
    setTimeout(refreshMidi, 500);
  };
});
</script>

<template>
  <main>
    <div class="columns-container">
      <div class="column midi-controls">
        <h2>MIDI Input</h2>
        <div class="control-group">
          <div class="control">
            <label for="input">Input device</label>
            <select id="input" @change="selectMidiInput" class="control">
              <option value="no-midi-input" :selected="midiInput === null">
                No MIDI input
              </option>
              <option
                v-for="input of inputs"
                :value="input.id"
                :key="input.id"
                :selected="input.id === props.midiInput?.id"
              >
                {{ (input.manufacturer || "(Generic)") + ": " + input.name }}
              </option>
            </select>
          </div>
          <div class="control channels-wrapper">
            <label>Input channels</label>
            <span v-for="channel in 16" :key="channel">
              <label>{{ " " + channel + " " }}</label>
              <input
                type="checkbox"
                :value="channel"
                :checked="midiInputChannels.has(channel)"
                @input="toggleInputChannel"
              />
            </span>
          </div>
          <div class="control checkbox-container">
            <input
              type="checkbox"
              id="midi-velocity"
              v-model="midiVelocityOn"
            />
            <label for="midi-velocity">Use velocity</label>
          </div>
          <div class="control radio-group">
            <label>Color mapping</label>
            <span>
              <input
                type="radio"
                id="white-off"
                value="off"
                v-model="midiWhiteMode"
              />
              <label for="white-off"> Chromatic </label>
            </span>
            <span>
              <input
                type="radio"
                id="white-simple"
                value="simple"
                v-model="midiWhiteMode"
              />
              <label for="white-simple"> White only </label>
            </span>
            <span>
              <input
                type="radio"
                id="white-black"
                value="blackAverage"
                v-model="midiWhiteMode"
              />
              <label for="white-black"> White w/ interpolation </label>
            </span>
            <span>
              <input
                type="radio"
                id="white-color"
                value="keyColors"
                v-model="midiWhiteMode"
              />
              <label for="white-color"> White key to white color </label>
            </span>
          </div>
        </div>
      </div>
      <div class="column midi-controls">
        <h2>MIDI Output</h2>
        <div class="control-group">
          <div class="control">
            <label for="output">Output device</label>
            <select id="output" @change="selectMidiOutput" class="control">
              <option value="no-midi-output" :selected="midiOutput === null">
                No MIDI output
              </option>
              <option
                v-for="output of outputs"
                :value="output.id"
                :key="output.id"
                :selected="output.id === props.midiOutput?.id"
              >
                {{ (output.manufacturer || "(Generic)") + ": " + output.name }}
              </option>
            </select>
          </div>
          <div class="control channels-wrapper">
            <label>Output channels</label>
            <span v-for="channel in 16" :key="channel">
              <label>{{ " " + channel + " " }}</label>
              <input
                type="checkbox"
                :value="channel"
                :checked="midiOutputChannels.has(channel)"
                @input="toggleOutputChannel"
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Content layout */
div.columns-container {
  height: 100%;
  overflow-y: auto;
}
div.column {
  overflow-x: hidden;
}

@media screen and (min-width: 600px) {
  div.columns-container {
    background-color: var(--color-border);
    column-count: 2;
    column-gap: 1px;
    height: 100%;
  }
  div.column {
    background-color: var(--color-background);
    height: 100%;
    overflow-y: auto;
  }
}

div.midi-controls {
  padding: 1rem;
}

div.channels-wrapper {
  column-gap: 1rem;
  margin-bottom: 1rem;
}

div.channels-wrapper span {
  display: flex;
  flex-flow: column;
  text-align: center;
}
</style>
