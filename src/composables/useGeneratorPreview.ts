import { watch } from 'vue'
import { evaluateCode } from '@/utils'

/** What a generator card produces: the scale it would create with its current settings. */
export type GeneratorResult = {
  source: string
  name: string
  baseFrequency?: number
  baseMidiNote?: number
}

function sameResult(a: GeneratorResult, b?: GeneratorResult) {
  return (
    !!b &&
    a.source === b.source &&
    a.name === b.name &&
    a.baseFrequency === b.baseFrequency &&
    a.baseMidiNote === b.baseMidiNote
  )
}

/**
 * Live preview for a generator card: calls `emitPreview` when the card opens and whenever the
 * reactive state read by `build` changes.
 *
 * `build` returns the card's readable (unexpanded) code, or `undefined` while the settings are
 * mid-edit and don't describe a scale yet. The code is run once here, and results that throw or
 * produce no notes are skipped too, so the scale keeps the last good result instead of filling
 * with errors (or falling back to 12-TET) while typing.
 */
export function useGeneratorPreview(
  build: () => GeneratorResult | undefined,
  emitPreview: (result: GeneratorResult) => void
) {
  let last: GeneratorResult | undefined
  watch(
    () => {
      try {
        const result = build()
        return result && evaluateCode(result.source).length ? result : undefined
      } catch {
        return undefined
      }
    },
    (next) => {
      if (!next || sameResult(next, last)) {
        return
      }
      last = next
      emitPreview(next)
    },
    { immediate: true }
  )
}
