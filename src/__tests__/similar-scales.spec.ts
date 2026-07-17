import { describe, it, expect } from 'vitest'
import {
  minModeDistance,
  maxNearestDistance,
  canonicalModeKey,
  computeSimilarScales
} from '../similar-scales'

describe('Minimum mode distance', () => {
  it('finds dist 15.6, mode 0 for just vs equal tempered major scale', () => {
    const a = [203.9, 386.3, 498.0, 702.0, 884.4, 1088.3]
    const b = [200.0, 400.0, 500.0, 700.0, 900.0, 1100.0]
    const { dist, mode } = minModeDistance(a, b, 1200.0, 1200.0)
    expect(dist).toBeCloseTo(15.6)
    expect(mode).toBe(0)
  })

  it('finds dist 15.6, mode 1 for just major pentatonic vs equal tempered minor pentatonic', () => {
    const a = [203.9, 386.3, 702.0, 884.4]
    const b = [300.0, 500.0, 700.0, 1000.0]
    const { dist, mode } = minModeDistance(a, b, 1200.0, 1200.0)
    expect(dist).toBeCloseTo(15.6)
    expect(mode).toBe(1)
  })

  it('accounts for differences in period in dist', () => {
    const a = [200.0, 400.0, 700.0, 900.0]
    const { dist, mode } = minModeDistance(a, a, 1200.0, 1190.0)
    expect(dist).toBeCloseTo(10.0)
    expect(mode).toBe(0)
  })

  it('finds zero distance for identical scales', () => {
    const a = [200.0, 400.0, 700.0, 1000.0]
    const { dist, mode } = minModeDistance(a, a, 1200.0, 1200.0)
    expect(dist).toBeCloseTo(0)
    expect(mode).toBe(0)
  })
})

describe('Maximum nearest-note distance', () => {
  it('finds zero distance for a parent which is a subset of the child', () => {
    const child = [200.0, 400.0, 500.0, 700.0, 900.0, 1100.0]
    const parent = [200.0, 400.0, 700.0, 900.0]
    const dist = maxNearestDistance(child, parent, 1200.0, 1200.0)
    expect(dist).toBeCloseTo(0)
  })

  it('finds distance 15.6 for tempered major pentatonic as parent of just major scale', () => {
    const child = [203.9, 386.3, 498.0, 702.0, 884.4, 1088.3]
    const parent = [200.0, 400.0, 700.0, 900.0]
    const dist = maxNearestDistance(child, parent, 1200.0, 1200.0)
    expect(dist).toBeCloseTo(15.6)
  })

  it('accounts for differences in period in dist', () => {
    const a = [200.0, 400.0, 700.0, 900.0]
    const dist = maxNearestDistance(a, a, 1200.0, 1190.0)
    expect(dist).toBeCloseTo(10.0)
  })

  it('accounts for differences in period in dist, for different sized scales', () => {
    const child = [200.0, 400.0, 500.0, 700.0, 900.0, 1100.0]
    const parent = [200.0, 400.0, 700.0, 900.0]
    const dist = maxNearestDistance(child, parent, 1200.0, 1190.0)
    expect(dist).toBeCloseTo(10.0)
  })

  it('finds zero distance for identical scales', () => {
    const a = [200.0, 400.0, 700.0, 1000.0]
    const dist = maxNearestDistance(a, a, 1200.0, 1200.0)
    expect(dist).toBeCloseTo(0)
  })
})

describe('Canonical mode key', () => {
  it('gives the same key for scales which are modes of each other', () => {
    const a = [200.0, 400.0, 700.0, 900.0] // major pentatonic
    const b = [300.0, 500.0, 700.0, 1000.0] // minor pentatonic
    const keyA = canonicalModeKey(a, 1200.0)
    const keyB = canonicalModeKey(b, 1200.0)
    expect(keyA).toBe(keyB)
  })

  it('gives different keys to scales which are not modes of each other', () => {
    const a = [250.0, 400.0, 700.0, 900.0]
    const b = [300.0, 500.0, 700.0, 1000.0]
    const keyA = canonicalModeKey(a, 1200.0)
    const keyB = canonicalModeKey(b, 1200.0)
    expect(keyA).not.toBe(keyB)
  })

  it('gives different keys to scales which differ only in period', () => {
    const a = [200.0, 400.0, 700.0, 900.0]
    const keyA = canonicalModeKey(a, 1200.0)
    const keyB = canonicalModeKey(a, 1190.0)
    expect(keyA).not.toBe(keyB)
  })
})

describe('Similar scales computation', () => {
  it('finds one similar scale, child, and parent when expected', () => {
    const queryCents = [200.0, 400.0, 500.0, 700.0, 900.0, 1100.0]
    const library = [
      { stem: 'just-major-pentatonic', cents: [203.9, 386.3, 702.0, 884.4], period: 1200.0 },
      { stem: 'just-major', cents: [203.9, 386.3, 498.0, 702.0, 884.4, 1088.3], period: 1200.0 },
      {
        stem: '12tet',
        cents: [100.0, 200.0, 300.0, 400.0, 500.0, 600.0, 700.0, 800.0, 900.0, 1000.0, 1100.0],
        period: 1200.0
      },
      {
        stem: 'non-matching-scale',
        cents: [200.0, 350.0, 500.0, 700.0, 900.0, 1100.0],
        period: 1200.0
      }
    ]
    const result = computeSimilarScales(queryCents, 1200.0, library)
    expect(result.similar).toHaveLength(1)
    expect(result.children).toHaveLength(1)
    expect(result.parents).toHaveLength(1)

    expect(result.similar[0].stem).toBe('just-major')
    expect(result.children[0].stem).toBe('12tet')
    expect(result.parents[0].stem).toBe('just-major-pentatonic')
  })

  it('deduplicates modes when looking for similar scales', () => {
    const queryCents = [203.9, 386.3, 702.0, 884.4]
    const library = [
      { stem: 'major-pentatonic', cents: [200.0, 400.0, 700.0, 900.0], period: 1200.0 },
      { stem: 'minor-pentatonic', cents: [300.0, 500.0, 700.0, 1000.0], period: 1200.0 }
    ]
    const result = computeSimilarScales(queryCents, 1200.0, library)
    expect(result.similar).toHaveLength(1)
    expect(result.children).toHaveLength(0)
    expect(result.parents).toHaveLength(0)
  })
})
