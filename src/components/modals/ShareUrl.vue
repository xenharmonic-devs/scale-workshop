<script setup lang="ts">
import { nextTick, ref } from 'vue'
import Modal from '@/components/ModalDialog.vue'

const props = defineProps<{
  scaleName: string
  newline: string
}>()

const emit = defineEmits(['confirm', 'cancel'])
defineExpose({ initialize })

// This ref is for display purposes only.
// The methods use location directly.
const url = ref(window.location.href)
const urlInput = ref<HTMLInputElement | null>(null)

function initialize() {
  url.value = window.location.href
  nextTick(() => {
    if (urlInput.value !== null) {
      urlInput.value.select()
      urlInput.value.setSelectionRange(0, 99999)
    }
  })
}

function copyToClipboard() {
  window.navigator.clipboard.writeText(window.location.href)
  emit('confirm')
}

function email() {
  const recipient = ''
  const subject = encodeURIComponent(`Scale Workshop - ${props.scaleName}`)
  const bodyLines = [
    'Sending you this musical scale:',
    props.scaleName,
    '',
    'The link below has more info:',
    '',
    window.location.href
  ]
  const body = encodeURIComponent(bodyLines.join(props.newline))
  window.open(`mailto:${recipient}?subject=${subject}&body=${body}`)
}

function tweet() {
  const text = encodeURIComponent(props.scaleName + ' ♫ ' + window.location.href)
  window.open(`https://twitter.com/intent/tweet?text=${text}`)
}

function postOnFacebook() {
  let link: string
  // Sharing a local URL won't work because Facebook screens the URL it receives.
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    link = encodeURIComponent('https://sevish.com/scaleworkshop/')
  } else {
    link = encodeURIComponent(window.location.href)
  }
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${link}`)
}
</script>

<template>
  <Modal @confirm="copyToClipboard" @cancel="$emit('cancel')">
    <template #header>
      <h2>Share scale as URL</h2>
    </template>
    <template #body>
      <div class="control-group">
        <p>This sharing link allows others to try your scale.</p>
        <textarea
          ref="urlInput"
          class="control"
          style="resize: vertical"
          rows="6"
          readonly
          v-model="url"
        ></textarea>
        <div class="control">
          <button @click="email">Email</button>
          <button href="#" @click="tweet">Twitter</button>
          <button href="#" @click="postOnFacebook">Facebook</button>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="copyToClipboard">Copy URL</button>
        <button @click="$emit('cancel')">Cancel</button>
      </div>
    </template>
  </Modal>
</template>
