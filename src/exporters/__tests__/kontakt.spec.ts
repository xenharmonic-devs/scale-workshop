import { describe, it, expect } from 'vitest'

import KontaktExporter from '../kontakt'

// @ts-ignore
import EXPECTED_CONTENT from './kontakt.txt?raw'
import { getTestData } from './test-data'

describe('Max/MSP exporter', () => {
  it('can handle all line types', () => {
    const params = getTestData('Kontakt tuning script exporter unit test v0.0.0')
    const exporter = new KontaktExporter(params)
    expect(exporter.getFileContents()).toBe(EXPECTED_CONTENT)
  })

  it('can disable sample remapping', () => {
    const params = getTestData('Kontakt tuning script exporter unit test v0.0.0')
    params.remapKontaktSamples = false
    const exporter = new KontaktExporter(params)
    const fileContents = exporter.getFileContents()

    for (let i = 0; i < 128; i++) {
      expect(fileContents).toContain(`%keynum[${i}] := ${i}`)
    }
    expect(fileContents).toContain('%tune[30] := -2340000')
    expect(fileContents).toContain('%tune[100] := 2660000')
  })
})
