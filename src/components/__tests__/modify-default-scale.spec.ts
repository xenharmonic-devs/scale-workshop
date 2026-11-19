import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ModifyScale from '@/components/ModifyScale.vue'
import { useScaleStore } from '@/stores/scale'
import { useModalStore } from '@/stores/modal'
import { useSessionIdStore } from '@/stores/session-id'
import { useRackStore } from '@/stores/rack'
import RackPanel from '@/components/rack/RackPanel.vue'

let wrapper: VueWrapper
let panel: VueWrapper
beforeEach(() => {
  setActivePinia(createPinia())
  useSessionIdStore().loading = true
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 0)
  )
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
})
afterEach(() => {
  wrapper?.unmount()
  panel?.unmount()
  document.body.replaceChildren()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/** Lets the cards load and report, and the rack write the scale. */
async function settle() {
  await vi.dynamicImportSettled()
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await flushPromises()
}

/** The Modify scale menu next to the rack its modifiers go into. */
function open(source = '') {
  const scale = useScaleStore()
  scale.sourceText = source
  scale.computeScale()
  panel = mount(RackPanel, { attachTo: document.body })
  wrapper = mount(ModifyScale, { attachTo: document.body })
  return scale
}
async function select(label: string) {
  const link = wrapper.findAll('ul a').find((a) => a.text() === label)!
  await link.trigger('click')
  await settle()
}
async function button(label: string) {
  const target = [...document.querySelectorAll<HTMLButtonElement>('.rack-card-body button')].find(
    (b) => b.textContent?.trim() === label
  )!
  target.click()
  await settle()
}

describe('default scale modification', () => {
  it('preserves displayed colors and labels on Repeat', async () => {
    const scale = open('1/1 = 440 Hz')
    useModalStore().numRepeats = 2
    const colors = [...scale.colors]
    const labels = [...scale.labels]
    await select('Repeat')
    expect(scale.error).toBe('')
    expect(scale.relativeIntervals).toHaveLength(24)
    expect(scale.colors).toEqual([...colors, ...colors])
    expect(scale.labels).toEqual([...labels, ...labels])
    expect(scale.scale.baseFrequency).toBeCloseTo(440)
  })

  it.each(['silver', 'cents', 'factors'] as const)(
    'preserves %s colors during materialization',
    (mode) => {
      const scale = open()
      scale.autoColors = mode
      scale.baseMidiNote = 61
      scale.computeScale()
      const colors = [...scale.colors]
      const labels = [...scale.labels]
      scale.materializeDefaultScale()
      const source = scale.sourceText
      scale.materializeDefaultScale()
      expect(scale.sourceText).toBe(source)
      scale.computeScale()
      expect(scale.error).toBe('')
      expect(scale.colors).toEqual(colors)
      expect(scale.labels).toEqual(labels)
    }
  )

  // A rack card has no Cancel: removing the module takes its change back out of the chain.
  it('restores the scale when the modifier is removed again', async () => {
    const scale = open('(* empty *)')
    const colors = [...scale.colors]
    const labels = [...scale.labels]
    await select('Repeat')
    expect(scale.relativeIntervals).toHaveLength(24)
    const rack = useRackStore()
    rack.removeModule(rack.modifiers[0].id)
    await settle()
    expect(scale.error).toBe('')
    expect(scale.relativeIntervals).toHaveLength(12)
    expect(scale.colors).toEqual(colors)
    expect(scale.labels).toEqual(labels)
  })

  it('applies rational replacements as live statements on the degrees', async () => {
    const scale = open('(* empty *)')
    await select('Approximate by ratios')
    await button('Apply')
    await button('Apply')
    expect(scale.error).toBe('')
    expect(scale.sourceText).toContain('$[0] = ')
    expect(scale.sourceText).toContain('$[1] = ')
    expect(useRackStore().modifiers[0].name).toBe('2 degrees replaced')

    await button('Clear replacements')
    expect(scale.sourceText).not.toContain('$[0] = ')
  })

  it.each([
    ['ASCII', 'C#'],
    ['single', 'C♯'],
    ['double', 'C♯']
  ] as const)('writes readable 12-EDO lines with %s accidentals', (style, sharp) => {
    const scale = open()
    scale.accidentalPreference = style
    scale.materializeDefaultScale()
    const lines = scale.sourceText.trim().split('\n')
    expect(lines).toHaveLength(12)
    expect(lines[0]).toBe(`1\\12 "${sharp}" black`)
    expect(lines[1]).toBe('2\\12 "D" white')
    expect(lines[11]).toBe('12\\12 "C" white')
    scale.computeScale()
    expect(scale.error).toBe('')
    expect(scale.labels[0]).toBe(sharp)
  })

  it('materializes for immediate actions', async () => {
    const scale = open()
    const colors = [...scale.colors]
    await select('Sort ascending')
    expect(scale.error).toBe('')
    expect(scale.sourceText).not.toBe('')
    expect(scale.colors).toEqual(colors)
  })

  it('preserves explicit source and evaluates pending editor changes', () => {
    const scale = open()
    scale.sourceText = 'tet(7)'
    scale.materializeDefaultScale()
    expect(scale.sourceText).toBe('tet(7)')
    scale.sourceText = '(* cleared *)'
    scale.materializeDefaultScale()
    scale.computeScale()
    expect(scale.error).toBe('')
    expect(scale.relativeIntervals).toHaveLength(12)
    expect(scale.sourceText).toContain('(* cleared *)')
  })
})
