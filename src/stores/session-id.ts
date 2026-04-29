import { ref } from 'vue'
import { defineStore } from 'pinia'
import { randomId } from '@/utils'

/**
 * Store for the session identifier used to upload and retrieve data from sw-server.
 *
 * Couples to every store that serializes data.
 */
export const useSessionIdStore = defineStore('session-id', () => {
  const id = ref('000000000')
  const uploadedId = ref('000000000')

  function rerollId() {
    id.value = randomId()
  }

  function invalidateUploadedId() {
    if (uploadedId.value === id.value) {
      rerollId()
    }
  }

  return {
    id,
    uploadedId,
    rerollId,
    invalidateUploadedId
  }
})
