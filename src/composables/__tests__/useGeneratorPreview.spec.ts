import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { useGeneratorPreview, type GeneratorResult } from '../useGeneratorPreview'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

function setup(build: () => GeneratorResult | undefined) {
  const previews: GeneratorResult[] = []
  wrapper = mount(
    defineComponent({
      setup() {
        useGeneratorPreview(build, (result) => previews.push(result))
        return () => null
      }
    })
  )
  return previews
}

describe('useGeneratorPreview', () => {
  it('previews on setup and on every change', async () => {
    const size = ref(5)
    const previews = setup(() => ({ source: `tet(${size.value})`, name: `${size.value}` }))
    expect(previews).toEqual([{ source: 'tet(5)', name: '5' }])

    size.value = 7
    await nextTick()
    expect(previews.map((p) => p.source)).toEqual(['tet(5)', 'tet(7)'])
  })

  it('skips settings that are mid-edit or throw', async () => {
    const text = ref('3/2')
    const previews = setup(() => {
      if (!text.value) {
        return undefined
      }
      if (text.value.endsWith('/')) {
        throw new Error('Half-typed')
      }
      return { source: text.value, name: 'x' }
    })

    text.value = ''
    await nextTick()
    text.value = '5/'
    await nextTick()
    text.value = '5/4'
    await nextTick()
    expect(previews.map((p) => p.source)).toEqual(['3/2', '5/4'])
  })

  it('does not repeat the last preview after a skipped edit', async () => {
    const text = ref('3/2')
    const previews = setup(() => (text.value ? { source: text.value, name: 'x' } : undefined))

    text.value = ''
    await nextTick()
    text.value = '3/2'
    await nextTick()
    expect(previews).toHaveLength(1)
  })
})
