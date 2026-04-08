import { afterEach, describe, expect, it, vi } from 'vitest'

import { getRandomValuesCompat, randomUuidCompat } from '@/platform-compat'

describe('platform compat', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fills typed arrays when crypto is missing', () => {
    vi.stubGlobal('crypto', undefined)
    const bytes = new Uint8Array(8)

    const result = getRandomValuesCompat(bytes)

    expect(result).toBe(bytes)
    expect([...bytes].some((byte) => byte !== 0)).toBe(true)
  })

  it('creates a UUID when crypto.randomUUID is missing', () => {
    vi.stubGlobal('crypto', undefined)

    const uuid = randomUuidCompat()

    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('uses native crypto APIs when available', () => {
    const getRandomValues = vi.fn((typedArray: Uint8Array) => {
      typedArray.fill(7)
      return typedArray
    })
    const randomUUID = vi.fn(() => '11111111-1111-4111-8111-111111111111')

    vi.stubGlobal('crypto', { getRandomValues, randomUUID })

    const bytes = getRandomValuesCompat(new Uint8Array(4))
    const uuid = randomUuidCompat()

    expect(getRandomValues).toHaveBeenCalledTimes(1)
    expect(randomUUID).toHaveBeenCalledTimes(1)
    expect(bytes).toEqual(new Uint8Array([7, 7, 7, 7]))
    expect(uuid).toBe('11111111-1111-4111-8111-111111111111')
  })
})
