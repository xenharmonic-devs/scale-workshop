import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
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

  function headerButton(label: string) {
    const button = wrapper.findAll('.steps-header button').find((b) => b.text() === label)
    if (!button) throw new Error(`No ${label} button in the Steps heading row`)
    return button
  }

  function previewWord() {
    return wrapper.get('.step-string code').text()
  }

  it('uses the computed scale without evaluating the source when opening or reordering', async () => {
    const scale = useScaleStore()
    scale.sourceText = 'random() * 100. + 100.\n700.\n1200.'
    scale.computeScale()
    const intervals = scale.relativeIntervals.map((interval) => interval.toJSON())
    const expectedWord = word()
    const random = vi.spyOn(Math, 'random')
    const getVisitor = vi.spyOn(scale, 'getUserScopeVisitor')
    wrapper = mount(ReorderSteps, { props: { show: true } })
    expect(previewWord()).toBe(expectedWord)
    await wrapper.get('[aria-label="Move step 1 down"]').trigger('click')
    expect(random).not.toHaveBeenCalled()
    expect(getVisitor).not.toHaveBeenCalled()
    expect(scale.relativeIntervals.map((interval) => interval.toJSON())).toEqual(intervals)
    random.mockRestore()
    getVisitor.mockRestore()
  })

  it('initializes a retained modal on each opening', async () => {
    const scale = open('200.\n700.\n1200.')
    await wrapper.get('[aria-label="Move step 1 down"]').trigger('click')
    await wrapper.setProps({ show: false })
    scale.sourceText = '3/2\n3/1'
    scale.computeScale()
    await wrapper.setProps({ show: true })
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(previewWord()).toBe(word())
    expect(wrapper.get('.equave-marker').text()).toContain('3/1')
    expect(wrapper.findAll('.before-state g text').map((tick) => tick.text())).toEqual(
      wrapper.findAll('.after-state g text').map((tick) => tick.text())
    )
    await wrapper.get('[aria-label="Move step 1 down"]').trigger('click')
    await wrapper.setProps({ show: false })
    await wrapper.setProps({ show: true })
    expect(previewWord()).toBe(word())
  })

  it('refreshes all preview state when the computed scale changes while open', async () => {
    const scale = open('9/8\n5/4\n2/1')
    await wrapper.get('[aria-label="Move step 1 down"]').trigger('click')
    scale.sourceText = '300.\n1200.'
    scale.computeScale()
    await nextTick()
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(previewWord()).toBe(word())
    expect(wrapper.find('.equave-marker').exists()).toBe(false)
    expect(wrapper.findAll('.before-state g text').map((tick) => tick.text())).toEqual([
      '0.0',
      '300.0',
      '1200.0'
    ])
    expect(wrapper.findAll('.after-state g text').map((tick) => tick.text())).toEqual([
      '0.0',
      '300.0',
      '1200.0'
    ])
    await wrapper.get('[aria-label="Move step 1 down"]').trigger('click')
    await wrapper.get('.modal-footer button').trigger('click')
    expect(scale.error).toBe('')
    expect(scale.relativeIntervals.map((interval) => interval.totalCents())).toEqual([900, 1200])
  })

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

  it('stretches the rulers to the height the layout gives them', async () => {
    let size = { width: 288, height: 720 }
    const rect = vi
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockImplementation(() => ({ ...size }) as DOMRect)
    let resized = () => {}
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resized = callback
        }
        observe() {}
        disconnect() {}
      }
    )
    open('200.\n700.\n1200.')
    await nextTick()
    const svg = () => wrapper.get('svg')
    const lastTickY = () => {
      const ticks = wrapper.findAll('.after-state g line')
      return Number(ticks[ticks.length - 1].attributes('y1'))
    }
    // 720 px tall at 288 px wide is 820 units at the ruler's fixed 328 unit width.
    expect(svg().attributes('viewBox')).toBe('0 0 328 820')
    expect(lastTickY()).toBe(790)

    size = { width: 288, height: 360 }
    resized()
    await nextTick()
    expect(svg().attributes('viewBox')).toBe('0 0 328 410')
    expect(lastTickY()).toBe(380)
    rect.mockRestore()
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

  it.each([0, 2])('keeps mixed interval domains consistent for button %i', async (button) => {
    const scale = open('200.\n3/2\n1200.')
    const expectedSteps = [1, 2, 0].map((i) => wrapper.findAll('.step-details > span')[i].text())
    await wrapper.get('[aria-label="Move step 1 down"]').trigger('click')
    await wrapper.get('[aria-label="Move step 2 down"]').trigger('click')
    expect(wrapper.findAll('.step-details > span').map((span) => span.text())).toEqual(
      expectedSteps
    )
    const expectedWord = previewWord()
    await wrapper.findAll('.modal-footer button')[button].trigger('click')
    expect(scale.error).toBe('')
    expect(word()).toBe(expectedWord)
    expect(scale.relativeIntervals[scale.relativeIntervals.length - 1].totalCents()).toBeCloseTo(
      1200
    )
  })

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

  it('reverses the step order from the heading row', async () => {
    const scale = open('9/8\n5/4\n3/2\n2/1')
    const reverse = headerButton('Reverse')
    const word = wrapper.get('.step-string code').text()
    expect(reverse.text()).toBe('Reverse')

    await reverse.trigger('click')
    expect(wrapper.get('.step-string code').text()).toBe([...word].reverse().join(''))
    expect(wrapper.findAll('li strong')[0].text()).toBe(`1. ${word[word.length - 1]}`)
    expect(scale.sourceText).toBe('9/8\n5/4\n3/2\n2/1')

    // A second press restores the order it reversed.
    await reverse.trigger('click')
    expect(wrapper.get('.step-string code').text()).toBe(word)

    await reverse.trigger('click')
    await wrapper.get('.modal-footer button').trigger('click')
    expect(scale.error).toBe('')
    // 9/8, 10/9, 6/5, 4/3 reversed stack to 4/3, 8/5, 16/9, 2/1.
    expect(
      scale.relativeIntervals.map((interval, i) =>
        interval.value.equals(Interval.fromFraction(['4/3', '8/5', '16/9', '2'][i]).value)
      )
    ).toEqual([true, true, true, true])
  })

  it('disables Reverse when there is only one step', () => {
    open('2/1')
    expect(headerButton('Reverse').attributes('disabled')).toBeDefined()
  })

  it('shuffles the steps into a different order of sizes on every press', async () => {
    // Three equal steps and one other: most draws only trade equal steps,
    // which must not count as a shuffle.
    const scale = open('200.\n400.\n600.\n1200.')
    const sorted = (text: string) => [...text].sort().join('')
    let previous = previewWord()
    for (let press = 0; press < 20; ++press) {
      await headerButton('Shuffle').trigger('click')
      const current = previewWord()
      expect(current).not.toBe(previous)
      expect(sorted(current)).toBe(sorted(previous))
      previous = current
    }
    expect(scale.sourceText).toBe('200.\n400.\n600.\n1200.')

    await wrapper.get('.modal-footer button').trigger('click')
    expect(scale.error).toBe('')
    expect(word()).toBe(previous)
  })

  it('uses the random draw to pick the order', async () => {
    // Fisher-Yates with every draw at the top of its range keeps the order,
    // so the first draw is retried; a draw of 0 then rotates the steps.
    const random = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.999)
      .mockReturnValueOnce(0.999)
      .mockReturnValue(0)
    open('9/8\n5/4\n2/1')
    const before = previewWord()
    await headerButton('Shuffle').trigger('click')
    expect(previewWord()).toBe(before[1] + before[2] + before[0])
    random.mockRestore()
  })

  it('disables Shuffle and Reverse when every step is the same size', () => {
    open('')
    expect(headerButton('Shuffle').attributes('disabled')).toBeDefined()
    expect(headerButton('Reverse').attributes('disabled')).toBeDefined()
  })

  it('disables Reverse while the order of sizes is symmetrical', async () => {
    // Pythagorean Dorian: LsLLLsL reads the same reversed.
    open('9/8\n32/27\n4/3\n3/2\n27/16\n16/9\n2/1')
    expect(previewWord()).toBe('LsLLLsL')
    expect(headerButton('Reverse').attributes('disabled')).toBeDefined()
    expect(headerButton('Shuffle').attributes('disabled')).toBeUndefined()

    await wrapper.get('[aria-label="Move step 1 down"]').trigger('click')
    expect(previewWord()).toBe('sLLLLsL')
    expect(headerButton('Reverse').attributes('disabled')).toBeUndefined()
  })
})
