# scale-workshop

![Scale Workshop screenshot](https://raw.githubusercontent.com/xenharmonic-devs/scale-workshop/main/src/assets/img/opengraph-image.png)

## Description

[Scale Workshop](https://scaleworkshop.plainsound.org/) allows you to design microtonal scales and play them in your web browser. Export your scales for use with VST instruments. Convert Scala files to various tuning formats.

## Frequently Asked Questions

### What kinds of microtonal scales are possible with Scale Workshop?

Scale Workshop can play any kind of microtonal scale, such as equal temperaments, just intonation, historical and traditional scales, non-octave scales, and any arbitrary tunings. The application offers a few methods to generate scales automatically based on parameters you set, or otherwise you can enter your scale data manually.

### Can I play and hear my scale?

Yes, the built-in synth allows you to play your scales within the web browser. If your browser supports web MIDI then you can use a connected MIDI device to play notes. Otherwise you can use your computer keyboard (e.g. a QWERTY keyboard) as an isomorphic keyboard controller to hear your scales. You can also play on a touch device using the 'Touch Keyboard' feature.

### Can I use my computer keyboard as a piano
Yes, go to the Synth tab and select *Piano-style layers* as the *Keyboard mode*. There are two options: ASDF for white keys and QWERTY for black keys **or** QWERTY for white keys and digits for black keys with another set of keys an octave lower starting from ZXCV with ASDF as the black keys. There's also a third option for keyboards that have an extra key between the left shift and Z. When using *Piano-style layers* make sure that the number of key colors matches the size of your scale. Some scale generators such as *Moment of Symmetry* allow you to auto-generate the key colors.

### Can I use Scale Workshop to tune up other synths?

Scale Workshop supports any synth that uses Scala (.scl/.kbm) files or AnaMark TUN (.tun) files. It can also export Native Instruments Kontakt tuning scripts, Max/MSP coll tuning tables and Pure Data text tuning tables.

The Xen Wiki has a [list of microtonal software plugins](https://en.xen.wiki/w/List_of_Microtonal_Software_Plugins) that support Scala and AnaMark files.

### How do I enter scale/tuning data manually?

Scale data should be entered in to the large text field labeled ‘Scale data’. Add each note on its own new line. Cents and ratios are both supported.

* To specify a ratio, simply write it in the format e.g. `3/2`
* To specify an interval in cents, include a . in the line e.g. `701.9` or `1200.`
* To specify n steps out of m-EDO, write it in the format `n\m`
* To specify arbitrary EDJI values, write it in the format `n\m<p/q>`
* To specify a decimal ratio, include a , in the line e.g. `1,5` or `3,14159`
* To specify a [monzo](https://en.xen.wiki/w/Monzo) enclose the exponents inside a square bracket and a closing angle bracket e.g. `[-1 1 0>`
* You can combine intervals using + e.g. `4/3 + 1.23`

No need to enter `0.` or `1/1` on the first line as your scale is automatically assumed to contain this interval.

The interval on the final line is assumed to be your interval of equivalence (i.e. your octave or pseudo-octave a.k.a. equave).

Don't add any other weird data to a line. Don't try to mix decimals with ratios (e.g. `2/1.5`). Scale Workshop will try to gracefully ignore any rubbish that you put in, but it's very possible that weird stuff will happen.

### Can I copy and paste the contents of a Scala file (.scl) directly into the 'Scale data' field?

Scala files contain non-tuning related comments at the top of the file, so Scale Workshop will throw an error if you try to paste them in directly. Instead you can use the *‘Import .scl’* function, which automatically removes those comments for you. Or you can paste the Scala file but remove the comments manually.

### Can I convert a TUN file to another format?

Yes, start by clicking *New > Import .tun* and then load your TUN file into Scale Workshop. Then click Export and select your desired output format. Note that Scale Workshop is not a fully compliant AnaMark TUN v2 parser, however it should be able to read TUN files exported by Scala and Scale Workshop.

### How do I make my own keyboard mapping?

Keyboard mappings are not currently supported. You can still export a Scala keyboard mapping file (.kbm) but it will assume a linear mapping.
However you can always use duplicate lines in your tuning in order to skip any keys that you don't want to include, or write your .kbm file manually.

### Can I undo/redo?

Use your browser's Back/Forward navigation buttons to undo/redo changes to your tuning.

### How can I share my tunings with a collaborator?

Use *Export current settings > Share scale* found on the third column of the *Build Scale* tab. The given URL can be copied and pasted to another person. When they open the link they will see a Scale Workshop page with your scale already tuned in.

### How can I save my work for later?

You can bookmark the current page to save your work for later. This works because your tuning data is stored within the bookmarked URL.

### When I export a tuning, I get a weird filename, why?

Exporting a file with the correct filename is not supported in Safari (iOS and macOS). You can try to use Firefox, Chrome or Opera instead.

### Can I run this software offline?

Yes, but you need to have `npm` installed and you need to build the project manually. Just follow the instructions for developers at the bottom of this README.

### Can you add a new feature to Scale Workshop?

Probably! Just add your feature request to the [issue tracker](https://github.com/xenharmonic-devs/scale-workshop/issues) on GitHub.

### I found a bug

Please [create a bug report](https://github.com/xenharmonic-devs/scale-workshop/issues) detailing the steps to reproduce the issue. You should also include which web browser and OS you are using.

### Where is the project hosted

* Stable releases are at https://scaleworkshop.plainsound.org/
* Slow-cycle stable releases are at https://sevish.com/scaleworkshop/
* Nightly snapshots are deployed to https://scaleworkshop.lumipakkanen.com/

#### Archived versions
* Version 2.1.0 https://sevish.com/scaleworkshop-dev/
* Version 1.5 https://sevish.com/scaleworkshop1/

## Documentation

User documentation is hosted on Github in the [project wiki](https://github.com/xenharmonic-devs/scale-workshop/wiki).

## Contributing

Please base any work on `main` branch, and make pull requests against `main` as well. There is no separate development branch. Releases will be denoted using git tags.

## Changelog


## 2.2.1
 * Feature: Stretch scale to match a specified interval
 * Feature: Merge an offset copy of the scale with the original
 * Feature: On-screen QWERTY keyboard (for playing) can now be enabled in the preferences
 * Feature: Light-weight algorithms for tempering in extremely large just intonation subgroups
 * Feature: Visualize how the various MIDI mappings assign scale degrees
 * Feature: Implement visual MIDI channel indicators
 * Feature: Interprete non-integer equal temperaments as cET
 * Feature: Implement basic reverb using a ping-pong delay
 * Feature: Implement new metric prefixes from quecto to quetta
 * Standardization: Rename reference pitch to A4
 * Bug fix: Text inputs no longer disappears when filled with invalid intervals
 * Bug fix: Import base frequency from Anamark v2 tunings
 * Bug fix: Support monzo syntax in most modal dialogs that accept intervals
 * Bug fix: Show values that more accurately represent the scale in the interval matrix
 * Bug fix: Respect the preferred number of signifying digits when manipulating the scale
 * Bug fix: Make sure that the text always fits in the chord wheels on the Analysis tab
 * Bug fix: Fix issues with multiple touches on the virtual keyboard
 * Bug fix: Prevent garbage lines turning into valid URL data
 * Bug fix: Make sure the base MIDI note is an integer
 * Bug fix: Adhere to Korg maximum cents limits


## 2.2.0
 * Feature: Improved Korg export including Minilogue XD
 * Feature: Export MTS SysEx dumps
 * Feature: Single val tempering can now produce N-of-EDO steps
 * Bug fix: Fix how `1/1` are spelled `1\1` after equalizing the scale

## 2.1.2
 * Bug fix: Make the syntax more consistent

## 2.1.1
* Feature: A new tab for visualizing 23-limit just intonation lattices
* Bug fix: The "Not Found" page should again produce the intended easter egg

## 2.1.0
* Feature: New *Modify scale* option for merging an offset copy with the scale
* Feature: On-screen QWERTY keyboard now available if enabled in the *Preferences* tab.
* Feature: Loading preset scales now assigns corresponding key colors as well
* Feature: Replaced top export with simple URL copy to clipboard
* Feature: Rank-2 scales can now be manipulated interactively by clicking on the period circle in a new tab inside the modal for *New scale → Rank-2 temperament*
* Refactoring: Core functionality now at [scale-workshop-core](https://github.com/xenharmonic-devs/scale-workshop-core) for better reusability
* Refactoring: Utility packages [xen-dev-utils](https://www.npmjs.com/package/xen-dev-utils), [moment-of-symmetry](https://www.npmjs.com/package/moment-of-symmetry) and [temperaments](https://www.npmjs.com/package/temperaments) are now sourced from npm.
* Bug fix: Decimal dots in the interval matrix is now consistent with the tunng table
* Bug fix: Touching the screen in piano layout played multiple notes in unison
* Bug fix: Typing out text in some of the scale creation modals made sound
* Bug fix: Disable browser specific features like quick find on Firefox
* Regression: Korg 'logue exports have been fixed to match Scale Workshop 1
* Optimization: Tuning table frequencies are computed using a faster strategy
* Documentation: Better documentation and logging support for the class that handles keyboard input

### 2.0.1
* Feature: The synth can now be played while manipulating slider, radio or checkbox inputs
* Bug fix: Scala import wouldn't read plain numbers and didn't ignore line comments
* Bug fix: Using a piano-style layout in all-white/all-black could crash the app
* Bug fix: Tuning table rows were highlighting inconsistently
* Bug fix: Virtual keys got stuck when a click was released outside the virtual keyboard

### 2.0.0
* Project update: Application rewritten from the ground up. Scale Workshop is now powered by Vue.
* Feature: Equal temperament now supports subsets when generating scales
* Feature: Generate Rank-2 temperaments from vals or comma list
* Feature: Combination product set supports arbitrary equaves besides the octave (2/1)
* Feature: Generate Moment of Symmetry scales
* Feature: Generate Euler-Fokker genera
* Feature: Generate Dwarf scales
* Feature: Generate Cross polytope scales (generalized octahedra in monzo-space)
* Feature: Span lattices of arbitrary rank
* Feature: Approximate by ratios using odd- and prime-limits
* Feature: Temper modifier for converting scales in just intonation to lower ranks
* Feature: Convert intervals to different types
* Feature: New interval type: monzo e.g `[-4 4 -1>` = 2<sup>-4</sup>·3<sup>4</sup>·5<sup>-1</sup> = 81/80
* Feature: New interval type: composite e.g `3/2 - 1.995` ≈ 700.0 cents
* Feature: Analysis - Interval matrix (modes)
* Feature: Analysis - Visualize currently played chord as otonal or utonal concentric cogs
* Feature: Piano-style virtual keyboard 
* Feature: Piano-style mapping for the QWERTY keyboard (layout determined by key colors)
* Feature: Mapping white (physical) MIDI keys to white colored (virtual) scale degrees

## Contributors

* Sevish
* Lumi Pakkanen
* Vincenzo Sicurella
* Lajos Mészáros
* Forrest Cahoon
* Videco
* Kraig Grady

## Development

The app is built using [Vue](https://vuejs.org/). This information should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) + [vitest-explorer](https://marketplace.visualstudio.com/items?itemName=ZixuanChen.vitest-explorer).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

Create a local copy of vite config.
```sh
cp vite.config.ts.template vite.config.ts
```

Install project.
```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
npm run test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
npm run build
npm run test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## License

MIT, see [LICENCE](https://github.com/xenharmonic-devs/scale-workshop/blob/main/LICENSE) for details.

## Related projects

* MOS scales generated using [moment-of-symmetry](https://github.com/xenharmonic-devs/moment-of-symmetry)
* Scales tempered using [temperaments](https://github.com/xenharmonic-devs/temperaments)
* MIDI I/O using [xen-midi](https://github.com/xenharmonic-devs/xen-midi)
* Basic utilities from [xen-dev-utils](https://github.com/xenharmonic-devs/xen-dev-utils)
