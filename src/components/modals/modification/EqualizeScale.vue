<script setup lang="ts">
import { computed, ref } from "vue";
import Modal from "@/components/ModalDialog.vue";
import { Scale } from "scale-workshop-core";
import { alignCents, misalignment } from "@/analysis";

const props = defineProps<{
  scale: Scale;
  centsFractionDigits: number;
}>();

const emit = defineEmits(["update:scale", "cancel"]);

const divisions = ref(22);

const pitches = computed(() =>
  props.scale.intervals.map((i) => i.totalCents())
);

const gridCents = computed(
  () => props.scale.equave.totalCents() / divisions.value
);

const rootedError = computed(() =>
  misalignment(pitches.value, gridCents.value)
);

const minimax = computed(() => alignCents(pitches.value, gridCents.value));

function modify() {
  emit(
    "update:scale",
    props.scale.approximateEqualTemperament(divisions.value)
  );
}

function modifyMinimax() {
  emit(
    "update:scale",
    Scale.fromEqualTemperamentSubset(
      minimax.value.degrees.slice(1).concat([divisions.value]),
      props.scale.equave
    )
  );
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Equalize</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>
          Divides your equave into an equal number of steps, then rounds each
          interval in your scale to the nearest equal step.
        </p>
        <div class="control">
          <label for="divisions">Number of equal divisions</label>
          <input
            id="divisions"
            type="number"
            min="1"
            class="control"
            v-model="divisions"
          />
        </div>
      </div>
      <p>Rooted error: {{ rootedError.toFixed(centsFractionDigits) }}</p>
      <p>Minimax error: {{ minimax.error.toFixed(centsFractionDigits) }}</p>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="modify">Rooted</button>
        <button @click="modifyMinimax">Minimax</button>
        <button @click="$emit('cancel')">Cancel</button>
      </div>
    </template>
  </Modal>
</template>
