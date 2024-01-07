<script setup lang="ts">
import { useScaleStore } from '@/stores/scale';
import { debounce } from '@/utils';
import { ref } from 'vue';
import ScaleRule from './ScaleRule.vue';

const scale = useScaleStore()

const updateScale = debounce(scale.computeScale)

const sourceEditor = ref<HTMLTextAreaElement | null>(null)

function insertFromPalette(event: Event) {
  if (!sourceEditor.value) {
    return
  }
  const character = (event.target as HTMLButtonElement).textContent;
  const start = sourceEditor.value.selectionStart;
  const end = sourceEditor.value.selectionEnd;
  scale.sourceText = scale.sourceText.substring(0, start) + character + scale.sourceText.substring(end, scale.sourceText.length)
}

function focus() {
  if (!sourceEditor.value) {
    return
  }
  sourceEditor.value.focus()
}

defineExpose({focus})

</script>

<template>
  <div class="control-group">
    <div class="control">
      <label for="base-midi-note">MIDI note for base frequency</label>
      <input id="base-midi-note" type="number" step="1" v-model="scale.baseMidiNote" @input="updateScale"/>
    </div>
    <div class="control">
      <label for="enharmonic">Pythagorean enharmonic</label>
      <select id="enharmonic" v-model="scale.enharmonic" @input="updateScale">
        <option v-for="e of scale.enharmonics" :key="e" :value="e">{{ e }}</option>
      </select>
    </div>

    <div class="control">
      <label for="base-frequency">Base frequency</label>
      <input id="base-frequency" type="number" step="any" v-model="scale.baseFrequency" :disabled="scale.autoFrequency" @input="updateScale">
    </div>
    <div class="control checkbox-container">
      <input id="auto-frequency" type="checkbox" v-model="scale.autoFrequency" @input="updateScale"/><label
        for="auto-frequency"
        >Automatic base frequency</label
      >
    </div>
  </div>

  <div class="control-group">
    <h2>Scale data</h2>
    <div class="control">
      <textarea ref="sourceEditor" rows="20" v-model="scale.sourceText" @input="updateScale"></textarea>
    </div>
    <ScaleRule :scale="scale.scale" />
    <p class="error">{{ scale.error }}</p>
    <h3>Character palette</h3>
    <div class="control">
      <button @click="insertFromPalette">♮</button>
      <button @click="insertFromPalette">♯</button>
      <button @click="insertFromPalette">♭</button>
      <button @click="insertFromPalette">𝄪</button>
      <button @click="insertFromPalette">𝄫</button>
      <button @click="insertFromPalette">𝄲</button>
      <button @click="insertFromPalette">‡</button>
      <button @click="insertFromPalette">𝄳</button>
      <button @click="insertFromPalette">½</button>
      <button @click="insertFromPalette">¼</button>
      <button @click="insertFromPalette">¾</button>

      <button @click="insertFromPalette">×</button>
      <button @click="insertFromPalette">÷</button>
      <button @click="insertFromPalette">⊗</button>

      <button @click="insertFromPalette">α</button>
      <button @click="insertFromPalette">β</button>
      <button @click="insertFromPalette">γ</button>
      <button @click="insertFromPalette">δ</button>
      <button @click="insertFromPalette">ε</button>
      <button @click="insertFromPalette">ζ</button>
      <button @click="insertFromPalette">η</button>
      <button @click="insertFromPalette">φ</button>
      <button @click="insertFromPalette">χ</button>
      <button @click="insertFromPalette">ψ</button>
      <button @click="insertFromPalette">ω</button>

      <button @click="insertFromPalette">€</button>
      <button @click="insertFromPalette">µ</button>
    </div>
  </div>
</template>
