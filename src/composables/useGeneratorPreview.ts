import { watch } from 'vue'
import { evaluateCode } from '@/utils'

/** What a generator card produces: the scale it would create with its current settings. */
export type GeneratorResult = {
  source: string
  name: string
  baseFrequency?: number
  baseMidiNote?: number
  /**
   * The code was computed from the scale the card received (a modifier's stage input), so it is
   * stale once that input changes, until the card is opened again.
   */
  bakesInput?: boolean
}

function sameResult(a: GeneratorResult, b?: GeneratorResult) {
  return (
    !!b &&
    a.source === b.source &&
    a.name === b.name &&
    a.baseFrequency === b.baseFrequency &&
    a.baseMidiNote === b.baseMidiNote &&
    a.bakesInput === b.bakesInput
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
 *
 * A modifier's code only means something after its input, so it passes `input`, the chain's code
 * above it, and the two are run together.
 */
export function useGeneratorPreview(
  build: () => GeneratorResult | undefined,
  emitPreview: (result: GeneratorResult) => void,
  input?: () => string
) {
  let last: GeneratorResult | undefined
  watch(
    () => {
      try {
        const result = build()
        if (!result) {
          return undefined
        }
        const code = input ? `${input()}\n${result.source}` : result.source
        return evaluateCode(code).length ? result : undefined
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
