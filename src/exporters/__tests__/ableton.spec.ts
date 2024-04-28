import { describe, it, expect } from 'vitest'

import AbletonAsclExporter from '../ableton'
import { getTestData } from './test-data'
import { NEWLINE_TEST, UNIX_NEWLINE, WINDOWS_NEWLINE } from '../../constants'

const NEWLINE = process.platform === 'linux' ? UNIX_NEWLINE : WINDOWS_NEWLINE

describe('Scala exporters', () => {
  it('can handle all line types', () => {
    const params = getTestData('Ableton exporter unit test v0.0.0')
    const sclExporter = new AbletonAsclExporter(params)
    const expectedAsclContents =
      `
      ! test.ascl
      ! Created using Ableton exporter unit test v0.0.0
      !
      Test Scale
      !
      ! default tuning: degree 0 = 440.00000000 Hz
      !
      6
      !
      100.00000000 ! 100.
      960.00000000 ! 4\\5
      5/3 ! 5/3
      531.23404907 ! 1,3591409142295225
      107.53144798 ! 3486784401/3276800000
      2/1 ! 2/1
      !
      ! @ABL NOTE_NAMES "2/1" "100." "4\\5" "5/3" "1,3591409142295225" "3486784401/3276800000"
      ! @ABL REFERENCE_PITCH 4 0 440.00000000
      ! @ABL SOURCE Scale Workshop / Xenharmonic developers
      ! @ABL LINK https://sevish.com/scaleworkshop/
    `
        .split(NEWLINE_TEST)
        .map((l) => l.trim())
        .filter(Boolean)
        .join(NEWLINE) + NEWLINE
    expect(sclExporter.getFileContents()).toBe(expectedAsclContents)
  })
})
