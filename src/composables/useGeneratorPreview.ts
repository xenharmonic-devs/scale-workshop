import { watch } from 'vue'

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
 * `build` returns `undefined` (or throws) while the settings are mid-edit and don't describe a
 * scale yet, e.g. a half-typed interval. Those are skipped so the scale keeps the last good
 * preview instead of filling with errors while typing.
 */
export function useGeneratorPreview(
  build: () => GeneratorResult | undefined,
  emitPreview: (result: GeneratorResult) => void
) {
  let last: GeneratorResult | undefined
  watch(
    () => {
      try {
        return build()
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
