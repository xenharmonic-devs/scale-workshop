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
    rack.updateModule(rack.generator!.id, { source: 'tet(7)', name: '7 equal divisions' })
    await settle()

    expect(scale.sourceText).toBe('tet(7)')
    expect(scale.name).toBe('7 equal divisions')
    expect(scale.relativeIntervals).toHaveLength(7)
  })

  it('applies a generator base frequency and MIDI note', async () => {
    const { scale, rack } = setup()
    rack.setGenerator('preset')
    rack.updateModule(rack.generator!.id, {
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
    rack.updateModule(id, { source: 'tet(5)', name: 'five' })
    rack.updateModule(id, { source: 'tet(6)', name: 'six' })
    rack.updateModule(id, { source: 'tet(7)', name: 'seven' })
    await settle()

    expect(computeScale).toHaveBeenCalledTimes(1)
    expect(scale.sourceText).toBe('tet(7)')
  })

  it('ignores results from a card that is no longer in the rack', async () => {
    const { scale, rack } = setup()
    rack.setGenerator('equal-temperament')
    const old = rack.generator!.id
    rack.setGenerator('harmonic-series')
    rack.updateModule(old, { source: 'tet(5)', name: 'five' })
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
    rack.updateModule(rack.generator!.id, { source: 'tet(7)', name: 'seven' })
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
    rack.updateModule(rack.generator!.id, { source: 'tet(5)', name: 'five' })
    await settle()

    modal.divisions = 6
    rack.updateModule(rack.generator!.id, { source: 'tet(6)', name: 'six' })
    await settle()

    rack.setGenerator('harmonic-series')
    rack.updateModule(rack.generator!.id, { source: '8::16', name: 'Harmonics 8-16' })
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
    rack.updateModule(rack.generator!.id, { source: 'tet(5)', name: 'five' })
    await settle()
    rack.updateModule(rack.generator!.id, { source: 'tet(6)', name: 'six' })
    await settle()

    scale.history.undo()
    await settle()
    rack.updateModule(rack.generator!.id, { source: 'tet(5)', name: 'five' })
    await settle()

    expect(scale.history.redoDisabled).toBe(false)
  })

  it('keeps settings per module and loads them back when its card opens', async () => {
    const { rack, modal } = setup()
    modal.divisions = 9
    rack.setGenerator('equal-temperament')
    const id = rack.generator!.id
    rack.updateModule(id, { source: 'tet(9)', name: 'nine' })
    rack.toggle(id)
    expect(rack.openId).toBeNull()

    modal.divisions = 31
    rack.toggle(id)
    expect(rack.openId).toBe(id)
    expect(modal.divisions).toBe(9)
  })
})

describe('Build Scale rack modifier chain', () => {
  /** A rack with a 6-note generator and the given modifiers, each with its code. */
  async function chain(...codes: string[]) {
    const { scale, rack } = setup()
    rack.setGenerator('equal-temperament')
    rack.updateModule(rack.generator!.id, { source: 'tet(6)', name: 'six' })
    for (const code of codes) {
      rack.addModifier('repeat')
      const module = rack.modifiers[rack.modifiers.length - 1]
      rack.updateModule(module.id, { source: code, name: code })
    }
    await settle()
    return { scale, rack }
  }

  it('compiles the generator and then each modifier in order', async () => {
    const { scale } = await chain('repeat(2)', 'sort()')
    expect(scale.sourceText).toBe('tet(6)\nrepeat(2)\nsort()')
    expect(scale.relativeIntervals).toHaveLength(12)
  })

  it('opens a new modifier card, and adds one without settings collapsed', async () => {
    const { rack } = await chain()
    rack.addModifier('repeat')
    expect(rack.openId).toBe(rack.modifiers[0].id)
    rack.addModifier('sort')
    expect(rack.openId).toBeNull()
    expect(rack.modifiers[1].code).toBe('sort()')
  })

  it('leaves bypassed modifiers out of the chain', async () => {
    const { scale, rack } = await chain('repeat(2)', 'sort()')
    rack.toggleBypass(rack.modifiers[0].id)
    await settle()
    expect(scale.sourceText).toBe('tet(6)\nsort()')
    rack.toggleBypass(rack.modifiers[0].id)
    await settle()
    expect(scale.sourceText).toBe('tet(6)\nrepeat(2)\nsort()')
  })

  it('moves and removes modifiers', async () => {
    const { scale, rack } = await chain('repeat(2)', 'sort()', 'reduce()')
    rack.moveModifier(2, 0)
    await settle()
    expect(scale.sourceText).toBe('tet(6)\nreduce()\nrepeat(2)\nsort()')
    rack.removeModule(rack.modifiers[1].id)
    await settle()
    expect(scale.sourceText).toBe('tet(6)\nreduce()\nsort()')
  })

  it('gives each card its input: the chain above it', async () => {
    const { rack } = await chain('repeat(2)', 'sort()')
    expect(rack.inputCode(rack.modifiers[1].id)).toBe('tet(6)\nrepeat(2)')
    expect(rack.stageInput(rack.modifiers[1].id)?.relativeIntervals).toHaveLength(12)
  })

  it('runs nothing without a generator', async () => {
    const { scale, rack } = await chain('repeat(2)')
    rack.removeGenerator()
    await settle()
    expect(rack.modifiers).toHaveLength(1)
    expect(scale.sourceText).toBe('')
  })

  it('shows an error on the stage the chain fails at', async () => {
    const { scale, rack } = await chain('repeat(2)', 'subset([0, 11])')
    expect(scale.error).toBe('')
    rack.toggleBypass(rack.modifiers[0].id)
    await settle()
    expect(scale.error).not.toBe('')
    expect(Object.keys(rack.stageErrors)).toEqual([rack.modifiers[1].id])
  })

  it('marks a modifier stale when the input its code was baked from changes', async () => {
    const { rack } = await chain('repeat(2)')
    rack.addModifier('random')
    const random = rack.modifiers[1]
    rack.updateModule(random.id, { source: 'sort()', name: 'baked', bakesInput: true })
    expect(rack.staleIds.has(random.id)).toBe(false)

    rack.updateModule(rack.modifiers[0].id, { source: 'repeat(3)', name: 'three' })
    expect(rack.staleIds.has(random.id)).toBe(true)

    // Opening the card rebuilds it from the new input.
    rack.updateModule(random.id, { source: 'sort()', name: 'baked', bakesInput: true })
    expect(rack.staleIds.has(random.id)).toBe(false)
  })

  it('brings removed modifiers back with undo', async () => {
    const { scale, rack } = await chain('repeat(2)', 'sort()')
    rack.removeModule(rack.modifiers[0].id)
    await settle()
    expect(scale.sourceText).toBe('tet(6)\nsort()')

    scale.history.undo()
    await settle()
    expect(rack.modifiers.map((module) => module.code)).toEqual(['repeat(2)', 'sort()'])
    expect(scale.sourceText).toBe('tet(6)\nrepeat(2)\nsort()')
  })

  it('writes out the default 12-TET scale to modify on an empty rack', async () => {
    const { scale, rack } = setup()
    rack.addModifier('sort')
    await settle()
    expect(rack.generator?.kind).toBe('imported')
    expect(rack.generator?.code.trim().split('\n')).toHaveLength(12)
    expect(scale.sourceText.endsWith('sort()')).toBe(true)
    expect(scale.relativeIntervals).toHaveLength(12)
  })
})
