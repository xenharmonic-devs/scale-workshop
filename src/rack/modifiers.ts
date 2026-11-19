import { defineAsyncComponent, type Component } from 'vue'

type ModifierDefinition = {
  title: string
  /** The settings card. Modifiers without one are a fixed statement (`code`). */
  component?: () => Promise<unknown>
  /** The whole contribution of a modifier without settings. */
  code?: string
  /** What the collapsed card shows for a modifier without settings. */
  summary?: string
}

/** Every modifier the rack can chain after the generator, in Modify scale menu order. */
export const MODIFIERS = {
  expand: {
    title: 'Expand/simplify lines',
    component: () => import('@/components/modals/modification/ExpandScale.vue')
  },
  sort: { title: 'Sort ascending', code: 'sort()', summary: 'Lowest to highest' },
  reduce: { title: 'Equave reduce', code: 'reduce()', summary: 'Into one equave' },
  retrovert: {
    title: 'Retrovert (negative harmony)',
    code: 'retrovert()',
    summary: 'Intervals mirrored within the equave'
  },
  rotate: {
    title: 'Rotate mode',
    component: () => import('@/components/modals/modification/RotateScale.vue')
  },
  reorder: {
    title: 'Reorder steps',
    component: () => import('@/components/modals/modification/ReorderSteps.vue')
  },
  repeat: {
    title: 'Repeat',
    component: () => import('@/components/modals/modification/RepeatScale.vue')
  },
  subset: {
    title: 'Subset',
    component: () => import('@/components/modals/modification/TakeSubset.vue')
  },
  stretch: {
    title: 'Stretch/compress',
    component: () => import('@/components/modals/modification/StretchScale.vue')
  },
  random: {
    title: 'Random variance',
    component: () => import('@/components/modals/modification/RandomVariance.vue')
  },
  enumerate: {
    title: 'Enumerate',
    component: () => import('@/components/modals/modification/EnumerateScale.vue')
  },
  coalesce: {
    title: 'Coalesce duplicates',
    component: () => import('@/components/modals/modification/CoalesceDuplicates.vue')
  },
  'approximate-ratios': {
    title: 'Approximate by ratios',
    component: () => import('@/components/modals/modification/ApproximateByRatios.vue')
  },
  'approximate-harmonics': {
    title: 'Approximate by harmonics',
    component: () => import('@/components/modals/modification/ApproximateByHarmonics.vue')
  },
  'approximate-subharmonics': {
    title: 'Approximate by subharmonics',
    component: () => import('@/components/modals/modification/ApproximateBySubharmonics.vue')
  },
  equalize: {
    title: 'Equalize',
    component: () => import('@/components/modals/modification/EqualizeScale.vue')
  },
  interpolate: {
    title: 'Interpolate',
    component: () => import('@/components/modals/modification/InterpolateScale.vue')
  },
  temper: {
    title: 'Temper',
    component: () => import('@/components/modals/modification/TemperScale.vue')
  },
  'merge-offsets': {
    title: 'Merge offsets',
    component: () => import('@/components/modals/modification/MergeOffsets.vue')
  },
  convert: {
    title: 'Convert interval values',
    component: () => import('@/components/modals/modification/ConvertType.vue')
  }
} satisfies Record<string, ModifierDefinition>

export type ModifierKind = keyof typeof MODIFIERS

export function modifierDefinition(kind: ModifierKind): ModifierDefinition {
  return MODIFIERS[kind]
}

const components = new Map<ModifierKind, Component>()

/** The settings card for a modifier kind, or undefined for one without settings. */
export function modifierComponent(kind: ModifierKind): Component | undefined {
  const loader = modifierDefinition(kind).component
  if (!loader) {
    return undefined
  }
  let component = components.get(kind)
  if (!component) {
    component = defineAsyncComponent(loader as () => Promise<Component>)
    components.set(kind, component)
  }
  return component
}
