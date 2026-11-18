import { onBeforeUnmount } from 'vue'
import { useScaleStore } from '@/stores/scale'
import type { GeneratorResult } from '@/composables/useGeneratorPreview'

type Snapshot = {
  sourceText: string
  name: string
  userBaseFrequency: number
  autoFrequency: boolean
  baseMidiNote: number
}

/**
 * Live preview of a generator card's result in the scale itself.
 *
 * `preview()` writes a candidate result into the scale and recomputes it without pushing an undo
 * step, coalescing rapid updates (slider drags, typing) to one recompute per animation frame.
 * The first preview remembers the scale as it was, so that:
 *
 * - `commit()` forgets the snapshot. The caller then applies the final source with a regular
 *   `computeScale()`, which pushes a single undo step back to the remembered scale.
 * - `revert()` restores the remembered scale (Cancel, or switching to another card).
 */
export function useLivePreview() {
  const scale = useScaleStore()

  let snapshot: Snapshot | null = null
  let pending: GeneratorResult | null = null
  let frame = 0

  function apply() {
    frame = 0
    if (!pending) {
      return
    }
    const { source, name, baseFrequency, baseMidiNote } = pending
    pending = null
    scale.name = name
    scale.sourceText = source
    if (baseFrequency !== undefined) {
      scale.userBaseFrequency = baseFrequency
      scale.autoFrequency = false
    }
    if (baseMidiNote !== undefined) {
      scale.baseMidiNote = baseMidiNote
    }
    scale.computeScale(false)
  }

  function cancelFrame() {
    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
    pending = null
  }

  function preview(result: GeneratorResult) {
    if (!snapshot) {
      snapshot = {
        sourceText: scale.sourceText,
        name: scale.name,
        userBaseFrequency: scale.userBaseFrequency,
        autoFrequency: scale.autoFrequency,
        baseMidiNote: scale.baseMidiNote
      }
    }
    pending = result
    if (!frame) {
      frame = requestAnimationFrame(apply)
    }
  }

  function commit() {
    cancelFrame()
    snapshot = null
  }

  function revert() {
    cancelFrame()
    if (!snapshot) {
      return
    }
    scale.name = snapshot.name
    scale.sourceText = snapshot.sourceText
    scale.userBaseFrequency = snapshot.userBaseFrequency
    scale.autoFrequency = snapshot.autoFrequency
    scale.baseMidiNote = snapshot.baseMidiNote
    snapshot = null
    scale.computeScale(false)
  }

  onBeforeUnmount(cancelFrame)

  return { preview, commit, revert }
}
