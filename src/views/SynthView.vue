<script setup lang="ts">
defineProps<{
  equaveShift: number;
  isomorphicHorizontal: number;
  isomorphicVertical: number;
}>();

const emit = defineEmits([
  "update:equaveShift",
  "update:isomorphicHorizontal",
  "update:isomorphicVertical",
]);

function updateIsomorphicVertical(event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value);
  if (!isNaN(value)) {
    emit("update:isomorphicVertical", value);
  }
}

function updateIsomorphicHorizontal(event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value);
  if (!isNaN(value)) {
    emit("update:isomorphicHorizontal", value);
  }
}

function updateEquaveShift(event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value);
  if (!isNaN(value)) {
    emit("update:equaveShift", value);
  }
}
</script>

<template>
  <main>
    <div class="columns-container">
      <div class="column synth-controls">
        <h1>Synth</h1>
        <i>Coming soon to a browser near you...</i>
      </div>
      <div class="column keyboard-controls">
        <h1>Keyboard</h1>
        <h2>Isomorphic key mapping</h2>
        <p>
          Distance (in scale degrees) between adjacent keys on the
          horizontal/vertical axes.
        </p>
        <div class="control-group">
          <div class="control">
            <label for="vertical">Vertical</label>
            <input
              type="number"
              id="vertical"
              :value="isomorphicVertical"
              @input="updateIsomorphicVertical"
            />
          </div>
          <div class="control">
            <label for="horizontal">Horizontal</label>
            <input
              type="number"
              id="horizontal"
              :value="isomorphicHorizontal"
              @input="updateIsomorphicHorizontal"
            />
          </div>
        </div>
        <h2>Octave/equave shift</h2>
        <p>
          Trigger lower/higher notes. Also mapped to numpad division " / " and
          multiply " * ".
        </p>
        <div class="control-group">
          <div class="control">
            <input
              type="number"
              :value="equaveShift"
              @input="updateEquaveShift"
            />
          </div>
        </div>
        <p>"Shift" key toggles sustain for individual keys.</p>
        <p>The key left of digit "1" releases sustain.</p>
        <i>These settings affect both typing and virtual keyboards.</i>
      </div>
    </div>
  </main>
</template>

<style scoped>
div.columns-container {
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-border);
  column-count: 2;
  column-gap: 1px;
}
div.column {
  background-color: var(--color-background);
  overflow-x: hidden;
  height: 100%;
}
div.synth-controls {
  padding: 1rem;
}
div.keyboard-controls {
  padding: 1rem;
}

/* TODO: media queries left for a later UI pass */
</style>
