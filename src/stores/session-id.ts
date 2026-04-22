import { ref, getCurrentInstance } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import { DUMMY_ID } from '@/constants'
import { isRandomId, randomId } from '@/utils'

type SessionEntry = {
  id: string
  title: string
  msSince1970: number
}

export const SESSION_KEY = 'ScaleWorkshopSessions'
export const MAX_SESSIONS = 20

/**
 * Create a session hash for the router.
 */
export function makeSessionHash(id: string) {
  if (id === DUMMY_ID) {
    return undefined
  }
  return '#id=' + id
}

/**
 * Get the identifier of a previous session (a pinned browser tab) if one exists.
 */
export function getSessionId() {
  let id = ''
  if (window.location.hash.startsWith('#id=')) {
    id = window.location.hash.slice(4)
  }
  if (isRandomId(id)) {
    return id
  }
  return null
}

/**
 * Composables for synchronizing location hash with the uploaded identifier.
 */
export function useSession() {
  // The router interactions during test time are super annoying to deal with so we don't.
  const router = getCurrentInstance() ? useRouter() : undefined

  /**
   * Set session without making new entries.
   */
  function setSessionId(id: string) {
    if (id === DUMMY_ID) {
      return false
    }
    router?.replace({ hash: makeSessionHash(id) })
    return true
  }

  /**
   * Invalidate current session.
   */
  function clearSessionId() {
    router?.replace({ hash: '#' })
  }

  /**
   * Remember current state and update browser tab so that it can be pinned.
   */
  function pushSessionId(id: string, title: string) {
    if (!setSessionId(id)) {
      return
    }
    let entries: SessionEntry[] = []
    try {
      entries = JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? '[]')
      if (!Array.isArray(entries)) {
        entries = []
      }
    } catch {
      // Sorry for your lost work.
    }
    entries.unshift({ id, title, msSince1970: new Date().valueOf() })
    while (entries.length > MAX_SESSIONS) {
      entries.pop()
    }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(entries))
  }

  return {
    clearSessionId,
    setSessionId,
    pushSessionId
  }
}

/**
 * Store for the session identifier used to upload and retrieve data from sw-server.
 *
 * Couples to every store that serializes data.
 */
export const useSessionIdStore = defineStore('session-id', () => {
  const loading = ref(false)
  const id = ref('000000000')
  const uploadedId = ref('000000000')

  const { clearSessionId } = useSession()

  function rerollId() {
    id.value = randomId()
  }

  function invalidateUploadedId() {
    if (loading.value) {
      return
    }
    if (uploadedId.value === id.value) {
      rerollId()
      clearSessionId()
    }
  }

  return {
    loading,
    id,
    uploadedId,
    rerollId,
    invalidateUploadedId
  }
})
