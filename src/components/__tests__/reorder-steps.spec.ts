import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { stepString } from 'sonic-weave/words'
import { Interval } from 'sonic-weave/interval'
import ReorderSteps from '@/components/modals/modification/ReorderSteps.vue'
import { useScaleStore } from '@/stores/scale'
import { useSessionIdStore } from '@/stores/session-id'

describe('Reorder steps', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    useSessionIdStore().loading = true
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.unstubAllGlobals()
  })

  function open(source: string) {
    const scale = useScaleStore()
    scale.sourceText = source
    scale.computeScale()
    wrapper = mount(ReorderSteps, { props: { show: true } })
    return scale
  }

  function word() {
    return stepString(useScaleStore().relativeIntervals.map((interval) => interval.value))
  }

  it('previews reordered steps without changing the scale until OK', async () => {
    const scale = open('200.\n700.\n1200.')
    expect(wrapper.get('.step-string').text()).toBe('stepString: sLL')
    await wrapper.get('[aria-label="Move step 1 down"]').trigger('click')
    expect(wrapper.get('.step-string').text()).toBe('stepString: LsL')
    expect(scale.sourceText).toBe('200.\n700.\n1200.')
    const spans = wrapper.findAll('.step-span')
    const rows = wrapper.findAll('li')
    expect(spans.map((span) => span.attributes('data-step-id'))).toEqual(['1', '0', '2'])
    expect(spans[0].attributes('fill')).toBe(spans[2].attributes('fill'))
    expect(Number(spans[0].attributes('y'))).toBeLessThan(Number(spans[1].attributes('y')))
    expect(wrapper.findAll('.after-state g text').map((tick) => tick.text())).toEqual([
      '0.0',
      '500.0',
      '700.0',
      '1200.0'
    ])
    expect(rows[0].attributes('style')).toBe(rows[2].attributes('style'))

    await wrapper.get('.modal-footer button').trigger('click')
    expect(scale.error).toBe('')
    expect(scale.relativeIntervals.map((interval) => interval.totalCents())).toEqual([
      500, 700, 1200
    ])
    expect(word()).toBe('LsL')
    expect(wrapper.emitted('done')).toHaveLength(1)
  })

  it('places negative spans on the other side and includes excursions below unison', async () => {
    const scale = open('200.\n100.\n1200.')
    await wrapper.get('[aria-label="Move step 2 up"]').trigger('click')
    const negative = wrapper.get('[data-direction="negative"]')
    const positive = wrapper.get('[data-direction="positive"]')
    expect(Number(negative.attributes('x'))).toBeLessThan(Number(positive.attributes('x')))
    expect(Number(negative.attributes('height'))).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('-100.0')
    const expectedWord = wrapper.get('.step-string code').text()
    await wrapper.get('.modal-footer button').trigger('click')
    expect(scale.error).toBe('')
    expect(scale.relativeIntervals.map((interval) => interval.totalCents())).toEqual([
      -100, 100, 1200
    ])
    expect(word()).toBe(expectedWord)
  })

  it('stripes all overlapping spans on both sides without a redundant cents equave label', async () => {
    open('300.\n100.\n400.\n200.\n1200.')
    const mixed = wrapper
      .findAll('.step-span')
      .filter((span) => span.attributes('fill')!.startsWith('url('))
    expect(mixed.some((span) => span.attributes('data-direction') === 'positive')).toBe(true)
    expect(mixed.some((span) => span.attributes('data-direction') === 'negative')).toBe(true)
    for (const span of mixed) {
      const id = span.attributes('fill')!.slice(5, -1)
      const pattern = wrapper.findAll('pattern').find((pattern) => pattern.attributes('id') === id)!
      expect(pattern.findAll('rect')).toHaveLength(
        span.attributes('data-step-id')!.split(',').length
      )
    }
    expect(wrapper.find('.equave-marker').exists()).toBe(false)
    await wrapper.get('[aria-label="Move step 1 down"]').trigger('click')
    expect(wrapper.find('.equave-marker').exists()).toBe(false)
  })

  it('labels a non-octave equave with its actual ratio', () => {
    open('3/2\n3/1')
    expect(wrapper.get('.after-state .equave-marker').text()).toContain('3/1')
    expect(wrapper.findAll('pattern')).toHaveLength(0)
  })

  it('keeps the before ruler fixed while comparing both states on one cents range', async () => {
    open('200.\n100.\n1200.')
    const beforeTicks = () => wrapper.findAll('.before-state g text').map((tick) => tick.text())
    const beforeColors = wrapper
      .findAll('.before-state .ruler-span')
      .map((span) => span.attributes('fill'))
    expect(beforeTicks()).toEqual(['0.0', '200.0', '100.0', '1200.0'])
    await wrapper.get('[aria-label="Move step 2 up"]').trigger('click')
    expect(beforeTicks()).toEqual(['0.0', '200.0', '100.0', '1200.0'])
    expect(
      wrapper.findAll('.before-state .ruler-span').map((span) => span.attributes('fill'))
    ).toEqual(beforeColors)
    expect(wrapper.findAll('.after-state g text').map((tick) => tick.text())).toEqual([
      '0.0',
      '-100.0',
      '100.0',
      '1200.0'
    ])
    const roots = wrapper.findAll('.root-marker')
    expect(roots).toHaveLength(1)
    expect(roots[0].attributes('y')).toBe(
      wrapper.findAll('.before-state g text')[0].attributes('y')
    )
    expect(wrapper.find('.equave-marker').exists()).toBe(false)
  })

  it.each(['rank2(700.750, 4, 0, 1201.234, 1)', 'tet(5)', '200.\n700.\n1200.'])(
    'omits the redundant equave label for logarithmic scales: %s',
    (source) => {
      const scale = open(source)
      expect(scale.error).toBe('')
      expect(wrapper.find('.equave-marker').exists()).toBe(false)
      expect(wrapper.find('.root-marker').exists()).toBe(true)
    }
  )

  it.each([0, 2])(
    'normalizes mixed absolute and relative pitches for button %i',
    async (button) => {
      const scale = open('1/1 = 440 Hz\n5/4\n660 Hz\n2/1')
      const expectedBefore = word()
      expect(wrapper.get('.step-string code').text()).toBe(expectedBefore)
      expect(wrapper.findAll('.before-state g text').map((tick) => Number(tick.text()))).toEqual([
        0,
        ...scale.relativeIntervals.map((interval) => Number(interval.totalCents().toFixed(1)))
      ])
      expect(wrapper.get('.equave-marker').text()).toContain('2/1')
      await wrapper.get('[aria-label="Move step 1 down"]').trigger('click')
      const expectedAfter = wrapper.get('.step-string code').text()
      await wrapper.findAll('.modal-footer button')[button].trigger('click')
      expect(scale.error).toBe('')
      expect(
        scale.relativeIntervals.map((interval, i) =>
          interval.value.equals(Interval.fromFraction(['6/5', '3/2', '2/1'][i]).value)
        )
      ).toEqual([true, true, true])
      expect(word()).toBe(expectedAfter)
      expect(scale.sourceText.includes('relative(£)\nunstack()')).toBe(button === 2)
    }
  )

  it('starts phone dragging only from the grip, leaving cards available for scrolling', async () => {
    open('200.\n700.\n1200.')
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const capture = vi.fn()
    wrapper.get('ol').element.setPointerCapture = capture
    const press = async (selector: string) => {
      const event = new MouseEvent('pointerdown', { button: 0, bubbles: true })
      Object.defineProperty(event, 'pointerId', { value: 1 })
      wrapper.get(selector).element.dispatchEvent(event)
      await wrapper.vm.$nextTick()
    }
    await press('.step-description')
    expect(capture).not.toHaveBeenCalled()
    await press('[aria-label="Move step 1 down"]')
    expect(capture).not.toHaveBeenCalled()
    await press('.drag-handle')
    expect(capture).toHaveBeenCalledWith(1)
    expect(wrapper.get('li').classes()).toContain('dragging')
  })

  it('retains exact ratio steps and supports the Raw operation', async () => {
    const scale = open('9/8\n5/4\n2/1')
    await wrapper.get('[aria-label="Move step 1 down"]').trigger('click')
    await wrapper.findAll('.modal-footer button')[2].trigger('click')
    expect(scale.sourceText).toContain('£[[1, 0, 2]]')
    expect(scale.error).toBe('')
    expect(
      scale.relativeIntervals.map((interval, i) =>
        interval.value.equals(Interval.fromFraction(['10/9', '5/4', '2'][i]).value)
      )
    ).toEqual([true, true, true])
  })

  it('discards changes on cancel and supports keyboard reordering', async () => {
    const scale = open('200.\n700.\n1200.')
    await wrapper.get('.drag-handle').trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.get('.step-string code').text()).toBe('LsL')
    await wrapper.findAll('.modal-footer button')[1].trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(scale.sourceText).toBe('200.\n700.\n1200.')
  })

  it.each([0, 2])(
    'materializes the displayed default scale when applying button %i',
    async (button) => {
      const scale = open('')
      expect(wrapper.findAll('li')).toHaveLength(12)
      await wrapper.findAll('.modal-footer button')[button].trigger('click')
      expect(scale.error).toBe('')
      expect(scale.sourceText).not.toBe('')
      expect(scale.relativeIntervals).toHaveLength(12)
      expect(scale.relativeIntervals[11].valueOf()).toBe(2)
    }
  )
})
