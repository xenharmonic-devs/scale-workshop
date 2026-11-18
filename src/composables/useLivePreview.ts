import { onBeforeUnmount } from 'vue'
import { useScaleStore } from '@/stores/scale'

type Snapshot = { sourceText: string; name: string }

/**
 * Live preview of a generator card's result in the scale itself.
 *
 * `preview()` writes a candidate source and name into the scale and recomputes it without
 * pushing an undo step, coalescing rapid updates (slider drags) to one recompute per animation
 * frame. The first preview remembers the scale as it was, so that:
 *
 * - `commit()` forgets the snapshot. The caller then applies the final source with a regular
 *   `computeScale()`, which pushes a single undo step back to the remembered scale.
 * - `revert()` restores the remembered scale (Cancel).
 */
export function useLivePreview() {
  const scale = useScaleStore()

  let snapshot: Snapshot | null = null
  let pending: Snapshot | null = null
  let frame = 0

  function apply() {
    frame = 0
    if (!pending) {
      return
    }
    scale.name = pending.name
    scale.sourceText = pending.sourceText
    pending = null
    scale.computeScale(false)
  }

  function cancelFrame() {
    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
    pending = null
  }

  function preview(sourceText: string, name: string) {
    if (!snapshot) {
      snapshot = { sourceText: scale.sourceText, name: scale.name }
    }
    pending = { sourceText, name }
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
    snapshot = null
    scale.computeScale(false)
  }

  onBeforeUnmount(cancelFrame)

  return { preview, commit, revert }
}
