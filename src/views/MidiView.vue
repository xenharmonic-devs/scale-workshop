<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { Input, Output, WebMidi } from "webmidi";

const props = defineProps<{
  midiInput: Input | null;
  midiOutput: Output | null;
}>();

const emit = defineEmits(["update:midiInput", "update:midiOutput"]);

const inputs = reactive<Input[]>([]);
const outputs = reactive<Output[]>([]);

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
        <h1>MIDI</h1>
        <div class="control-group">
          <label for="input">Input</label>
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
          <label for="output">Output</label>
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
      </div>
    </div>
  </main>
</template>

<style scoped>
div.columns-container {
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-border);
  column-count: 1;
}
div.column {
  background-color: var(--color-background);
  overflow-x: hidden;
  height: 100%;
}
div.midi-controls {
  padding: 1rem;
}
</style>
