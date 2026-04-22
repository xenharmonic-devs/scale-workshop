import { API_URL } from '@/constants'
import { useAudioStore } from '@/stores/audio'
import { useCyclesStore } from '@/stores/edo-cycles'
import { useGridStore } from '@/stores/grid'
import { useJiLatticeStore } from '@/stores/ji-lattice'
import { useScaleStore } from '@/stores/scale'
import { useStateStore } from '@/stores/state'
import { useSession, useSessionIdStore } from '@/stores/session-id'
import { makeEnvelope } from '@/utils'
import { computed } from 'vue'

export function useScaleUpload() {
  const { setSessionId, pushSessionId } = useSession()

  const sessionId = useSessionIdStore()
  const state = useStateStore()
  const scale = useScaleStore()
  const audio = useAudioStore()
  const jiLattice = useJiLatticeStore()
  const grid = useGridStore()
  const cycles = useCyclesStore()

  const uploadBody = computed(() => {
    return JSON.stringify({
      id: sessionId.id,
      payload: {
        scale: scale.toJSON(),
        audio: audio.toJSON(),
        state: state.toJSON(),
        'ji-lattice': jiLattice.toJSON(),
        grid: grid.toJSON(),
        'edo-cycles': cycles.toJSON()
      },
      envelope: makeEnvelope(state.shareStatistics)
    })
  })

  // There are too many competing mechanism for uploading the scale
  let inflight: Promise<string> | null = null

  function uploadScale(retries = 1): Promise<string> {
    if (inflight) {
      return inflight
    }
    const uploadId = sessionId.id
    if (sessionId.uploadedId === uploadId) {
      setSessionId(uploadId)
      return Promise.resolve(`${window.location.origin}/scale/${uploadId}`)
    }

    inflight = new Promise((resolve) => {
      if (!API_URL) {
        inflight = null
        return resolve(window.location.origin)
      }
      fetch(new URL('scale', API_URL), { method: 'POST', body: uploadBody.value })
        .then((res) => {
          inflight = null
          if (res.status === 409 && retries > 0) {
            sessionId.rerollId()
            return uploadScale(retries - 1).then(resolve)
          }
          if (res.ok) {
            sessionId.uploadedId = uploadId
            pushSessionId(uploadId, scale.scale.title)
            return resolve(`${window.location.origin}/scale/${uploadId}`)
          }
          return resolve(window.location.origin)
        })
        .catch(() => {
          inflight = null
          resolve(window.location.origin)
        })
    })
    return inflight
  }

  return {
    uploadScale,
    uploadBody
  }
}
