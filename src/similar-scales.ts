const CENTS_TOL = 25.0
const SIMILAR_CAP = 10
const MIN_PARENT_NOTES = 4
const CHILD_SIZE_K = 10.0 / Math.log(2) // cents cost per doubling of child size

export interface LibraryScale {
  stem: string
  cents: number[] // sorted, period excluded
  period: number
}

interface SimilarEntry {
  stem: string
  notes: number
  maxDiff: number
  mode: number
}

type ParentChildEntry = Omit<SimilarEntry, 'mode'>

export interface SimilarResult {
  similar: SimilarEntry[]
  children: ParentChildEntry[]
  parents: ParentChildEntry[]
}

function round1(x: number): number {
  return Math.round(x * 10) / 10
}

function round4(x: number): number {
  return Math.round(x * 10000) / 10000
}

function compareNumberArrays(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

/**
 * Calculate a string to identify scales which are modes of each other.
 */
export function canonicalModeKey(cents: number[], period: number): string {
  if (cents.length === 0) {
    return JSON.stringify([round4(period)])
  }
  const full = [0, ...cents, period]
  const steps: number[] = []
  for (let i = 1; i < full.length; i++) {
    steps.push(round4(full[i] - full[i - 1]))
  }
  const n = steps.length
  let maxRotation = steps
  for (let i = 1; i < n; i++) {
    const rotation = [...steps.slice(i), ...steps.slice(0, i)]
    if (compareNumberArrays(rotation, maxRotation) > 0) {
      maxRotation = rotation
    }
  }
  return JSON.stringify(maxRotation)
}

/**
 * Find the minimum max-absolute-difference distance between scale a and any mode of scale b.
 * @param a Cents of scale a, excluding 0.0 and period.
 * @param b Cents of scale b, excluding 0.0 and period.
 * @param periodA Period of scale a, in cents.
 * @param periodB Period of scale b, in cents.
 * @returns The minimum max-absolute cents difference over all rotations, and the index of the closest rotation.
 */
export function minModeDistance(
  a: number[],
  b: number[],
  periodA: number,
  periodB: number
): { dist: number; mode: number } {
  const n = a.length
  if (n === 0) {
    return { dist: Math.abs(periodA - periodB), mode: 0 }
  }

  // full_b includes the implicit root 0¢, giving n+1 possible rotation pivots
  const fullB = [0, ...b]
  let best = Infinity
  let bestMode = 0

  for (let r = 0; r <= n; r++) {
    const pivot = fullB[r]
    // Rotate: subtract pivot, mod periodB, sort
    const rotFull = fullB
      .map((x) => (((x - pivot) % periodB) + periodB) % periodB)
      .sort((x, y) => x - y)
    const rot = rotFull.slice(1) // exclude new root (0)
    let maxDiff = 0
    for (let i = 0; i < n; i++) {
      const diff = Math.abs(a[i] - rot[i])
      if (diff > maxDiff) maxDiff = diff
    }
    if (maxDiff < best) {
      best = maxDiff
      bestMode = r
    }
  }

  // Period difference counts toward overall distance
  const dist = Math.max(best, Math.abs(periodA - periodB))
  return { dist, mode: bestMode }
}

/**
 * Compute the error of the closest approximation of a parent scale within a child scale.
 * The parent is the smaller scale, the child is the larger scale.
 * @param childCents Cents of child scale, excluding 0.0 and period.
 * @param parentCents Cents of parent scale, excluding 0.0 and period.
 * @param childPeriod Period of child scale, in cents.
 * @param parentPeriod Period of parent scale, in cents.
 * @returns The max abs cents diff between the parent and its closest approximation in the child.
 */
export function maxNearestDistance(
  childCents: number[],
  parentCents: number[],
  childPeriod: number,
  parentPeriod: number
): number {
  const fullChild = [0, ...childCents, childPeriod]
  let maxDist = 0
  for (const parentNote of parentCents) {
    let minDiff = Infinity
    for (const childNote of fullChild) {
      const diff = Math.abs(parentNote - childNote)
      if (diff < minDiff) minDiff = diff
    }
    if (minDiff > maxDist) maxDist = minDiff
  }
  return Math.max(maxDist, Math.abs(childPeriod - parentPeriod))
}

/**
 * Find the base name of a library scale stem.
 * For example, for xenharmonikon/xen03-secor-partch, return xen03-secor-partch.
 */
export function stemBasename(stem: string): string {
  const parts = stem.split('/')
  return parts[parts.length - 1]
}

/**
 * Keep one representative per modal equivalence class, preferring the lowest rotation index.
 * This is to avoid the similar scales table being filled with modes of the same scale.
 * @param candidates Array of library scales, their distances, and mode numbers.
 * @returns Deduplicated candidates, with at most one scale per modal equivalence class.
 */
function dedupByModalClass(
  candidates: Array<{ scale: LibraryScale; dist: number; mode: number }>
): Array<{ scale: LibraryScale; dist: number; mode: number }> {
  const best = new Map<string, { scale: LibraryScale; dist: number; mode: number }>()
  for (const item of candidates) {
    const key = canonicalModeKey(item.scale.cents, item.scale.period)
    const existing = best.get(key)
    if (!existing || item.mode < existing.mode) {
      best.set(key, item)
    }
  }
  return Array.from(best.values())
}

/**
 * Compute similar, child, and parent scales for a given user scale.
 * @param queryCents Cents of user scale, excluding 0.0 and period.
 * @param queryPeriod Period of user scale, in cents.
 * @param library Library of scales to search for similar scales.
 * @returns Arrays of similar, child, and parent scales and their fitting data.
 */
export function computeSimilarScales(
  queryCents: number[],
  queryPeriod: number,
  library: LibraryScale[]
): SimilarResult {
  const queryNotes = queryCents.length

  // --- Similar ---
  const similarCandidates: Array<{ scale: LibraryScale; dist: number; mode: number }> = []
  for (const libScale of library) {
    if (libScale.cents.length !== queryNotes) continue
    const { dist, mode } = minModeDistance(queryCents, libScale.cents, queryPeriod, libScale.period)
    if (dist <= CENTS_TOL) {
      similarCandidates.push({ scale: libScale, dist, mode })
    }
  }

  const dedupedSimilar = dedupByModalClass(similarCandidates)
  dedupedSimilar.sort((a, b) => {
    if (a.dist !== b.dist) return a.dist - b.dist
    return stemBasename(a.scale.stem).localeCompare(stemBasename(b.scale.stem))
  })

  const similar: SimilarEntry[] = dedupedSimilar
    .slice(0, SIMILAR_CAP)
    .map(({ scale, dist, mode }) => ({
      stem: scale.stem,
      notes: scale.cents.length + 1,
      maxDiff: round1(dist),
      mode
    }))

  if (queryNotes === 0) {
    return { similar, parents: [], children: [] }
  }

  // --- Children ---
  const children: ParentChildEntry[] = []
  const childCandidates: Array<{ scale: LibraryScale; dist: number }> = []
  for (const libScale of library) {
    if (libScale.cents.length <= queryNotes) continue
    const dist = maxNearestDistance(libScale.cents, queryCents, libScale.period, queryPeriod)
    if (dist <= CENTS_TOL) {
      childCandidates.push({ scale: libScale, dist })
    }
  }
  childCandidates.sort((a, b) => {
    const scoreA = a.dist + CHILD_SIZE_K * Math.log(a.scale.cents.length / queryNotes)
    const scoreB = b.dist + CHILD_SIZE_K * Math.log(b.scale.cents.length / queryNotes)
    if (scoreA !== scoreB) return scoreA - scoreB
    return stemBasename(a.scale.stem).localeCompare(stemBasename(b.scale.stem))
  })
  for (const { scale, dist } of childCandidates.slice(0, SIMILAR_CAP)) {
    children.push({
      stem: scale.stem,
      notes: scale.cents.length + 1,
      maxDiff: round1(dist)
    })
  }

  // --- Parents ---
  const parents: ParentChildEntry[] = []
  const parentCandidates: Array<{ scale: LibraryScale; dist: number }> = []
  for (const libScale of library) {
    if (libScale.cents.length >= queryNotes) continue
    if (libScale.cents.length < MIN_PARENT_NOTES) continue
    const dist = maxNearestDistance(queryCents, libScale.cents, queryPeriod, libScale.period)
    if (dist <= CENTS_TOL) {
      parentCandidates.push({ scale: libScale, dist })
    }
  }
  parentCandidates.sort((a, b) => {
    if (a.dist !== b.dist) return a.dist - b.dist
    const nDiff = b.scale.cents.length - a.scale.cents.length // largest first
    if (nDiff !== 0) return nDiff
    return stemBasename(a.scale.stem).localeCompare(stemBasename(b.scale.stem))
  })
  for (const { scale, dist } of parentCandidates.slice(0, SIMILAR_CAP)) {
    parents.push({
      stem: scale.stem,
      notes: scale.cents.length + 1,
      maxDiff: round1(dist)
    })
  }

  return { similar, children, parents }
}
