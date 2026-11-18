import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useLivePreview } from '../useLivePreview'
import { useScaleStore } from '@/stores/scale'
import { useSessionIdStore } from '@/stores/session-id'

let frames: FrameRequestCallback[] = []
let wrapper: VueWrapper | undefined

function flushFrames() {
  const pending = frames
  frames = []
  pending.forEach((callback) => callback(0))
}

function setup() {
  let api!: ReturnType<typeof useLivePreview>
  wrapper = mount(
    defineComponent({
      setup() {
        api = useLivePreview()
        return () => null
      }
    })
  )
  const scale = useScaleStore()
  scale.name = 'Original'
  scale.sourceText = '9/8\n5/4\n2'
  scale.computeScale()
  return { scale, preview: api }
}

beforeEach(() => {
  setActivePinia(createPinia())
  // De-couple router
  useSessionIdStore().loading = true
  frames = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = []
  })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.unstubAllGlobals()
})

describe('useLivePreview', () => {
  it('applies a preview on the next frame without an undo step', () => {
    const { scale, preview } = setup()
    const undoStates = scale.history.states.length

    preview.preview({ source: '1\\5\n2\\5\n3\\5\n4\\5\n5\\5', name: '5 equal divisions of 2/1' })
    expect(scale.sourceText).toBe('9/8\n5/4\n2')

    flushFrames()
    expect(scale.sourceText).toBe('1\\5\n2\\5\n3\\5\n4\\5\n5\\5')
    expect(scale.name).toBe('5 equal divisions of 2/1')
    expect(scale.relativeIntervals).toHaveLength(5)
    expect(scale.history.states.length).toBe(undoStates)
  })

  it('coalesces rapid previews into one recompute with the latest value', () => {
    const { scale, preview } = setup()
    const computeScale = vi.spyOn(scale, 'computeScale')

    preview.preview({ source: 'tet(5)', name: 'five' })
    preview.preview({ source: 'tet(6)', name: 'six' })
    preview.preview({ source: 'tet(7)', name: 'seven' })
    flushFrames()

    expect(computeScale).toHaveBeenCalledTimes(1)
    expect(scale.sourceText).toBe('tet(7)')
    expect(scale.name).toBe('seven')
  })

  it('reverts to the scale from before the first preview', () => {
    const { scale, preview } = setup()

    preview.preview({ source: 'tet(5)', name: 'five' })
    flushFrames()
    preview.preview({ source: 'tet(6)', name: 'six' })
    flushFrames()
    preview.revert()

    expect(scale.sourceText).toBe('9/8\n5/4\n2')
    expect(scale.name).toBe('Original')
    expect(scale.relativeIntervals).toHaveLength(3)
  })

  it('drops a pending preview on revert', () => {
    const { scale, preview } = setup()

    preview.preview({ source: 'tet(5)', name: 'five' })
    preview.revert()
    flushFrames()

    expect(scale.sourceText).toBe('9/8\n5/4\n2')
  })

  it('leaves a single undo step back to the original scale after commit', () => {
    const { scale, preview } = setup()

    preview.preview({ source: 'tet(5)', name: 'five' })
    flushFrames()
    preview.preview({ source: 'tet(6)', name: 'six' })
    flushFrames()

    preview.commit()
    scale.sourceText = 'tet(6)'
    scale.computeScale()

    scale.history.undo()
    expect(scale.sourceText).toBe('9/8\n5/4\n2')
  })

  it('applies and reverts the base frequency and MIDI note of a preset', () => {
    const { scale, preview } = setup()
    scale.autoFrequency = true
    scale.baseMidiNote = 69

    preview.preview({ source: 'tet(5)', name: 'five', baseFrequency: 300, baseMidiNote: 60 })
    flushFrames()
    expect(scale.autoFrequency).toBe(false)
    expect(scale.userBaseFrequency).toBe(300)
    expect(scale.baseMidiNote).toBe(60)

    preview.revert()
    expect(scale.autoFrequency).toBe(true)
    expect(scale.baseMidiNote).toBe(69)
  })

  it('does nothing on revert after a commit', () => {
    const { scale, preview } = setup()

    preview.preview({ source: 'tet(5)', name: 'five' })
    flushFrames()
    preview.commit()
    preview.revert()

    expect(scale.sourceText).toBe('tet(5)')
  })
})
