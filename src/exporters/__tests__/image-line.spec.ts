import { createHash } from 'crypto'
import { describe, it, expect } from 'vitest'

import { HarmorExporter, SytrusExporter } from '../image-line'

import { getTestData } from './test-data'

describe('Image-line exporters', () => {
  it('can handle all line types (Harmor)', () => {
    const params = getTestData('Image-line exporter unit test v0.0.0')
    const exporter = new HarmorExporter(params)
    const content = exporter.getFileContents(5)

    // Raw binary files are inconvenient so we're content with hashes.
    expect(createHash('sha256').update(content).digest('base64')).toBe(
      'N8zUnnSynllC7frwlQzp5Tkvo/TgYBrPJkfZip1ljZs='
    )
    // Note that the contents are floating-point sensitive to minor changes in frequency calculation
  })

  it('can handle all line types (Sytrus)', () => {
    const params = getTestData('Image-line exporter unit test v0.0.0')
    const exporter = new SytrusExporter(params)
    const content = exporter.getFileContents(4)

    expect(createHash('sha256').update(content).digest('base64')).toBe(
      'GR/TxsBZm7Bihd1wlSE5HiNrDTDUTPFUP3vK5geAYII='
    )
  })
})
