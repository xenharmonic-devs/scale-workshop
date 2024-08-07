import { describe, it, expect } from 'vitest'

import { ScalaImporter } from '../scala'
import { NEWLINE_TEST } from '../../constants'
// @ts-ignore
import SHANG_TEST_SCALE from './shang_pentatonic.scl?raw'
// @ts-ignore
import ZHI_TEST_SCALE from './zhi_pentatonic.scl?raw'
// @ts-ignore
import BRUN_WILSONIC from './brun_wilsonic.scl?raw'

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
    const { name, sourceText } = importer.parseText(text)
    const lines = sourceText.split('\n')

    expect(name).toBe('1/8-schisma temperament, Helmholtz')

    expect(lines[0]).toBe('91.44607 "C#"')

    expect(lines[3]).toBe('5/4 "E"')

    expect(lines[11]).toBe('2 "C"')
  })

  it('can handle the shang user test scale', () => {
    const importer = new ScalaImporter()
    const { name, sourceText } = importer.parseText(SHANG_TEST_SCALE)
    const lines = sourceText.split('\n')

    expect(name).toBe(
      'The pentatonic scale in the shang mode, generated by the up-and-down generation procedure as described in the Guan Zi.'
    )
    expect(lines[0]).toBe('9/8 "gong"')
    expect(lines[1]).toBe('4/3 "yu"')
    expect(lines).toHaveLength(5)
  })

  it('can handle the zhi user test scale', () => {
    const importer = new ScalaImporter()
    const { name, sourceText } = importer.parseText(ZHI_TEST_SCALE)
    const lines = sourceText.split('\n')

    expect(name).toBe(
      'The pentatonic scale in the zhi mode, generated by the up-and-down generation procedure as described in the Guan Zi.'
    )
    expect(lines[1]).toBe('4/3 "shang 商"')
    expect(lines[2]).toBe('3/2 "gong 宮"')
    expect(lines).toHaveLength(5)
  })

  it('can handle the wilsonic test scale', () => {
    const importer = new ScalaImporter()
    const { name, sourceText } = importer.parseText(BRUN_WILSONIC)
    expect(name).toBe('Brun3: G1:0.2000,G0:0.5833,O:1,AB,L:4,NPO=7,M=0')
    expect(sourceText.split(NEWLINE_TEST)).toEqual([
      '239.999968',
      '260.000020',
      '499.999952',
      '699.999905',
      '939.999819',
      '959.999871',
      '2/1'
    ])
  })
})
