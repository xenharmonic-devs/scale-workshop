# scale-workshop

![Scale Workshop screenshot](https://raw.githubusercontent.com/xenharmonic-devs/scale-workshop/main/src/assets/img/opengraph-image.png)

## Description

[Scale Workshop](https://scaleworkshop.plainsound.org/) allows you to design microtonal scales and play them in your web browser. Export your scales for use with VST instruments. Convert Scala files to various tuning formats.

Scale Workshop 3 is a major upgrade over version 2. You can learn about the new features over at [sonic-weave](https://github.com/xenharmonic-devs/sonic-weave).

## Frequently Asked Questions

### What kinds of microtonal scales are possible with Scale Workshop?

Scale Workshop can play any kind of microtonal scale, such as equal temperaments, just intonation, historical and traditional scales, non-octave scales, and any arbitrary tunings. The application offers a few methods to generate scales automatically based on parameters you set, or otherwise you can enter your scale data manually.

### Can I play and hear my scale?

Yes, the built-in synth allows you to play your scales within the web browser. If your browser supports web MIDI then you can use a connected MIDI device to play notes. Otherwise you can use your computer keyboard (e.g. a QWERTY keyboard) as an isomorphic keyboard controller to hear your scales. You can also play on a touch device using the 'Virtual Keyboard' feature.

### Can I use my computer keyboard as a piano

Yes, go to the Synth tab and select *Piano-style layers* as the *Keyboard mode*. There are two options: ASDF for white keys and QWERTY for black keys **or** QWERTY for white keys and digits for black keys with another set of keys an octave lower starting from ZXCV with ASDF as the black keys. There's also a third option for keyboards that have an extra key between the left shift and Z. When using *Piano-style layers* make sure that you have defined colors for the intervals in your scale (e.g. `700. white`). Some scale generators such as *Moment of Symmetry* allow you to auto-generate the key colors.

### Can I use Scale Workshop to tune up other synths?

Scale Workshop supports any synth that uses Scala (.scl/.kbm) files or AnaMark TUN (.tun) files. It can also export Native Instruments Kontakt tuning scripts, Max/MSP coll tuning tables and Pure Data text tuning tables.

The Xen Wiki has a [list of microtonal software plugins](https://en.xen.wiki/w/List_of_Microtonal_Software_Plugins) that support Scala and AnaMark files.

### How do I enter scale/tuning data manually?

Scale data should be entered in to the large text field labeled ‘Scale data’. Add each note on its own new line. Cents and ratios are both supported.

* To specify a ratio, simply write it in the format e.g. `3/2`
* To specify an interval in cents, include a . in the line e.g. `701.9` or `1200.`
* To specify n steps out of m-EDO, write it in the format `n\m`
* To specify arbitrary EDJI values, write it in the format `n\m<p/q>`
* To specify a decimal ratio, include an `e` n the line e.g. `1.5e` or `14e-1`
* To specify a [monzo](https://en.xen.wiki/w/Monzo) enclose the exponents inside a square bracket and a closing angle bracket e.g. `[-1 1 0>`
* To specify an [FJS](https://en.xen.wiki/w/Functional_Just_System) interval spell out the quality (`M` for major), the degree (`3` for third) and the inflections (`^5` for 5-over) e.g. `M3^5`
* To specify an [FJS](https://en.xen.wiki/w/Functional_Just_System) absolute pitch spell out the nominal (e.g. `E`), the accidental (`b` for flat), the octave (e.g. `4`) and the inflection (`v5` for 5-under) e.g. `Eb4v5`
* You can stack fractions using `*` e.g. `32/27 * 81/80`
* To go the other way use `%` e.g. `27/16 % 81/80`
* You can stack cents, equal temperaments, monzos and FJS using `+` e.g. `7\12 + 1.96`
* Yo go the other way use `-` e.g. `P5 - 1.96`
* To mix fractions and cents use `*~` and `%~` e.g. `4/3 *~ 1.23`

No need to enter `0.` or `1/1` on the first line as your scale is automatically assumed to contain this interval.

The interval on the final line is assumed to be your interval of equivalence (i.e. your octave or pseudo-octave a.k.a. equave).

### How do I add comments?

Everything between `(*` and `*)` is ignored:

```ocaml
(* This is my comment about this scale *)
3/2
2 (* Plain numbers are fractions: This is 2/1 not 2.0c *)
```

### How do I attach labels to the intervals?

Use strings of characters surrounded by wither single or double quotes:

```ocaml
9/8 "my tone"
3/2 'fif'
P8 "The most perfect of octaves ♥"
```

### How do I add colors to the intervals?

Use CSS colors or RGB values:

```ocaml
10/9 yellow
4/3 #fae123 "my fourth"
1200. 'my octave' #fff
```

### How do I reduce my fractions?

Tell Scale Workshop to simplify the fractions with a `simplify` command at the bottom of the scale or `defer simplify` at the top:

```ocaml
defer simplify

9/8
10/8
11/8
12/8
13/8
14/8
15/8
16/8
```

### How do I keep my scale organized as I build it?

Tell Scale Workshop to sort everything and coalesce nearby intervals (here less than 10 cents apart) with a `defer organize(10.)` at the top:

```ocaml
(* Sort the result and coalesce nearby intervals. *)
defer organize(10.)

(* These intervals are automatically octave-reduced and inserted in the correct order. *)
11
1/11

(* Complex intervals are eliminated if there's a simpler fraction within 10 cents. *)
eulerGenus(3*3*3 * 5*5 * 7, 3*5)
```

### Can I copy and paste the contents of a Scala file (.scl) directly into the 'Scale data' field?

Scala files contain non-tuning related comments at the top of the file, so Scale Workshop will throw an error if you try to paste them in directly. Instead you can use the *‘Import .scl’* function, which automatically removes those comments for you. Or you can paste the Scala file but remove the comments manually.

### Can I convert a TUN file to another format?

Yes, start by clicking *New > Import .tun* and then load your TUN file into Scale Workshop. Then click Export and select your desired output format. Note that Scale Workshop is not a fully compliant AnaMark TUN v2 parser, however it should be able to read TUN files exported by Scala and Scale Workshop.

### How do I make my own keyboard mapping?

Keyboard mappings are not currently supported. You can still export a Scala keyboard mapping file (.kbm) but it will assume a linear mapping.
However you can always use duplicate lines in your tuning in order to skip any keys that you don't want to include, or write your .kbm file manually.

### Can I undo/redo?

Use the ↺ button near the "Scale data" header to undo and the ↻ button to redo changes to your tuning.

### How can I share my tunings with a collaborator?

Use *Export current settings > Share scale* found on the third column of the *Build Scale* tab. The given URL can be copied and pasted to another person. When they open the link they will see a Scale Workshop page with your scale already tuned in.

### How can I save my work for later?

Share the scale URL to yourself through *Export current settings > Share scale*. **Warning**: Compared to Scale Workshop 2 bookmarking the current URL doesn't work anymore and only takes you to the front page.

### When I export a tuning, I get nothing, why?

File export from Safari (iOS and macOS) does not work. Cause unknown. You can try to use Firefox, Chrome or Opera instead.

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
* Version 3 release candidates are at https://sw3.lumipakkanen.com/

#### Archived versions
* Version 2.1.0 https://sevish.com/scaleworkshop-dev/
* Version 1.5 https://sevish.com/scaleworkshop1/

## Documentation

User documentation is hosted on Github in the [project wiki](https://github.com/xenharmonic-devs/scale-workshop/wiki).

## Contributing

Please base any work on `main` branch, and make pull requests against `main` as well. There is no separate development branch. Releases will be denoted using git tags.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

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

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) + [Vitest](https://marketplace.visualstudio.com/items?itemName=vitest.explorer).

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

### Just Type-Check

```sh
npm run type-check
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

### Format the code

```sh
npm run format
```

### Run the backend server

See [sw-server](https://github.com/xenharmonic-devs/sw-server) for the backend component for storing and retrieving scales.

## License

MIT, see [LICENCE](LICENSE) for details.

## Related projects

* The domain-specific language including tempering utilities [sonic-weave](https://github.com/xenharmonic-devs/sonic-weave)
* MOS scales generated using [moment-of-symmetry](https://github.com/xenharmonic-devs/moment-of-symmetry)
* MIDI I/O using [xen-midi](https://github.com/xenharmonic-devs/xen-midi)
* Basic utilities from [xen-dev-utils](https://github.com/xenharmonic-devs/xen-dev-utils)
* Lattice tools [ji-lattice](https://github.com/xenharmonic-devs/ji-lattice)
* Synth for making sound [sw-synth](https://github.com/xenharmonic-devs/sw-synth)
* Keyboard layout [isomorphic-qwerty](https://github.com/xenharmonic-devs/isomorphic-qwerty)
