import { computed, inject, type ComputedRef, type InjectionKey } from 'vue'
import type { Interval } from 'sonic-weave/interval'
import type { Scale } from '@/scale'
import { useScaleStore } from '@/stores/scale'

/**
 * The scale a modifier card works on: the rack's chain evaluated up to (not including) that
 * card. A card reads its degrees, labels and sizes from here instead of the final scale.
 */
export type StageInput = {
  /** The SonicWeave of the chain before this card. A modifier's code is appended to it. */
  code: string
  scale: Scale
  labels: string[]
  relativeIntervals: Interval[]
}

export const STAGE_INPUT: InjectionKey<ComputedRef<StageInput>> = Symbol('stage-input')

/** The open card's stage input, or the whole scale outside the rack. */
export function useStageInput(): ComputedRef<StageInput> {
  const injected = inject(STAGE_INPUT, null)
  if (injected) {
    return injected
  }
  const scale = useScaleStore()
  return computed(() => ({
    code: scale.sourceText,
    scale: scale.scale,
    labels: scale.labels,
    relativeIntervals: scale.relativeIntervals
  }))
}
