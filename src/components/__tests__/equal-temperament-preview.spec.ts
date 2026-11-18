import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import EqualTemperament from '../modals/generation/EqualTemperament.vue'
import { useModalStore } from '@/stores/modal'
import { useSessionIdStore } from '@/stores/session-id'

let wrapper: VueWrapper | undefined

beforeEach(() => {
  setActivePinia(createPinia())
  useSessionIdStore().loading = true
  // The card docks into the Build Scale side panel.
  const panel = document.createElement('div')
  panel.id = 'side-panel'
  document.body.append(panel)
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.replaceChildren()
})

async function open() {
  wrapper = mount(EqualTemperament, { attachTo: document.body, props: { show: true } })
  await flushPromises()
  return wrapper
}

describe('Equal temperament live preview', () => {
  it('previews the current settings on open', async () => {
    const card = await open()
    expect(card.emitted('preview')).toEqual([
      ['1\\5\n2\\5\n3\\5\n4\\5\n5\\5', '5 equal divisions of 2/1']
    ])
  })

  it('previews the expanded scale when the divisions change', async () => {
    const card = await open()
    const modal = useModalStore()
    modal.divisions = 3
    modal.updateFromDivisions()
    await flushPromises()

    const previews = card.emitted('preview')!
    expect(previews[previews.length - 1]).toEqual(['1\\3\n2\\3\n3\\3', '3 equal divisions of 2/1'])
  })

  it('skips previews while the degree list is mid-edit', async () => {
    const card = await open()
    const modal = useModalStore()
    const before = card.emitted('preview')!.length
    modal.degreesString = '1 2 x'
    await flushPromises()

    expect(card.emitted('preview')!.length).toBe(before)
  })

  it('still emits the final result on OK', async () => {
    const card = await open()
    const modal = useModalStore()
    modal.divisions = 2
    modal.updateFromDivisions()
    await flushPromises()

    const ok = [...document.querySelectorAll('button')].find((b) => b.textContent === 'OK')!
    ok.click()

    expect(card.emitted('update:scaleName')).toEqual([['2 equal divisions of 2/1']])
    expect(card.emitted('update:source')).toEqual([['1\\2\n2\\2']])
  })
})
