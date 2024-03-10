import { describe, it, expect } from 'vitest'

import { AnaMarkImporter } from '../anamark'
// @ts-ignore
import UNIT_TEST_SCALE from './unittestscale.tun?raw'

describe('Anamark importer', () => {
  it('can parse text', () => {
    const importer = new AnaMarkImporter()
    const { sourceText, name, baseMidiNote, baseFrequency } = importer.parseText(UNIT_TEST_SCALE, 'unittestscale.tun')
    const lines = sourceText.split('\n')

    expect(lines[0]).toBe('111.00000')

    expect(name).toBe('Unit Test Scale')
    expect(baseFrequency).toBeCloseTo(444)
    expect(baseMidiNote).toBe(68)
  })
})
