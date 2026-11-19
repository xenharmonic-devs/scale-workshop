import { defineAsyncComponent, type Component } from 'vue'

/**
 * Every generator the rack can hold in its generator slot, in New scale menu order. The card
 * components are lazy-loaded, as the dialogs were.
 */
export const GENERATORS = {
  'equal-temperament': {
    title: 'Equal temperament',
    component: () => import('@/components/modals/generation/EqualTemperament.vue')
  },
  'rank-two': {
    title: 'Rank-2 temperament',
    component: () => import('@/components/modals/generation/RankTwo.vue')
  },
  'harmonic-series': {
    title: 'Harmonic series segment',
    component: () => import('@/components/modals/generation/HarmonicSeries.vue')
  },
  'subharmonic-series': {
    title: 'Subharmonic series segment',
    component: () => import('@/components/modals/generation/SubharmonicSeries.vue')
  },
  'enumerate-chord': {
    title: 'Enumerate chord',
    component: () => import('@/components/modals/generation/EnumerateChord.vue')
  },
  'stack-steps': {
    title: 'Stack steps',
    component: () => import('@/components/modals/generation/StackSteps.vue')
  },
  cps: {
    title: 'Combination product set',
    component: () => import('@/components/modals/generation/CombinationProductSet.vue')
  },
  mos: {
    title: 'Moment of symmetry scale',
    component: () => import('@/components/modals/generation/MosScale.vue')
  },
  historical: {
    title: 'Historical temperament',
    component: () => import('@/components/modals/generation/HistoricalScale.vue')
  },
  'euler-genus': {
    title: 'Euler-Fokker genus',
    component: () => import('@/components/modals/generation/EulerGenus.vue')
  },
  lattice: {
    title: 'Parallelotope / Lattice',
    component: () => import('@/components/modals/generation/SpanLattice.vue')
  },
  'generator-sequence': {
    title: 'Generator sequence',
    component: () => import('@/components/modals/generation/GeneratorSequence.vue')
  },
  'concordance-shell': {
    title: 'Concordance shell',
    component: () => import('@/components/modals/generation/ConcordanceShell.vue')
  },
  'strict-variety-three': {
    title: 'Strict Variety 3',
    component: () => import('@/components/modals/generation/StrictVarietyThree.vue')
  },
  'fokker-block': {
    title: 'Fokker block',
    component: () => import('@/components/modals/generation/FokkerBlock.vue')
  },
  preset: {
    title: 'Load preset scale',
    component: () => import('@/components/modals/generation/LoadPreset.vue')
  }
} satisfies Record<string, { title: string; component: () => Promise<unknown> }>

export type CardGeneratorKind = keyof typeof GENERATORS

/**
 * `imported` holds a scale that arrived as finished SonicWeave: a file import, a shared or legacy
 * link, a restored session, the MOS view, or (until modifiers join the rack) a Modify scale
 * result. It has no settings, only its code.
 */
export type GeneratorKind = CardGeneratorKind | 'imported'

export function generatorTitle(kind: GeneratorKind) {
  return kind === 'imported' ? 'Imported scale' : GENERATORS[kind].title
}

const components = new Map<CardGeneratorKind, Component>()

/** The card component for a generator kind, created once per kind. */
export function generatorComponent(kind: CardGeneratorKind): Component {
  let component = components.get(kind)
  if (!component) {
    component = defineAsyncComponent(GENERATORS[kind].component as () => Promise<Component>)
    components.set(kind, component)
  }
  return component
}
