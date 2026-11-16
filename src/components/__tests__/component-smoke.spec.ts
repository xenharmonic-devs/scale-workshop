import { describe, expect, it } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'

import DropdownGroup from '@/components/DropdownGroup.vue'
import ModalDialog from '@/components/ModalDialog.vue'
import NumericSlider from '@/components/NumericSlider.vue'
import ScaleRule from '@/components/ScaleRule.vue'
import type { Scale } from '@/scale'

describe('component smoke tests', () => {
  it('mounts modal dialog and emits cancel on Escape', async () => {
    const wrapper = mount(ModalDialog, {
      attachTo: document.body,
      props: { show: true },
      slots: {
        body: '<input id="first-input" />'
      },
      global: {
        stubs: {
          Transition: false
        }
      }
    })

    try {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }))
      expect(wrapper.emitted('cancel')).toHaveLength(1)
    } finally {
      wrapper.unmount()
    }
  })

  it('emits confirm when the default OK button is clicked', async () => {
    const wrapper = mount(ModalDialog, {
      props: { show: true },
      global: {
        stubs: {
          Transition: false
        }
      }
    })

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('mounts dropdown group and emits mouseenter', async () => {
    const wrapper = shallowMount(DropdownGroup, {
      props: {
        title: 'Testing'
      }
    })

    await wrapper.trigger('mouseenter')
    expect(wrapper.emitted('mouseenter')).toHaveLength(1)
    expect(wrapper.text()).toContain('Testing')
    expect(typeof (wrapper.vm as { blur: () => void }).blur).toBe('function')
  })

  it('mounts scale rule in both orientations', () => {
    const scale = {
      size: 3,
      equaveRatio: 2,
      intervalRatios: [1, 1.5, 2]
    } as unknown as Scale

    const horizontal = shallowMount(ScaleRule, {
      props: {
        scale,
        orientation: 'horizontal'
      }
    })
    expect(horizontal.findAll('line').length).toBeGreaterThan(1)

    const vertical = shallowMount(ScaleRule, {
      props: {
        scale,
        orientation: 'vertical'
      }
    })
    expect(vertical.find('svg').attributes('width')).toBe('10')
  })

  it('skips invalid scale values when computing ticks', () => {
    const scale = {
      size: 4,
      equaveRatio: 2,
      intervalRatios: [1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]
    } as unknown as Scale

    const wrapper = shallowMount(ScaleRule, {
      props: {
        scale,
        orientation: 'horizontal'
      }
    })

    // 1 baseline line + valid ticks (1, 1.5, 2/equave tick)
    expect(wrapper.findAll('line').length).toBe(4)
  })

  it('mounts numeric slider and normalizes browser string input to numbers', async () => {
    const Host = defineComponent({
      components: { NumericSlider },
      setup() {
        const value = ref(5)
        return { value }
      },
      template:
        '<NumericSlider v-model="value" min="0" max="10" step="0.5" data-testid="numeric-slider" />'
    })

    const wrapper = mount(Host)
    const slider = wrapper.get('[data-testid="numeric-slider"]')

    await slider.setValue('7.5')

    expect(wrapper.vm.value).toBe(7.5)
    expect(typeof wrapper.vm.value).toBe('number')
  })

  it('emits model updates on range input events', async () => {
    const wrapper = mount(NumericSlider, {
      props: {
        modelValue: 5,
        min: 0,
        max: 10,
        step: 1
      }
    })

    const slider = wrapper.get('input[type="range"]')
    await slider.setValue('7')

    expect(slider.attributes('type')).toBe('range')
    expect(wrapper.emitted('update:modelValue')).toEqual([[7]])
  })

  it('keeps emitting updates as slider values change', async () => {
    const wrapper = mount(NumericSlider, {
      props: {
        modelValue: 5
      }
    })

    const slider = wrapper.get('input[type="range"]')
    await slider.setValue('6')
    await slider.setValue('4')

    expect(wrapper.emitted('update:modelValue')).toEqual([[6], [4]])
  })
})
