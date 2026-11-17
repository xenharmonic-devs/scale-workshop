import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import ModalDialog from '../ModalDialog.vue'

let wrapper: VueWrapper
let opener: HTMLButtonElement

beforeEach(() => {
  opener = document.createElement('button')
  document.body.append(opener)
  opener.focus()
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function (
    this: HTMLElement
  ) {
    return (this.hidden ? [] : [{}]) as unknown as DOMRectList
  })
})

afterEach(() => {
  wrapper?.unmount()
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

async function open(body = '<input disabled><input hidden><input id="first">') {
  wrapper = mount(ModalDialog, {
    attachTo: document.body,
    slots: { header: '<h2>Test dialog</h2>', body }
  })
  await nextTick()
  return wrapper.get('[role="dialog"]')
}

describe('modal keyboard accessibility', () => {
  it('names the dialog and initially focuses the first available control', async () => {
    const dialog = await open()
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(document.getElementById(dialog.attributes('aria-labelledby')!)?.textContent).toBe(
      'Test dialog'
    )
    expect(document.activeElement).toBe(wrapper.get('#first').element)
  })

  it('wraps Tab in both directions and redirects background focus', async () => {
    await open()
    const first = wrapper.get<HTMLInputElement>('#first').element
    const last = wrapper.findAll('button')[1]!.element
    last.focus()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }))
    expect(document.activeElement).toBe(first)
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true })
    )
    expect(document.activeElement).toBe(last)
    opener.focus()
    expect(document.activeElement).toBe(first)
  })

  it('restores focus when hidden, reopened, and unmounted', async () => {
    await open()
    await wrapper.setProps({ show: false })
    expect(document.activeElement).toBe(opener)
    await wrapper.setProps({ show: true })
    await nextTick()
    expect(document.activeElement).toBe(wrapper.get('#first').element)
    wrapper.unmount()
    expect(document.activeElement).toBe(opener)
  })

  it('emits cancel on Escape and focuses footer buttons for an empty body', async () => {
    await open('<p>No controls</p>')
    expect(document.activeElement).toBe(wrapper.get('button').element)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})
