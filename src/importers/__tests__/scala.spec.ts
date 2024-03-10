import { describe, it, expect } from 'vitest'

import { ScalaImporter } from '../scala'
// @ts-ignore
import SHANG_TEST_SCALE from './shang_pentatonic.scl?raw'
// @ts-ignore
import ZHI_TEST_SCALE from './zhi_pentatonic.scl?raw'

describe('Scala importer', () => {
  it('can handle all line types', () => {
    const text = [
      '! meanschis.scl',
      '!',
      '1/8-schisma temperament, Helmholtz',
      ' 12',
      '!',
      ' 91.44607 C#',
      ' 203.42157',
      ' 294.86764',
      ' 5/4 E',
      ' 498.28921',
      ' 589.73529',
      ' 701.71079',
      ' 793.15686',
      ' 884.60293',
      '     996.57843',
      ' 1088.02450',
      ' 2 C'
    ].join('\n')

    const importer = new ScalaImporter()
    const { sourceText } = importer.parseText(text)
    const lines = sourceText.split('\n')

    expect(lines[0]).toBe('91.44607 "C#"')

    expect(lines[3]).toBe('5/4 "E"')

    expect(lines[11]).toBe('2 "C"')
  })

  it('can handle the shang user test scale', () => {
    const importer = new ScalaImporter()
    const { sourceText } = importer.parseText(SHANG_TEST_SCALE)
    const lines = sourceText.split('\n')

    expect(lines[0]).toBe('9/8 "gong"')
    expect(lines).toHaveLength(5)
  })

  it('can handle the zhi user test scale', () => {
    const importer = new ScalaImporter()
    const { sourceText } = importer.parseText(ZHI_TEST_SCALE)
    const lines = sourceText.split('\n')

    expect(lines[2]).toBe('3/2 "gong宮"')
    expect(lines).toHaveLength(5)
  })
})
