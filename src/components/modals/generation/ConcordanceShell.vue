<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { OCTAVE } from '@/constants'
import { useModalStore } from '@/stores/modal'
import { expandCode } from '@/utils';
import { linear } from 'sonic-weave';
import { mmod } from 'xen-dev-utils';

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

const modal = useModalStore()

function generate(shell = true, expand = true) {
  const selectedVao = modal.vaos[modal.vaoIndex];
  let source = '';
  if (shell) {
    const data: [number, string][] = []
    collecting: for (let i = 0; i < selectedVao.degrees.length; ++i) {
      const harmonic = selectedVao.harmonics[i];
      const degree = selectedVao.degrees[i];
      const reducedDegree = mmod(degree, modal.largeDivisions) || modal.largeDivisions;
      for (let j = 0; j < data.length; ++j) {
        if (data[j][0] === reducedDegree) {
          data[j][1] += ' & ' + harmonic.toString();
          continue collecting;
        }
      }
      data.push([reducedDegree, harmonic.toString()])
    }
    data.sort((a, b) => a[0] - b[0]);
    if (!data.length || data[data.length - 1][0] !== modal.largeDivisions) {
      data.push([modal.largeDivisions, ''])
    }
    let postfix = `\\${modal.largeDivisions}`
    if (modal.equave.compare(OCTAVE)) {
      postfix += `<${linear(modal.equave).toString()}>`
    }
    for (const [degree, label] of data) {
      source += `${degree}${postfix} "${label}"\n`
    }
  } else {
    source = selectedVao.harmonics.join(':')
  }
  if (expand) {
    source = expandCode(source)
  }
  emit('update:scaleName', `VAO ${selectedVao.harmonics.join(':')}`)
  emit('update:source', source)
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generate VAO / concordance shell</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="denominator">Denominator</label>
          <input
            id="denominator"
            type="number"
            min="1"
            class="control"
            v-model="modal.mediumInteger"
          />
        </div>
        <div class="control">
          <label for="maximum-numerator">Maximum numerator</label>
          <input
            id="maximum-numerator"
            type="number"
            :min="modal.mediumInteger"
            class="control"
            v-model="modal.largeInteger"
          />
        </div>
        <div class="control">
          <label for="divisions">Number of equal divisions</label>
          <input
            id="divisions"
            type="number"
            min="1"
            class="control"
            v-model="modal.largeDivisions"
          />
        </div>
        <div class="control">
          <label for="tolerance">Tolerance in cents</label>
          <input
            id="tolerance"
            type="number"
            min="0"
            step="0.5"
            class="control"
            v-model="modal.tolerance"
          />
        </div>
        <div class="control">
          <label for="equave">Equave</label>
          <ScaleLineInput
            id="equave"
            @update:value="modal.equave = $event"
            v-model="modal.equaveString"
            :defaultValue="OCTAVE"
          />
        </div>
        <!-- Disabled to protect the innocent. Please fix analysis.freeVAOs
          <div class="control radio-group">
            <label>Error model</label>
            <span>
              <input type="radio" id="error-rooted" value="rooted" v-model="modal.errorModel"/>
              <label for="error-rooted"> Rooted </label>
            </span>
            <span>
              <input type="radio" id="error-free" value="free" v-model="modal.errorModel"/>
              <label for="error-free"> Free </label>
            </span>
          </div>
        -->
        <div class="control">
          <label for="vao">Vertically aligned object</label>
          <select id="vao" v-model="modal.vaoIndex">
            <option v-for="vao, i of modal.vaos" :key="i" :value="i">{{ vao.harmonics.join(':') }}</option>
          </select>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="() => generate(false, true)">VAO</button>
        <button @click="() => generate(true, true)">Shell</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="() => generate(false, false)">Raw VAO</button>
      </div>
    </template>
  </Modal>
</template>
