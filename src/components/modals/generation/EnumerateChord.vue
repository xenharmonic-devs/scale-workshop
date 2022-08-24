<script setup lang="ts">
import { ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
import { parseChordInput } from "@/parser";
import Scale from "@/scale";

const emit = defineEmits(["update:scale", "update:scaleName", "cancel"]);

const chord = ref("");
const invertChord = ref(false);

function generate() {
  try {
    const intervals = parseChordInput(chord.value);
    const scale = Scale.fromChord(intervals);
    emit("update:scaleName", `Chord ${chord.value}`);
    if (invertChord.value) {
      emit("update:scale", scale.invert());
    } else {
      emit("update:scale", scale);
    }
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    } else {
      alert(error);
    }
  }
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Enumerate chord</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="chord">Chord</label>
          <input
            id="chord"
            type="text"
            class="control"
            placeholder="4:5:6:8"
            v-model="chord"
          />
        </div>
        <div class="control checkbox-container">
          <input type="checkbox" id="integrate-period" v-model="invertChord" />
          <label for="integrate-period">Invert chord</label>
        </div>
      </div>
    </template>
  </Modal>
</template>
