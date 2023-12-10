<script setup lang="ts">
import MtsSysexExporter from "@/exporters/mts-sysex";
import { sanitizeFilename } from "@/utils";
import { computed, onMounted, reactive, ref, watch } from "vue";
import Modal from "@/components/ModalDialog.vue";
import type { Scale } from "scale-workshop-core";
import { clamp } from "xen-dev-utils";

import { Output, WebMidi } from "webmidi";

const props = defineProps<{
  newline: string;
  scaleName: string;
  baseMidiNote: number;
  scale: Scale;
}>();

const emit = defineEmits(["confirm", "cancel"]);

const midiOutputs = reactive<Output[]>([]);
const needToAskForMidiPermissions = ref(!WebMidi.enabled);
const midiPermissionsDenied = ref(false);

const sendSysExAlert = ref(String());
const sendSysExAlertIsError = ref(false);
const sendSysExAlertClasses = computed(() => {
  const classes = ["alert-box"];
  if (sendSysExAlertIsError.value) classes.push("alert-danger");
  else classes.push("alert-success");

  return classes.join(" ");
});

function setSendSysexAlert(message: string, isError = false) {
  sendSysExAlert.value = message;
  sendSysExAlertIsError.value = isError;
}

const selectedMidiOutput = ref(undefined as Output | undefined);
watch(selectedMidiOutput, () => {
  setSendSysexAlert("");
});

const isMessageBeingSent = ref(false);

function clampName(name: string): string {
  return name.slice(0, 16);
}

const name = ref(clampName(props.scaleName));

function nameInputCallback(nameInput: string): void {
  name.value = clampName(nameInput);
}

const nameCharsLeft = computed(() => {
  return 16 - name.value.length;
});

const nameCharsLeftClasses = computed(() => {
  const c = ["input", "connected-left"];
  if (nameCharsLeft.value <= 5) c.push("emphasis");
  return c.join(" ");
});

watch(
  () => props.scaleName,
  (newName) => nameInputCallback(newName),
  { immediate: true }
);

function formatPresetIndex(input: string): string {
  const number = parseInt(input.replace(/\D/g, ""));
  if (Number.isNaN(number)) return "0";
  return String(clamp(0, 127, number));
}

const presetIndex = ref("0");

function presetIndexInputCallback(indexInput: string): void {
  presetIndex.value = formatPresetIndex(indexInput);
}

function refreshMidiOutputs() {
  selectedMidiOutput.value = undefined;

  while (midiOutputs.length) {
    midiOutputs.pop();
  }
  WebMidi.outputs.forEach((output) => midiOutputs.push(output));
}

async function onMidiEnabledCallback(requestPermission = true) {
  setSendSysexAlert("");

  if (WebMidi.enabled) {
    if (WebMidi.sysexEnabled) {
      needToAskForMidiPermissions.value = false;
      return;
    } else {
      // console.log("Disabling WebMidi because SysEx is not enabled")
      try {
        await WebMidi.disable();
      } catch (err: any) {
        console.error(err);
        setSendSysexAlert(
          "Error getting MIDI SysEx access. Please report this message.",
          true
        );
      }
    }
  }

  if (!WebMidi.enabled && requestPermission) {
    try {
      await WebMidi.enable({ sysex: true });
    } catch (err: any) {
      console.error(err);
      midiPermissionsDenied.value = true;
      setSendSysexAlert(
        "Permission to access MIDI devices is not granted.", // TODO offer suggestion to fix thi
        true
      );
    }
  }
}

WebMidi.addListener("midiaccessgranted", () => onMidiEnabledCallback(false));

WebMidi.addListener("connected", () => {
  // console.log("connected");
  refreshMidiOutputs();
});
WebMidi.addListener("disconnected", () => {
  // console.log("disconnected");
  refreshMidiOutputs();
});

function getExporterParams() {
  return {
    newline: props.newline,
    scale: props.scale,
    midiOctaveOffset: 0,
    filename: sanitizeFilename(props.scaleName),
    baseMidiNote: props.baseMidiNote,
    name: name.value,
    presetIndex: parseInt(presetIndex.value),
  };
}

function doExportFile() {
  const exporter = new MtsSysexExporter(getExporterParams());
  exporter.saveFile();

  emit("confirm");
}

async function doSendSysEx() {
  if (!WebMidi.enabled)
    throw new Error("doSendSysEx called without WebMIDI enabled!");

  if (
    selectedMidiOutput.value === undefined ||
    selectedMidiOutput.value.connection !== "open"
  ) {
    setSendSysexAlert("Device seems to have been disconnected.", true);
    return;
  }

  setSendSysexAlert("");

  const exporter = new MtsSysexExporter(getExporterParams());
  const message = exporter.buildSysExDump();

  isMessageBeingSent.value = true;

  try {
    selectedMidiOutput.value?.send(message);
    // feedback for something happened, since we don't get an acknowledge
    await new Promise((res: any) => setTimeout(() => res(), 20));
    setSendSysexAlert(
      "Message was sent, please check your device for confirmation."
    );
  } catch (err: any) {
    console.error(err);
    setSendSysexAlert("Error sending message: " + err.message, true);
  } finally {
    isMessageBeingSent.value = false;
  }
}

onMounted(() => {
  if (needToAskForMidiPermissions.value) onMidiEnabledCallback(false);
  else refreshMidiOutputs();
});

function closeDialog() {
  setSendSysexAlert("");
  emit("cancel");
}
</script>

<template>
  <Modal
    id="mts-sysex-modal"
    class="modal-wide"
    @confirm="doExportFile"
    @cancel="closeDialog"
  >
    <template #header>
      <h2>Export MTS Bulk Tuning Dump</h2>
    </template>
    <template #body>
      <div id="modal-body" class="flex-container">
        <div id="file-params">
          <!-- next div makes sure content is treated as an independent column -->
          <div class="control-group">
            <div class="control no-gap">
              <label for="mts-scale-name">Scale Name</label>
              <input
                class="connected-right"
                type="text"
                id="mts-scale-name"
                v-model="name"
                @input="nameInputCallback(name)"
              />
              <input
                id="name-chars-left"
                :class="nameCharsLeftClasses"
                type="text"
                v-model="nameCharsLeft"
                readonly
              />
            </div>
            <div class="control">
              <label for="preset-index">
                Preset Index&nbsp;
                <span
                  @click="$event.preventDefault()"
                  class="info-question"
                  title="Refer to your synth's manual for a valid range"
                >
                </span>
              </label>
              <input
                class="half"
                id="preset-index"
                type="text"
                v-model="presetIndex"
                @input="presetIndexInputCallback(presetIndex)"
              />
            </div>
          </div>
        </div>
        <div id="send-sysex-controls" class="control-group">
          <div class="control">
            <label>Available MIDI Devices:</label>
            <template v-if="needToAskForMidiPermissions">
              <button
                id="device-select-box"
                @click="onMidiEnabledCallback(true)"
                :disabled="midiPermissionsDenied"
              >
                Load MIDI Devices
              </button>
            </template>
            <template v-else-if="midiOutputs.length === 0">
              <span>No devices found.</span>
            </template>
            <template v-else>
              <select
                class="control"
                id="device-select-box"
                v-model="selectedMidiOutput"
              >
                <option
                  v-for="(device, i) in midiOutputs"
                  :key="i"
                  :value="device"
                >
                  {{ device.name }}
                  {{ device.manufacturer ? `(${device.manufacturer})` : "" }}
                </option>
              </select>
            </template>
          </div>
          <div v-if="!needToAskForMidiPermissions" class="control">
            <button
              @click="doSendSysEx"
              :disabled="selectedMidiOutput === undefined || isMessageBeingSent"
            >
              Send SysEx
            </button>
            <!-- <button @click="refreshMidiOutputs">Refresh</button> -->
          </div>
          <div>
            <div
              :class="sendSysExAlertClasses"
              v-if="sendSysExAlert.length > 0"
            >
              <p>
                {{ sendSysExAlert }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="doExportFile">OK</button>
        <button @click="closeDialog">Close</button>
      </div>
    </template>
  </Modal>
</template>

<style>
div.modal-wide > div.modal-wrapper > div.modal-container {
  width: 30rem;
}

input:read-only,
textarea:read-only {
  color: lightgrey;
}

.flex-container {
  display: flex;
  max-width: fit-content;
  column-gap: 1rem;
}
div.flex-container > div {
  justify-content: start;
}
.no-gap {
  column-gap: 0px;
}
.connected-left {
  border-top-left-radius: 0px !important;
  border-bottom-left-radius: 0px !important;
}
.connected-right {
  border-top-right-radius: 0px !important;
  border-bottom-right-radius: 0px !important;
}

/* prevent jarring resizes when alert message changes */
#modal-body {
  height: 14rem;
}

#mts-scale-name {
  max-width: 10rem;
}

#name-chars-left {
  max-width: 2rem;
  text-align: center;
}
#name-chars-left.emphasis {
  font-style: italic;
  font-weight: 600;
  color: brown;
}

#send-sysex-controls {
  max-width: 54%;
}
</style>
