import { describe, it, expect } from 'vitest'

import PureDataExporter from '../pure-data'

import { getTestData } from './test-data'

describe('PureData exporter', () => {
  it('can handle all line types', () => {
    const params = getTestData('')
    const exporter = new PureDataExporter(params)
    expect(exporter.getFileContents().match(/\n/g) || []).toHaveLength(128)
  })
})
