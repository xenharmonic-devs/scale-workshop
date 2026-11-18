# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scale Workshop 3: a Vue 3 + Pinia + TypeScript single-page app (Vite) for designing omnitonal scales, playing them in the browser and exporting them to synth tuning formats. Scale data is written in the [SonicWeave](https://github.com/xenharmonic-devs/sonic-weave) DSL.

## Commands

```sh
npm install
npm run dev              # Vite dev server
npm run build            # type-check + production build (run in parallel)
npm run type-check       # vue-tsc only
npm run test:unit        # Vitest in watch mode (jsdom environment)
npm run lint             # oxlint then eslint, both with --fix
npm run lint-no-fix      # what CI runs
npm run format           # prettier on src/
npm run test:e2e:dev     # Cypress against the dev server (interactive)
npm run build && npm run test:e2e   # Cypress against the production build
```

Single test file / single test:

```sh
npx vitest run src/exporters/__tests__/scala.spec.ts
npx vitest run src/exporters/__tests__/scala.spec.ts -t "part of test name"
```

CI (`.github/workflows/node.js.yml`, Ubuntu + Windows, Node 25) runs `build`, `lint-no-fix` and `test:unit` (Vitest does a single run when `CI` is set).

Prettier style: no semicolons, single quotes, 100 column width, no trailing commas. `@` aliases `src/`.

Shared scale URLs need the separate [sw-server](https://github.com/xenharmonic-devs/sw-server) backend; `.env.development` points `VITE_API_URL` at `http://localhost:17461/`. Without it the app still runs, it just warns in the console.

## Architecture

### Scale data flow
- `src/stores/scale.ts` is the heart of the app. The user edits `sourceText` (SonicWeave code); `computeScale()` parses it with `sonic-weave/parser` and produces `relativeIntervals`, `colors`, `labels`, a `Scale` (`src/scale.ts`: interval ratios + base frequency, used for frequency lookup) and `frequencies` for the MIDI note range. App-specific builtins (e.g. `harmonicEntropy`) are injected into the SonicWeave visitor here.
- Scale generators (`src/components/modals/generation/`) and modifiers (`src/components/modals/modification/`) are lazy-loaded modals (`defineAsyncComponent` in `NewScale.vue` / `ModifyScale.vue`). They work by **rewriting `scale.sourceText`** (often by expanding the user-scope SonicWeave visitor) and then emitting `done`; the scale store recomputes from the text. Shared modal parameter state lives in `src/stores/modal.ts`.
- Undo/redo (`src/undo.ts`) snapshots serialized scale state with bounded capacity; `computeScale(pushUndo)` controls whether a snapshot is taken.

### Stores and persistence
- Each "live" Pinia store (`scale`, `audio`, `state`, `ji-lattice`, `grid`, `edo-cycles`) declares a `LIVE_STATE` object of refs plus `toJSON()` / `fromJSON()`. When adding a field that should survive sharing/session restore, add it to `LIVE_STATE` and to the serialized type. Any change to `LIVE_STATE` invalidates the uploaded scale id via `session-id.ts`.
- `src/upload-scale.ts` bundles all live stores into one payload and uploads it to the backend; `src/stores/session-id.ts` keeps the resulting id in the URL hash (`#id=...`) and a session list in `localStorage` so browser tabs are resumable. `/scale/:id` (`LoadScaleView.vue`) loads a shared scale.
- `src/stores/state.ts` holds UI preferences (persisted individually to `localStorage`) and transient runtime state such as held notes.
- Legacy Scale Workshop 1/2 query-string URLs are decoded by `src/url-encode.ts` and `src/scale-workshop-one.ts` (lazy-loaded) from `App.vue`.

### Audio, input, output
- `src/synth.ts` / `src/stores/audio.ts` wrap `sw-synth` (oscillators, timbres from `src/timbres.json`, delay). `src/virtual-synth.ts` handles pitch bend for virtual keyboards.
- `src/stores/midi.ts` + `src/midi.ts` use `webmidi` / `xen-midi` for MIDI I/O (including MTS SysEx and linear output modes).
- `src/keyboard-mapping.ts` maps QWERTY keys to scale degrees (isomorphic or piano-style layers).
- `App.vue` owns global keyboard/MIDI event handling and note on/off routing; `ScaleView.vue` is kept mounted across route changes to preserve state.

### Import / export
- `src/exporters/`: each format subclasses `BaseExporter` (`base.ts`, `ExporterParams`) and is registered in the `EXPORTERS` map in `index.ts`. Tests in `src/exporters/__tests__/` compare against fixture files.
- `src/importers/`: Scala (`.scl`/`.kbm`), AnaMark `.tun` and the xen-devs interchange format, registered in `index.ts`.

### Analysis / visualization
- `src/analysis.ts` (interval matrices, constant structure, variety etc.), lattice stores (`ji-lattice.ts`, `grid.ts`, `edo-cycles.ts`), and `harmonic-entropy` computed in a web worker (`src/harmonic-entropy-worker.ts`).
- Much of the music-theory math comes from sibling xenharmonic-devs packages (`xen-dev-utils`, `moment-of-symmetry`, `ji-lattice`, `isomorphic-qwerty`); check those before implementing a theory helper locally.

## Conventions
- Release notes go in `CHANGELOG.md` (newest version on top, `Feature:` / `Bug fix:` / `Maintenance:` prefixes with issue links).
- PRs target `main`; there is no separate development branch. Releases are git tags.
