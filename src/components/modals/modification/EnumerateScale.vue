<script setup lang="ts">
import Modal from '@/components/ModalDialog.vue'
import { useScaleStore } from '@/stores/scale'

const emit = defineEmits(['done', 'cancel'])

const scale = useScaleStore()

function overtonal() {
  scale.sourceText += ';elevate();simplify;repr'
  const { visitor, defaults } = scale.getVisitors()
  const overtones = visitor.mutables.get('$') as unknown as string[]
  visitor.mutables.set('$', [])
  scale.sourceText = visitor.expand(defaults)
  if (scale.sourceText) {
    scale.sourceText += '\n'
  }
  scale.sourceText += overtones.join(':')
  scale.computeScale()
  emit('done')
}

function undertonal() {
  scale.sourceText += ';reflect();elevate();simplify;repr'
  const { visitor, defaults } = scale.getVisitors()
  const undertones = visitor.mutables.get('$') as unknown as string[]
  visitor.mutables.set('$', [])
  scale.sourceText = visitor.expand(defaults)
  if (scale.sourceText) {
    scale.sourceText += '\n'
  }
  scale.sourceText += '/' + undertones.join(':')
  scale.computeScale()
  emit('done')
}

function retroversion() {
  scale.sourceText += ';retrovert();elevate();simplify;repr'
  const { visitor, defaults } = scale.getVisitors()
  const tones = visitor.mutables.get('$') as unknown as string[]
  visitor.mutables.set('$', [])
  scale.sourceText = visitor.expand(defaults)
  if (scale.sourceText) {
    scale.sourceText += '\n'
  }
  scale.sourceText += 'retroverted(' + tones.join(':') + ')'
  scale.computeScale()
  emit('done')
}

function revposition() {
  scale.sourceText += ';revpose();elevate();simplify;repr'
  const { visitor, defaults } = scale.getVisitors()
  const tones = visitor.mutables.get('$') as unknown as string[]
  visitor.mutables.set('$', [])
  scale.sourceText = visitor.expand(defaults)
  if (scale.sourceText) {
    scale.sourceText += '\n'
  }
  scale.sourceText += 'revposed(' + tones.join(':') + ')'
  scale.computeScale()
  emit('done')
}
</script>

<template>
  <Modal @confirm="$emit('done')" @cancel="$emit('cancel')">
    <template #header>
      <h2>Enumerate</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>Convert your scale to an enumeration.</p>
        <button @click="overtonal">Overtonal</button>
        <button @click="undertonal">Undertonal</button>
        <button @click="retroversion">Retroversion</button>
        <button @click="revposition">Reversed overtonal</button>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="$emit('cancel')">Cancel</button>
      </div>
    </template>
  </Modal>
</template>
