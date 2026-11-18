import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useRackStore } from '@/stores/rack'
import { useScaleStore } from '@/stores/scale'
import { useModalStore } from '@/stores/modal'
import { useSessionIdStore } from '@/stores/session-id'

let frames: FrameRequestCallback[] = []

/** Lets the rack's watchers run, then its pending frame, then any undo step it schedules. */
async function settle() {
  await nextTick()
  const pending = frames
  frames = []
  pending.forEach((callback) => callback(0))
  vi.runAllTimers()
}

function setup() {
  const scale = useScaleStore()
  const rack = useRackStore()
  return { scale, rack, modal: useModalStore() }
}

beforeEach(() => {
  setActivePinia(createPinia())
  useSessionIdStore().loading = true
  frames = []
  vi.useFakeTimers()
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = []
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Build Scale rack', () => {
  it('starts empty and writes nothing until a new card has produced code', async () => {
    const { scale, rack } = setup()
    expect(rack.generator).toBeNull()

    rack.setGenerator('equal-temperament')
    await settle()
    expect(rack.openId).toBe(rack.generator!.id)
    expect(scale.sourceText).toBe('')
  })

  it("writes the generator's code and name into the scale", async () => {
    const { scale, rack } = setup()
    rack.setGenerator('equal-temperament')
    rack.updateGenerator(rack.generator!.id, { source: 'tet(7)', name: '7 equal divisions' })
    await settle()

    expect(scale.sourceText).toBe('tet(7)')
    expect(scale.name).toBe('7 equal divisions')
    expect(scale.relativeIntervals).toHaveLength(7)
  })

  it('applies a generator base frequency and MIDI note', async () => {
    const { scale, rack } = setup()
    rack.setGenerator('preset')
    rack.updateGenerator(rack.generator!.id, {
      source: 'tet(5)',
      name: 'five',
      baseFrequency: 300,
      baseMidiNote: 62
    })
    await settle()

    expect(scale.autoFrequency).toBe(false)
    expect(scale.userBaseFrequency).toBe(300)
    expect(scale.baseMidiNote).toBe(62)
  })

  it('coalesces rapid updates into one recompute', async () => {
    const { scale, rack } = setup()
    rack.setGenerator('equal-temperament')
    const id = rack.generator!.id
    const computeScale = vi.spyOn(scale, 'computeScale')
    rack.updateGenerator(id, { source: 'tet(5)', name: 'five' })
    rack.updateGenerator(id, { source: 'tet(6)', name: 'six' })
    rack.updateGenerator(id, { source: 'tet(7)', name: 'seven' })
    await settle()

    expect(computeScale).toHaveBeenCalledTimes(1)
    expect(scale.sourceText).toBe('tet(7)')
  })

  it('ignores results from a card that is no longer in the rack', async () => {
    const { scale, rack } = setup()
    rack.setGenerator('equal-temperament')
    const old = rack.generator!.id
    rack.setGenerator('harmonic-series')
    rack.updateGenerator(old, { source: 'tet(5)', name: 'five' })
    await settle()

    expect(scale.sourceText).toBe('')
  })

  it('adopts scale data written from outside as an imported scale', async () => {
    const { scale, rack } = setup()
    scale.name = 'Imported thing'
    scale.sourceText = '9/8\n5/4\n2'
    scale.computeScale()
    await settle()

    expect(rack.generator?.kind).toBe('imported')
    expect(rack.generator?.code).toBe('9/8\n5/4\n2')
    expect(rack.generator?.name).toBe('Imported thing')
    expect(scale.sourceText).toBe('9/8\n5/4\n2')
  })

  it('clears the scale when the generator is removed', async () => {
    const { scale, rack } = setup()
    rack.setGenerator('equal-temperament')
    rack.updateGenerator(rack.generator!.id, { source: 'tet(7)', name: 'seven' })
    await settle()
    rack.removeGenerator()
    await settle()

    expect(rack.generator).toBeNull()
    expect(scale.sourceText).toBe('')
    expect(scale.name).toBe('')
  })

  it('undoes and redoes generator edits and switches, card and settings included', async () => {
    const { scale, rack, modal } = setup()
    modal.divisions = 5
    rack.setGenerator('equal-temperament')
    rack.updateGenerator(rack.generator!.id, { source: 'tet(5)', name: 'five' })
    await settle()

    modal.divisions = 6
    rack.updateGenerator(rack.generator!.id, { source: 'tet(6)', name: 'six' })
    await settle()

    rack.setGenerator('harmonic-series')
    rack.updateGenerator(rack.generator!.id, { source: '8::16', name: 'Harmonics 8-16' })
    await settle()

    scale.history.undo()
    await settle()
    expect(scale.sourceText).toBe('tet(6)')
    expect(rack.generator?.kind).toBe('equal-temperament')
    expect(scale.name).toBe('six')
    // The card is open again with the settings it had.
    expect(rack.openId).toBe(rack.generator!.id)
    expect(modal.divisions).toBe(6)

    scale.history.undo()
    await settle()
    expect(scale.sourceText).toBe('tet(5)')

    scale.history.redo()
    scale.history.redo()
    await settle()
    expect(rack.generator?.kind).toBe('harmonic-series')
    expect(scale.sourceText).toBe('8::16')
  })

  it('does not drop the redo history when a reopened card re-reports its result', async () => {
    const { scale, rack } = setup()
    rack.setGenerator('equal-temperament')
    rack.updateGenerator(rack.generator!.id, { source: 'tet(5)', name: 'five' })
    await settle()
    rack.updateGenerator(rack.generator!.id, { source: 'tet(6)', name: 'six' })
    await settle()

    scale.history.undo()
    await settle()
    rack.updateGenerator(rack.generator!.id, { source: 'tet(5)', name: 'five' })
    await settle()

    expect(scale.history.redoDisabled).toBe(false)
  })

  it('keeps settings per module and loads them back when its card opens', async () => {
    const { rack, modal } = setup()
    modal.divisions = 9
    rack.setGenerator('equal-temperament')
    const id = rack.generator!.id
    rack.updateGenerator(id, { source: 'tet(9)', name: 'nine' })
    rack.toggle(id)
    expect(rack.openId).toBeNull()

    modal.divisions = 31
    rack.toggle(id)
    expect(rack.openId).toBe(id)
    expect(modal.divisions).toBe(9)
  })
})
