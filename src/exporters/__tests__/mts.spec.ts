import { createHash } from 'crypto'
import { describe, it, expect } from 'vitest'

import { getTestData } from './test-data'
import MtsSysexExporter from '../mts-sysex'

describe('MTS exporter', () => {
  it('can handle all line types', async () => {
    const params = getTestData('MTS Sysex Bulk Tuning Dump exporter unit test v0.0.0')
    params.presetIndex = 1

    const exporter = new MtsSysexExporter(params)

    const scaleData = exporter.getBulkTuningData()
    expect(createHash('sha256').update(scaleData).digest('base64')).toBe(
      'NLwkn1HRQKdNAyYdxl6RQwfz0JvFyShWaB0DHHtPVZo='
    )

    // Name is padded with spaces
    const nameData = exporter.getNameData()
    expect(nameData).toEqual([84, 101, 115, 116, 32, 83, 99, 97, 108, 101, 32, 32, 32, 32, 32, 32])

    const sysExMsg = exporter.buildSysExDump()
    expect(createHash('sha256').update(sysExMsg).digest('base64')).toBe(
      'Ghut5DZnxeRXQE0TbOJl6Sh66xI2x1QouHhVhIdQXrQ='
    )
  })

  it('can gracefully handle invalid parameters', async () => {
    const params = getTestData('MTS Sysex Bulk Tuning Dump exporter unit test v0.0.0')
    params.scale.title = 'Super Special Test Scale'
    params.presetIndex = -1

    const exporter = new MtsSysexExporter(params)

    const scaleData = exporter.getBulkTuningData()
    expect(createHash('sha256').update(scaleData).digest('base64')).toBe(
      'NLwkn1HRQKdNAyYdxl6RQwfz0JvFyShWaB0DHHtPVZo='
    )

    // Name is truncated
    const nameData = exporter.getNameData()
    expect(nameData).toEqual([
      83, 117, 112, 101, 114, 32, 83, 112, 101, 99, 105, 97, 108, 32, 84, 101
    ])

    const sysExMsg = exporter.buildSysExDump()
    expect(createHash('sha256').update(sysExMsg).digest('base64')).toBe(
      'T1Zs8dZGlznhsgEqRxZJFvLT3yc3UAbtWSanZZ1pvHU='
    )
  })
})
