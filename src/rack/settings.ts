import { useModalStore } from '@/stores/modal'
import { useHistoricalStore } from '@/stores/historical'
import { useLatticeStore, useRank2Store, useTemperStore } from '@/stores/tempering'
import { useApproximateByRatiosStore } from '@/stores/approximate-by-ratios'

/**
 * The cards keep their settings in shared Pinia stores, one value per field, so two modules of
 * the same kind would share them. Only one card is open at a time, though, so the stores can act
 * as the open card's editing buffer: a module keeps a copy of the settings it was made with, and
 * the rack loads that copy back into the stores before its card opens.
 *
 * Only plain values are copied (strings, numbers, booleans, plain arrays or objects of them, and
 * Sets of those, such as Subset's selection).
 * Parsed objects such as `Interval`s are skipped: each sits next to the string it was parsed
 * from, and the card re-parses that string when it mounts (`ScaleLineInput` emits on mount).
 */
export type SettingsSnapshot = Record<string, Record<string, unknown>>

/** The part of a Pinia store this file uses, shared by all four stores. */
type SettingsStore = {
  $state: Record<string, unknown>
  $patch: (mutate: (state: Record<string, unknown>) => void) => void
}

function storesById(): Record<string, SettingsStore> {
  return {
    modal: useModalStore(),
    rank2: useRank2Store(),
    lattice: useLatticeStore(),
    historical: useHistoricalStore(),
    temper: useTemperStore(),
    approximateByRatios: useApproximateByRatiosStore()
  } as unknown as Record<string, SettingsStore>
}

// Marks a captured Set, which JSON can't hold as one.
const SET = '__set__'

function isPlain(value: unknown): boolean {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return typeof value !== 'number' || Number.isFinite(value)
  }
  if (Array.isArray(value)) {
    return value.every(isPlain)
  }
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.values(value as object).every(isPlain)
  }
  return false
}

export function captureSettings(): SettingsSnapshot {
  const snapshot: SettingsSnapshot = {}
  for (const [id, store] of Object.entries(storesById())) {
    const fields: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(store.$state)) {
      if (value instanceof Set && [...value].every(isPlain)) {
        fields[key] = { [SET]: JSON.parse(JSON.stringify([...value])) }
      } else if (isPlain(value)) {
        fields[key] = JSON.parse(JSON.stringify(value))
      }
    }
    snapshot[id] = fields
  }
  return snapshot
}

export function restoreSettings(snapshot: SettingsSnapshot) {
  for (const [id, store] of Object.entries(storesById())) {
    const fields = snapshot[id]
    if (!fields) {
      continue
    }
    // Copies, so editing the open card never writes into the stored snapshot.
    const copy = JSON.parse(JSON.stringify(fields))
    store.$patch((state) => {
      for (const [key, value] of Object.entries(copy)) {
        if (!(key in state)) {
          continue
        }
        const current = state[key]
        if (current instanceof Set && value && typeof value === 'object' && SET in value) {
          // Refill the store's own (reactive) Set rather than replacing it.
          current.clear()
          for (const item of (value as Record<string, unknown[]>)[SET]) {
            current.add(item)
          }
        } else {
          state[key] = value
        }
      }
    })
  }
}
