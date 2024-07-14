import { describe, it, expect } from 'vitest'

import SonicWeaveInterchangeExporter from '../xen-devs'

import { getTestData } from './test-data'

describe('SonicWeave Interchange exporter', () => {
  it('can handle all line types', () => {
    const params = getTestData('SWI exporter unit test v0.0.0')
    const exporter = new SonicWeaveInterchangeExporter(params)
    expect(exporter.getFileContents()).toBe(`(* Created using SWI exporter unit test v0.0.0 *)

"Test Scale"
[1/12> "" niente
[1 1 -1> "" niente
[4/5> "" niente
[0 -1 1> "" niente
[531.234049066756>@rc "" niente
[-20 20 -5> "" niente
[1> "" niente
`)
  })
})
