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
      [{ source: 'tet(5)', name: '5 equal divisions of 2/1' }]
    ])
  })

  it('previews the readable code when the divisions change', async () => {
    const card = await open()
    const modal = useModalStore()
    modal.divisions = 3
    modal.updateFromDivisions()
    await flushPromises()

    const previews = card.emitted('preview')!
    expect(previews[previews.length - 1]).toEqual([
      { source: 'tet(3)', name: '3 equal divisions of 2/1' }
    ])
  })

  it('skips previews while the degree list is mid-edit', async () => {
    const card = await open()
    const modal = useModalStore()
    const before = card.emitted('preview')!.length
    modal.degreesString = '1 2 x'
    await flushPromises()

    expect(card.emitted('preview')!.length).toBe(before)
  })

  it('lists the degrees when they are not a plain equal division', async () => {
    const card = await open()
    const modal = useModalStore()
    modal.degreesString = '1 3 5'
    modal.simpleEd = false
    await flushPromises()

    const previews = card.emitted('preview')!
    expect(previews[previews.length - 1]).toEqual([
      { source: '1\\5\n3\\5\n5\\5', name: '5 equal divisions of 2/1' }
    ])
  })
})
