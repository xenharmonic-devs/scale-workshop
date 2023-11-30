import { describe, it, expect } from 'vitest'

import SoniccoutureExporter from '../soniccouture'

// @ts-ignore
import EXPECTED_CONTENT from './soniccouture.nka?raw'
import { getTestData } from './test-data'

describe('Soniccouture exporter', () => {
  it('can handle all line types', () => {
    const params = getTestData('Soniccouture exporter unit test v0.0.0')
    const exporter = new SoniccoutureExporter(params)
    expect(exporter.getFileContents()).toBe(EXPECTED_CONTENT)
  })
})
