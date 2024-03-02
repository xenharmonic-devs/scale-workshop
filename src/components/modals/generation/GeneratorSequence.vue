<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import ScaleLineInput from '@/components/ScaleLineInput.vue'
import { arrayToString, debounce, expandCode } from '@/utils'
import { useModalStore } from '@/stores/modal'
import { OCTAVE } from '@/constants';
import { ref, watch } from 'vue';

const emit = defineEmits(['update:source', 'update:scaleName', 'cancel'])

const modal = useModalStore()

const generatorsElement = ref<HTMLInputElement | null>(null)
watch(
  () => modal.generatorsError,
  (newError) => generatorsElement.value!.setCustomValidity(newError)
)

const presets = {
  zarlino: {name: 'Zarlino', generators: '5/4, 6/5', size: 7},
  diasem: {name: 'Tas/Diasem', generators: '7/6, 8/7', size: 9},
  zil: {name: 'Zil', generators: '8/7, 7/6, 8/7, 7/6, 8/7, 7/6, 8/7, 189/160, 8/7, 7/6', size: 14},
  porcusmine: {name: 'Porcusmine', generators: '9/5, 50/27', size: 8},
  mavila: {name: 'Mavila detemper', generators: '3/2, 3/2, 64/45', size: 9},
  rhombi: {name: 'Rhombi', generators: '14/9, 11/7, 52/33, 81/52', size: 14},
  dwyn: {name: 'Dwyn', generators: '25/24, 21/20, 22/21, 23/22, 24/23, 21/20, 22/21, 23/22, 24/23', size: 16},
  magic: {name: 'Magic detemper', generators: '16/13, 20/16, 25/20, 31/25, 39/31', size: 10},
  porcupine: {name: 'Porcupine detemper', generators: '10/9, 11/10, 12/11', size: 7},
  bleu: {name: 'Bleu detemper', generators: '24/22, 26/24, 28/26, 31/28, 33/31', size: 9},
  machine: {name: 'Machine detemper', generators: '8/7, 9/8, 112/99, 9/8', size: 11},
  slendric: {name: 'Slendric detemper', generators: '8/7, 147/128, 8/7', size: 6},
};

const selectedPreset = ref<keyof typeof presets | ''>('');

const updateCS = debounce(() => modal.computeConstantStructureSizes(20))

const moreCS = debounce(() => modal.computeConstantStructureSizes(modal.maxSizeComputed + 15))

watch(selectedPreset, newValue => {
  if (!newValue) {
    return;
  }
  const preset = presets[newValue];
  modal.generatorsString = preset.generators;
  modal.size = preset.size;
  modal.periodString = '2/1';
  modal.period = OCTAVE;
  modal.numPeriods = 1;
  updateCS();
});

function generate(expand = true) {
  let name = `Generator sequence ${modal.generatorsString}`
  let source = `gs(${arrayToString(modal.generators)}, ${modal.size}`
  if (!modal.period.equals(OCTAVE) || modal.numPeriods !== 1) {
    name += ` over ${modal.periodString}`
    source += `, ${modal.period.toString()}, ${modal.numPeriods}`
  }
  source += ')'
  emit('update:scaleName', name)
  if (expand) {
    emit('update:source', expandCode(source))
  } else {
    emit('update:source', source)
  }
}
</script>

<template>
  <Modal @confirm="generate" @cancel="$emit('cancel')">
    <template #header>
      <h2>Generator sequence</h2>
    </template>
    <template #body>
      <div class="control-group">
        <div class="control">
          <label for="generators">Generators</label>
          <input
            ref="generatorsElement"
            id="generators"
            type="text"
            class="control"
            placeholder="5/4, 6/5"
            v-model="modal.generatorsString"
            @input="updateCS"
          />
        </div>
        <div class="control">
          <label for="size">Scale size</label>
          <input id="size" type="number" :min="modal.numPeriods" max="999" :step="modal.numPeriods" v-model="modal.size">
        </div>
        <label>Sizes of constant structure</label>
        <div class="btn-group">
          <button
            v-for="size of modal.constantStructureSizes"
            :key="size"
            @click="modal.size = size"
          >
            {{ size }}
          </button>
          <button v-if="modal.generators.length" @click="moreCS">More ({{ modal.maxSizeComputed * modal.numPeriods }}+)</button>
          <button v-else disabled>(No generators)</button>
        </div>
        <div class="control">
          <label for="preset">Presets</label>
          <select v-model="selectedPreset">
            <option value="">--Select preset--</option>
            <option v-for="(preset, key) of presets" :key="key" :value="key">{{ preset.name }}</option>
          </select>
        </div>
        <div class="control">
          <label for="period">Period</label>
          <ScaleLineInput
            id="period"
            placeholder="2/1"
            v-model="modal.periodString"
            @update:value="modal.period = $event"
            @input="updateCS"
            :defaultValue="OCTAVE"
          />
        </div>
        <div class="control">
            <label for="num-periods">Number of periods</label>
            <input id="num-periods" type="number" min="1" max="99" v-model="modal.numPeriods" @input="updateCS" />
          </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="() => generate(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="() => generate(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>
