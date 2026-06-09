<script setup lang="ts">
const equaveKeys = ['2', '3', '4', '5', '9/2', '7/2', '5/2', '3/2', '8/3', '7/3', '5/3']
</script>

<template>
  <div class="control-group">
    <div class="control radio-group">
      <label>Equave</label>
      <span v-for="equaveKey of equaveKeys" :key="equaveKey">
        <input :id="`strict-variety-3-ji-equave-${equaveKey}`" type="radio" :value="equaveKey" />
        <label :for="`strict-variety-3-ji-equave-${equaveKey}`">{{ equaveKey }}</label>
      </span>
    </div>
  </div>

  <div class="control-group">
    <div class="control">
      <label for="strict-variety-3-ji-steps">Steps</label>
      <select id="strict-variety-3-ji-steps">
        <option>Loading...</option>
      </select>
    </div>
  </div>

  <div class="control-group">
    <div class="control checkbox-container">
      <input id="strict-variety-3-ji-invert" type="checkbox" disabled />
      <label for="strict-variety-3-ji-invert" class="disabled"> Invert chiral scale </label>
    </div>
    <div class="control">
      <label for="strict-variety-3-ji-mode">Mode</label>
      <select id="strict-variety-3-ji-mode">
        <option>Loading...</option>
      </select>
    </div>
  </div>

  <div class="control-group">
    <div class="control">
      <label for="strict-variety-3-ji-step-sizes">Step sizes</label>
      <select id="strict-variety-3-ji-step-sizes">
        <option>Loading...</option>
      </select>
    </div>
  </div>
</template>
