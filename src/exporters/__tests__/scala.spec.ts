import { describe, it, expect } from 'vitest'

import { ScalaSclExporter, ScalaKbmExporter } from '../scala'
import { getTestData } from './test-data'
import { UNIX_NEWLINE, WINDOWS_NEWLINE } from '../../constants';

const NEWLINE = process.platform === 'linux' ? UNIX_NEWLINE : WINDOWS_NEWLINE;

describe('Scala exporters', () => {
  it('can handle all line types', () => {
    const params = getTestData('Scala exporter unit test v0.0.0')
    const sclExporter = new ScalaSclExporter(params)
    const expectedSclContents = [
      '! test.scl',
      '! Created using Scala exporter unit test v0.0.0',
      '!',
      '! https://sevish.com/scaleworkshop/',
      '!',
      'Test Scale',
      ' 6',
      '!',
      ' 100.000000',
      ' 960.000000',
      ' 5/3',
      ' 531.234049',
      ' 107.531448',
      ' 2/1',
      ''
    ].join(NEWLINE)
    expect(sclExporter.getFileContents()).toBe(expectedSclContents)

    const kbmExporter = new ScalaKbmExporter(params)
    const expectedKbmContents = [
      '! Template for a keyboard mapping',
      '!',
      '! Size of map. The pattern repeats every so many keys:',
      '6',
      '! First MIDI note number to retune:',
      '0',
      '! Last MIDI note number to retune:',
      '127',
      '! Middle note where the first entry of the mapping is mapped to:',
      '69',
      '! Reference note for which frequency is given:',
      '69',
      '! Frequency to tune the above note to',
      '440',
      '! Scale degree to consider as formal octave (determines difference in pitch',
      '! between adjacent mapping patterns):',
      '6',
      '! Mapping.',
      '! The numbers represent scale degrees mapped to keys. The first entry is for',
      '! the given middle note, the next for subsequent higher keys.',
      '! For an unmapped key, put in an "x". At the end, unmapped keys may be left out.',
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      ''
    ].join(NEWLINE)

    expect(kbmExporter.getFileContents()).toBe(expectedKbmContents)
  })
})
