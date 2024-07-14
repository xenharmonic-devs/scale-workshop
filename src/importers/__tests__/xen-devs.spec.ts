import { describe, it, expect } from 'vitest'

import { SonicWeaveInterchangeImporter } from '../xen-devs'

describe('SonicWeave Interchange importer', () => {
  it('can parse text', () => {
    const importer = new SonicWeaveInterchangeImporter()
    const { sourceText, name } = importer.parseText(`
      (* Created using SWI exporter unit test v0.0.0 *)

      "Unit Test Scale"

      1 = [1 3 1 1>@Hz.2.5.11

      [1/12> "" niente
      [1 1 -1> "" niente
      [4/5> "" niente
      [0 -1 1> "" niente
      [531.234049066756>@rc "" niente
      [-20 20 -5> "" niente
      [1> "" niente
    `)

    expect(name).toBe('Unit Test Scale')
    expect(sourceText).toBe(`"Unit Test Scale"
1/1 = 440 Hz
1\\12
6/5
4\\5
5/3
531.2340490667464r¢
3486784401/3276800000
2`)
  })
})
