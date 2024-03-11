import { describe, it, expect } from 'vitest'

import PureDataExporter from '../pure-data'

import { getTestData } from './test-data'

// @ts-ignore
import EXPECTED_CONTENT from './pure-data.txt?raw'

describe('PureData exporter', () => {
  it('can handle all line types', () => {
    const params = getTestData('')
    const exporter = new PureDataExporter(params)
    expect(exporter.getFileContents()).toBe(EXPECTED_CONTENT)
  })
})
