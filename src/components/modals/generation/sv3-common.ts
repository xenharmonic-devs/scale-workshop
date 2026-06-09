export type StepSymbol = 'L' | 'M' | 's'

export type StepCounts = Record<StepSymbol, number>

export type StrictVarietyThreeScale = {
  steps: string
  chiral: boolean
  condition?: string
}

export type StrictVarietyThreeBranch =
  | StrictVarietyThreeScale[]
  | Record<string, StrictVarietyThreeScale[]>

export type StrictVarietyThreeEntry =
  | StrictVarietyThreeScale[]
  | Record<string, StrictVarietyThreeBranch>

export type ScaleOption = StrictVarietyThreeScale & {
  label: string
  counts: StepCounts
}

export function compareScaleOptions(a: ScaleOption, b: ScaleOption) {
  return (
    a.steps.length - b.steps.length ||
    a.counts.L - b.counts.L ||
    a.counts.M - b.counts.M ||
    a.steps.localeCompare(b.steps)
  )
}

export function compareCounts(a: StepCounts, b: StepCounts) {
  return a.L - b.L || a.M - b.M || a.s - b.s
}

export function countSteps(steps: string): StepCounts {
  return {
    L: countStep(steps, 'L'),
    M: countStep(steps, 'M'),
    s: countStep(steps, 's')
  }
}

export function formatCounts(counts: StepCounts) {
  return `${counts.L}L ${counts.M}M ${counts.s}s`
}

export function uniqueModes(steps: string) {
  // ASCII order ~ brightness
  return [...rotationSet(steps)].sort()
}

export function isChiralWord(steps: string) {
  const reversed = [...steps].reverse().join('')
  return !rotationSet(steps).has(reversed)
}

function countStep(steps: string, step: StepSymbol) {
  return [...steps].filter((char) => char === step).length
}

function rotationSet(steps: string) {
  const result = new Set<string>()
  for (let i = 0; i < steps.length; ++i) {
    result.add(steps.slice(i) + steps.slice(0, i))
  }
  return result
}
