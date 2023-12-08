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
    const { scale } = importer.parseText(text)

    expect(scale.getMonzo(0).totalCents()).toBe(0)

    expect(scale.getMonzo(1).toCents()).toBeCloseTo(91.44607)

    expect(scale.getMonzo(4).valueOf()).toBe(1.25)

    expect(scale.getMonzo(12).valueOf()).toBe(2)
  })

  it('can handle the shang user test scale', () => {
    const importer = new ScalaImporter()
    const { scale } = importer.parseText(SHANG_TEST_SCALE)

    expect(scale.getMonzo(1).valueOf()).toBeCloseTo(1.125)
    expect(scale.size).toBe(5)
  })

  it('can handle the zhi user test scale', () => {
    const importer = new ScalaImporter()
    const { scale } = importer.parseText(ZHI_TEST_SCALE)

    expect(scale.getMonzo(3).valueOf()).toBeCloseTo(1.5)
    expect(scale.size).toBe(5)
  })
})
