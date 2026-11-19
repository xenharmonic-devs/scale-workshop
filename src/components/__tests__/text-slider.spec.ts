import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import TextSlider from '../TextSlider.vue'

let wrapper: VueWrapper

afterEach(() => {
  wrapper?.unmount()
  document.body.replaceChildren()
})

function mountSlider(props: Record<string, unknown> = {}) {
  wrapper = mount(TextSlider, {
    attachTo: document.body,
    props: {
      modelValue: 10,
      min: 1,
      max: 100,
      defaultValue: 12,
      'onUpdate:modelValue': (value: number) => wrapper.setProps({ modelValue: value }),
      ...props
    }
  })
  return wrapper.element as HTMLDivElement
}

function emitted() {
  return (wrapper.emitted('update:modelValue') ?? []).map((args) => args[0])
}

function lastEmitted() {
  const values = emitted()
  return values[values.length - 1]
}

function pointer(type: string, clientY: number, shiftKey = false) {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    clientX: 50,
    clientY,
    shiftKey
  })
}

function key(element: HTMLElement, key: string, shiftKey = false) {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })
  element.dispatchEvent(event)
  return event
}

describe('TextSlider', () => {
  it('shows the value', () => {
    const el = mountSlider()
    expect(el.textContent?.trim()).toBe('10')
    expect(el.getAttribute('role')).toBe('spinbutton')
    expect(el.getAttribute('aria-valuenow')).toBe('10')
  })

  it('drags up to increase by step * dragScale per pixel, snapped to the step', async () => {
    const el = mountSlider({ dragScale: 0.5 })
    el.dispatchEvent(pointer('pointerdown', 100))
    el.dispatchEvent(pointer('pointermove', 90))
    el.dispatchEvent(pointer('pointerup', 90))
    await nextTick()
    expect(lastEmitted()).toBe(15)
  })

  it('drags down to decrease and clamps to the range', async () => {
    const el = mountSlider()
    el.dispatchEvent(pointer('pointerdown', 100))
    el.dispatchEvent(pointer('pointermove', 500))
    el.dispatchEvent(pointer('pointerup', 500))
    await nextTick()
    expect(lastEmitted()).toBe(1)
  })

  it('drags ten times finer with Shift', async () => {
    const el = mountSlider()
    el.dispatchEvent(pointer('pointerdown', 100))
    el.dispatchEvent(pointer('pointermove', 70, true))
    el.dispatchEvent(pointer('pointerup', 70, true))
    await nextTick()
    expect(lastEmitted()).toBe(13)
  })

  it('ignores movement below the drag threshold', async () => {
    const el = mountSlider()
    el.dispatchEvent(pointer('pointerdown', 100))
    el.dispatchEvent(pointer('pointermove', 99))
    el.dispatchEvent(pointer('pointerup', 99))
    await nextTick()
    expect(emitted()).toEqual([])
  })

  it('resets to the default value on double-click', async () => {
    const el = mountSlider()
    el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await nextTick()
    expect(emitted()).toEqual([12])
  })

  it('nudges with the arrow keys, Shift for ten steps', async () => {
    const el = mountSlider()
    key(el, 'ArrowUp')
    await nextTick()
    key(el, 'ArrowDown', true)
    await nextTick()
    expect(emitted()).toEqual([11, 1])
  })

  it('types a value in place and commits it with Enter', async () => {
    const el = mountSlider()
    const first = key(el, '1')
    await nextTick()
    expect(first.defaultPrevented).toBe(true)
    expect(el.dataset.editing).toBe('true')
    key(el, '9')
    key(el, '.')
    key(el, '5')
    await nextTick()
    expect(el.textContent?.trim()).toBe('19.5')
    key(el, 'Enter')
    await nextTick()
    expect(emitted()).toEqual([19.5])
    expect(el.dataset.editing).toBeUndefined()
  })

  it('cancels an edit with Escape and keeps the old value', async () => {
    const el = mountSlider()
    key(el, '4')
    key(el, 'Escape')
    await nextTick()
    expect(emitted()).toEqual([])
    expect(el.textContent?.trim()).toBe('10')
  })

  it('commits a pending edit when focus leaves', async () => {
    const el = mountSlider()
    el.focus()
    key(el, '4')
    key(el, '2')
    el.blur()
    await nextTick()
    expect(emitted()).toEqual([42])
  })

  it('keeps the old value when the typed text is not a number', async () => {
    const el = mountSlider()
    key(el, '-')
    key(el, 'Enter')
    await nextTick()
    expect(emitted()).toEqual([])
  })

  it('prevents text selection from starting in the box', () => {
    const el = mountSlider()
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    el.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('swallows select all instead of selecting the page', () => {
    const el = mountSlider()
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      metaKey: true,
      bubbles: true,
      cancelable: true
    })
    el.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('does nothing while disabled', async () => {
    const el = mountSlider({ disabled: true })
    key(el, 'ArrowUp')
    el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await nextTick()
    expect(emitted()).toEqual([])
    expect(el.tabIndex).toBe(-1)
  })
})
