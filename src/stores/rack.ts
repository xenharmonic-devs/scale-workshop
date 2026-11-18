import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useScaleStore } from '@/stores/scale'
import { claimDock } from '@/composables/useDock'
import type { GeneratorResult } from '@/composables/useGeneratorPreview'
import type { GeneratorKind } from '@/rack/generators'
import { captureSettings, restoreSettings, type SettingsSnapshot } from '@/rack/settings'

/** One module in the rack: what its card last produced, and the settings that produced it. */
export type RackModule = {
  id: string
  kind: GeneratorKind
  /** The SonicWeave this stage contributes. Empty until a new card has produced something. */
  code: string
  /** A generator's scale name. */
  name: string
  baseFrequency?: number
  baseMidiNote?: number
  settings: SettingsSnapshot
}

/** What an undo step remembers of the rack, next to the scale data it produced. */
export type RackSnapshot = {
  generator: RackModule | null
  openId: string | null
}

/** How long edits must pause before they become one undo step (a slider drag is one step). */
const UNDO_SETTLE_MS = 400

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

/**
 * The Build Scale rack: one generator (and, later, a chain of modifiers) compiled into the
 * scale's source. The rack is the interception point between the cards and Scale data: cards
 * only update their module here, and the rack writes the compiled chain into `scale.sourceText`,
 * which is output only.
 *
 * Anything else that writes `scale.sourceText` (imports, presets, shared or legacy links, a
 * restored session, the MOS view, Modify scale for now) is adopted as an `imported` generator
 * holding that text, so the rack always describes what Scale data shows.
 */
export const useRackStore = defineStore('rack', () => {
  const scale = useScaleStore()

  const generator = ref<RackModule | null>(null)
  /** The one card that is open, or null when every card is collapsed. */
  const openId = ref<string | null>(null)

  /**
   * The compiled chain, or null while there is nothing to write yet (a new card that hasn't
   * produced code). Modifiers will be joined on after the generator, one statement block each,
   * since every SonicWeave modifier acts on the current scale `$`.
   */
  const output = computed<string | null>(() => {
    if (!generator.value) {
      return ''
    }
    return generator.value.code || null
  })

  // What the scale holds that came from the rack (or was adopted into it). Anything else in
  // `scale.sourceText` was written from outside and gets adopted.
  let lastWritten = ''
  let frame = 0
  let undoTimer: ReturnType<typeof setTimeout> | undefined

  function cancelFrame() {
    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
  }

  /** Writes the compiled chain into the scale. Runs at most once per animation frame. */
  function apply() {
    frame = 0
    const code = output.value
    if (code === null) {
      return
    }
    const module = generator.value
    let changed = false
    if (code !== scale.sourceText) {
      lastWritten = code
      scale.sourceText = code
      changed = true
    }
    if (!module) {
      scale.name = ''
    } else {
      scale.name = module.name
      if (module.baseFrequency !== undefined && module.baseFrequency !== scale.userBaseFrequency) {
        scale.userBaseFrequency = module.baseFrequency
        scale.autoFrequency = false
        changed = true
      }
      if (module.baseMidiNote !== undefined && module.baseMidiNote !== scale.baseMidiNote) {
        scale.baseMidiNote = module.baseMidiNote
        changed = true
      }
    }
    if (changed) {
      scale.computeScale(false)
    }
  }

  function schedule() {
    if (!frame) {
      frame = requestAnimationFrame(apply)
    }
  }

  /** Makes the pending edits one undo step once they settle. */
  function scheduleUndo() {
    clearTimeout(undoTimer)
    undoTimer = setTimeout(() => scale.history.pushState(), UNDO_SETTLE_MS)
  }

  watch(
    () => [
      output.value,
      generator.value?.name,
      generator.value?.baseFrequency,
      generator.value?.baseMidiNote
    ],
    schedule
  )

  /** Takes over a source written from outside the rack as an `imported` generator. */
  function adoptScaleSource() {
    if (scale.sourceText === lastWritten) {
      return
    }
    lastWritten = scale.sourceText
    cancelFrame()
    openId.value = null
    generator.value = scale.sourceText.trim()
      ? {
          id: newId(),
          kind: 'imported',
          code: scale.sourceText,
          name: scale.name,
          settings: {}
        }
      : null
  }

  watch(() => scale.sourceText, adoptScaleSource)

  // === Editing ===

  /** Opening a rack card closes any other docked card (Modify scale's, for now). */
  function collapseAll() {
    openId.value = null
  }

  /** Puts a fresh generator of this kind in the generator slot and opens its card. */
  function setGenerator(kind: GeneratorKind) {
    claimDock(collapseAll)
    const module: RackModule = {
      id: newId(),
      kind,
      code: '',
      name: '',
      settings: captureSettings()
    }
    generator.value = module
    openId.value = module.id
  }

  /** A card's latest result. Also records the settings behind it, for undo and reopening. */
  function updateGenerator(id: string, result: GeneratorResult) {
    const module = generator.value
    if (!module || module.id !== id) {
      return
    }
    // A card re-reports its result when it opens (after an undo, say). That's no edit, and
    // must not become an undo step, which would also drop the redo history.
    const changed =
      module.code !== result.source ||
      module.name !== result.name ||
      module.baseFrequency !== result.baseFrequency ||
      module.baseMidiNote !== result.baseMidiNote
    module.code = result.source
    module.name = result.name
    module.baseFrequency = result.baseFrequency
    module.baseMidiNote = result.baseMidiNote
    module.settings = captureSettings()
    if (changed) {
      scheduleUndo()
    }
  }

  function toggle(id: string) {
    if (openId.value === id) {
      openId.value = null
      return
    }
    const module = generator.value?.id === id ? generator.value : null
    if (!module) {
      return
    }
    claimDock(collapseAll)
    restoreSettings(module.settings)
    openId.value = id
  }

  function removeGenerator() {
    generator.value = null
    openId.value = null
    scheduleUndo()
  }

  // Whatever the scale already holds (a shared link, a restored session) becomes the rack's.
  adoptScaleSource()

  // === Undo ===

  scale.setUndoExtension({
    serialize(): RackSnapshot {
      // A snapshot must describe the scale data it is stored with.
      if (frame) {
        cancelFrame()
        apply()
      }
      adoptScaleSource()
      return clone({ generator: generator.value, openId: openId.value })
    },
    restore(data: unknown, sourceText: string) {
      cancelFrame()
      clearTimeout(undoTimer)
      lastWritten = sourceText
      const snapshot = data as RackSnapshot | null
      if (!snapshot) {
        // A step from before the rack existed: whatever it held is an imported scale.
        lastWritten = ''
        scale.sourceText = sourceText
        adoptScaleSource()
        return
      }
      generator.value = snapshot.generator ? clone(snapshot.generator) : null
      openId.value = snapshot.openId
      if (generator.value && generator.value.id === snapshot.openId) {
        restoreSettings(generator.value.settings)
      }
    }
  })

  return {
    generator,
    openId,
    output,
    setGenerator,
    updateGenerator,
    toggle,
    collapseAll,
    removeGenerator
  }
})
