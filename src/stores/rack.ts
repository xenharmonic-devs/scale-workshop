import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useScaleStore } from '@/stores/scale'
import type { GeneratorResult } from '@/composables/useGeneratorPreview'
import type { GeneratorKind } from '@/rack/generators'
import { modifierDefinition, type ModifierKind } from '@/rack/modifiers'
import { captureSettings, restoreSettings, type SettingsSnapshot } from '@/rack/settings'
import type { StageInput } from '@/rack/stage-input'

/** One module in the rack: what its card last produced, and the settings that produced it. */
export type RackModule = {
  id: string
  role: 'generator' | 'modifier'
  kind: GeneratorKind | ModifierKind
  /** The SonicWeave this stage contributes. Empty until a new card has produced something. */
  code: string
  /** A generator's scale name, or what a modifier does with its settings (the card summary). */
  name: string
  baseFrequency?: number
  baseMidiNote?: number
  settings: SettingsSnapshot
  /** Skipped by the chain. */
  bypassed: boolean
  /** For a modifier whose code bakes its input: the chain above it when it was built. */
  builtFrom?: string
}

/** What an undo step remembers of the rack, next to the scale data it produced. */
export type RackSnapshot = {
  generator: RackModule | null
  modifiers: RackModule[]
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * The Build Scale rack, after the Performer's: one generator followed by a chain of modifiers,
 * compiled into the scale's source. SonicWeave modifiers act on the current scale, so the chain
 * is the stages' code joined in order, and a bypassed stage is simply left out.
 *
 * The rack is the interception point between the cards and Scale data: cards only update their
 * module here, and the rack writes the compiled chain into `scale.sourceText`, which is output
 * only. Anything else that writes it (imports, presets, shared or legacy links, a restored
 * session, the MOS view) is adopted as an `imported` generator holding that text, so the rack
 * always describes what Scale data shows.
 */
export const useRackStore = defineStore('rack', () => {
  const scale = useScaleStore()

  const generator = ref<RackModule | null>(null)
  const modifiers = ref<RackModule[]>([])
  /** The one card that is open, or null when every card is collapsed. */
  const openId = ref<string | null>(null)
  /** The first stage the chain fails at, with the error, keyed by module id. */
  const stageErrors = ref<Record<string, string>>({})

  const modules = computed(() =>
    generator.value ? [generator.value, ...modifiers.value] : [...modifiers.value]
  )

  function findModule(id: string | null) {
    return modules.value.find((module) => module.id === id) ?? null
  }

  /** The chain's code up to `id` (exclusive), or null when the chain doesn't run. */
  function inputCode(id: string): string | null {
    if (!generator.value?.code) {
      return null
    }
    const parts = [generator.value.code]
    for (const module of modifiers.value) {
      if (module.id === id) {
        break
      }
      if (!module.bypassed && module.code) {
        parts.push(module.code)
      }
    }
    return parts.join('\n')
  }

  /**
   * The compiled chain, or null while there is nothing to write yet (a new generator card that
   * hasn't produced code). With no generator nothing runs, modifiers included.
   */
  const output = computed<string | null>(() => {
    if (!generator.value) {
      return ''
    }
    if (!generator.value.code) {
      return null
    }
    return [generator.value, ...modifiers.value]
      .filter((module) => !module.bypassed && module.code)
      .map((module) => module.code)
      .join('\n')
  })

  /** Modifiers whose baked code was built from a different input than they now receive. */
  const staleIds = computed(() => {
    const result = new Set<string>()
    for (const module of modifiers.value) {
      if (module.builtFrom !== undefined && module.builtFrom !== inputCode(module.id)) {
        result.add(module.id)
      }
    }
    return result
  })

  /**
   * What a modifier card works on, or null when nothing reaches it (no generator code yet, or
   * the chain above it fails).
   */
  function stageInput(id: string): StageInput | null {
    const code = inputCode(id)
    if (code === null) {
      return null
    }
    try {
      return { code, ...scale.evaluateStage(code) }
    } catch {
      return null
    }
  }

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

  /** Finds the stage the chain first fails at, once the whole chain has failed. */
  function locateError() {
    const errors: Record<string, string> = {}
    if (scale.error && generator.value) {
      const stages = [generator.value, ...modifiers.value].filter(
        (module) => !module.bypassed && module.code
      )
      let code = ''
      for (const module of stages) {
        code = code ? `${code}\n${module.code}` : module.code
        try {
          scale.evaluateStage(code)
        } catch (error) {
          errors[module.id] = errorMessage(error)
          break
        }
      }
    }
    stageErrors.value = errors
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
      locateError()
    }
  }

  function schedule() {
    if (!frame) {
      frame = requestAnimationFrame(apply)
    }
  }

  /**
   * Writes any pending change now, e.g. before reading the scale it produces. A change made in
   * this same tick may not have scheduled its frame yet, so this doesn't wait for one. Text
   * written from outside is adopted first, so it is never overwritten by a stale chain.
   */
  function flush() {
    adoptScaleSource()
    cancelFrame()
    apply()
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
    // The text is the whole scale, so nothing that was chained before still applies.
    modifiers.value = []
    stageErrors.value = {}
    generator.value = scale.sourceText.trim()
      ? {
          id: newId(),
          role: 'generator',
          kind: 'imported',
          code: scale.sourceText,
          name: scale.name,
          settings: {},
          bypassed: false
        }
      : null
  }

  watch(() => scale.sourceText, adoptScaleSource)

  // Whatever the scale already holds (a shared link, a restored session) becomes the rack's.
  adoptScaleSource()

  // === Editing ===

  function collapseAll() {
    openId.value = null
  }

  function newModule(role: RackModule['role'], kind: RackModule['kind']): RackModule {
    return {
      id: newId(),
      role,
      kind,
      code: '',
      name: '',
      settings: captureSettings(),
      bypassed: false
    }
  }

  /** Puts a fresh generator of this kind in the generator slot (keeping the modifiers). */
  function setGenerator(kind: GeneratorKind) {
    const module = newModule('generator', kind)
    generator.value = module
    openId.value = module.id
  }

  /**
   * Appends a modifier and opens its card. While the scale is the default 12-TET (an empty rack,
   * or an imported scale without notes) that default is written out first and becomes the
   * generator, so there is something to modify with its labels and colors. A generator card that
   * hasn't produced its code yet is left alone: the chain runs once it has. `setup` runs once the
   * scale reflects the whole chain (this modifier's input), before the settings are captured.
   */
  function addModifier(kind: ModifierKind, setup?: () => void) {
    flush()
    if (!generator.value || generator.value.kind === 'imported') {
      scale.materializeDefaultScale()
      adoptScaleSource()
    }
    setup?.()
    const definition = modifierDefinition(kind)
    const module = newModule('modifier', kind)
    module.code = definition.code ?? ''
    module.name = definition.summary ?? ''
    modifiers.value.push(module)
    openId.value = definition.component ? module.id : null
    scheduleUndo()
  }

  /** A card's latest result. Also records the settings behind it, for undo and reopening. */
  function updateModule(id: string, result: GeneratorResult) {
    const module = findModule(id)
    if (!module) {
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
    if (module.role === 'modifier' && result.bakesInput) {
      module.builtFrom = inputCode(module.id) ?? ''
    } else {
      delete module.builtFrom
    }
    if (changed) {
      scheduleUndo()
    }
  }

  function toggle(id: string) {
    if (openId.value === id) {
      openId.value = null
      return
    }
    const module = findModule(id)
    if (!module) {
      return
    }
    restoreSettings(module.settings)
    openId.value = id
  }

  function removeModule(id: string) {
    if (generator.value?.id === id) {
      generator.value = null
    } else {
      modifiers.value = modifiers.value.filter((module) => module.id !== id)
    }
    if (openId.value === id) {
      openId.value = null
    }
    scheduleUndo()
  }

  function removeGenerator() {
    if (generator.value) {
      removeModule(generator.value.id)
    }
  }

  /** Moves a modifier to another place in the chain. */
  function moveModifier(from: number, to: number) {
    const list = [...modifiers.value]
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
      return
    }
    const [module] = list.splice(from, 1)
    list.splice(to, 0, module)
    modifiers.value = list
    scheduleUndo()
  }

  function toggleBypass(id: string) {
    const module = modifiers.value.find((m) => m.id === id)
    if (module) {
      module.bypassed = !module.bypassed
      scheduleUndo()
    }
  }

  // === Undo ===

  scale.setUndoExtension({
    serialize(): RackSnapshot {
      // A snapshot must describe the scale data it is stored with.
      flush()
      return clone({
        generator: generator.value,
        modifiers: modifiers.value,
        openId: openId.value
      })
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
      modifiers.value = clone(snapshot.modifiers ?? [])
      openId.value = snapshot.openId
      const open = findModule(snapshot.openId)
      if (open) {
        restoreSettings(open.settings)
      }
      stageErrors.value = {}
    }
  })

  return {
    generator,
    modifiers,
    openId,
    output,
    stageErrors,
    staleIds,
    stageInput,
    inputCode,
    setGenerator,
    addModifier,
    updateModule,
    toggle,
    collapseAll,
    removeModule,
    removeGenerator,
    moveModifier,
    toggleBypass
  }
})
