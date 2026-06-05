import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAudioStore } from '../audio'
import { useCyclesStore } from '../edo-cycles'
import { useGridStore } from '../grid'
import { useJiLatticeStore } from '../ji-lattice'

// These tests intentionally access serialized fields directly so type checking catches
// regressions to unhelpful generic store serialization types.
describe('live store serialization types', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes grid serialized fields with concrete types', () => {
    const serialized = useGridStore().toJSON()
    const size: number = serialized.size
    const valString: string = serialized.valString

    expect(size).toBe(0.15)
    expect(valString).toBe('12p')
  })

  it('exposes EDO cycles serialized fields with concrete types', () => {
    const serialized = useCyclesStore().toJSON()
    const generator: number = serialized.generator
    const showLabels: boolean = serialized.showLabels

    expect(generator).toBe(7)
    expect(showLabels).toBe(true)
  })

  it('exposes JI lattice serialized fields with concrete types', () => {
    const serialized = useJiLatticeStore().toJSON()
    const maxDistance: number = serialized.maxDistance
    const horizontalCoordinates: number[] = serialized.horizontalCoordinates

    expect(maxDistance).toBe(1)
    expect(horizontalCoordinates.length).toBeGreaterThan(0)
  })

  it('exposes audio serialized fields with concrete types', () => {
    const serialized = useAudioStore().toJSON()
    const mainVolume: number = serialized.mainVolume
    const synthType: 'none' | 'oscillator' | 'unison' | 'aperiodic' = serialized.synthType

    expect(mainVolume).toBe(0.18)
    expect(synthType).toBe('none')
  })
})
