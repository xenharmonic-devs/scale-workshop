# Change log

## 3.0.1
 * Regression: Show pitch associated with MIDI base index [#795](https://github.com/xenharmonic-devs/scale-workshop/issues/795)
 * Bug fix: Use relative mossteps when J4 doesn't coincide with 1/1 [#794](https://github.com/xenharmonic-devs/scale-workshop/issues/794)

## 3.0.0
 * Feature: Core language switched to from [scale-workshop-core](https://github.com/xenharmonic-devs/scale-workshop-core) to [sonic-weave](https://github.com/xenharmonic-devs/sonic-weave)
 * Feature: Custom interval labels e.g. `3/2 "my fifth"`
 * Feature: CSS and RGB colors directly associated with intervals e.g. `400. yellow`
 * Feature: Relative FJS notation e.g. `M3^5` for `5/4`
 * Feature: Absolute FJS notation e.g. `G4` for `3/2` above middle C
 * Feature: Absolute frequencies e.g. `432 Hz`
 * Feature: Subgroup monzos e.g. `[-2 -1 1>@2.3.23` for `23/12`
 * Feature: Frequency as a subgroup basis element e.g. `[1 8>@Hz.2` for `256 Hz`
 * Feature: Full interval arithmetic e.g. `3/2 ^ 1/2` = `(3÷2) ^ (1÷2)` = `sqrt(3/2)` = `√3/2` = `n3`
 * Feature: Domain-specific arithmetic e.g. `3/2 + 4/3` = `17/6`, but `P5 + P4` = `P8`
 * Feature: Domain-independent arithmetic e.g. `3/2 ~* 4/3` = `2/1` and `P5 ~* P4` = `P8`
 * Feature: Enumerated chord syntax e.g. `5:6:7:8:9:10`
 * Feature: Vectorized operations e.g. `[4, 7, 12] \ 12`
 * Feature: Code comments e.g. `(* Nestable (* OCaml *) style comments *)`
 * Feature: Vals for equal tempering e.g. `<12 19 28]`, `17c@`, `17[^5]@`
 * Feature: Ups and downs with tempering e.g. `vM3;P5;P8;22@` for `[7, 13, 22] \ 22`
 * Feature: And much much more e.g. `sort(3^[-1..5] rdc 2);commaList(81/80)` for TE meantone[7]
 * Feature: Virtual piano now supports up to 4 layers of colors
 * Feature: Import scale title from .scl files
 * Feature: Aperiodic waveforms for metallic sounds
 * Feature: Add a button to select all MIDI inputs [#271](https://github.com/xenharmonic-devs/scale-workshop/issues/271), [#650](https://github.com/xenharmonic-devs/scale-workshop/issues/650)
 * Feature: Character palette with tooltips for syntax beyond ASCII [#533](https://github.com/xenharmonic-devs/scale-workshop/issues/533)
 * Feature: Interval matrix simplified by default [#536](https://github.com/xenharmonic-devs/scale-workshop/issues/536)
 * Feature: Convert scale to enumeration [#538](https://github.com/xenharmonic-devs/scale-workshop/issues/538)
 * Feature: Export interval labels and colors as comments in .scl files [#545](https://github.com/xenharmonic-devs/scale-workshop/issues/545)
 * Feature: More MOS coloring options [#554](https://github.com/xenharmonic-devs/scale-workshop/issues/554)
 * Feature: Variety and brightness signatures show in the interval matrix [#568](https://github.com/xenharmonic-devs/scale-workshop/issues/568)
 * Feature: Periodic equally tempered grids supported on the lattice tab
 * Feature: Lattice label sizes customizable [#581](https://github.com/xenharmonic-devs/scale-workshop/issues/581)
 * Feature: Lattice colors inverted and scale colors incorporated [#586](https://github.com/xenharmonic-devs/scale-workshop/issues/586)
 * Feature: Scott Dakota's prime rings on the lattice tab [#551](https://github.com/xenharmonic-devs/scale-workshop/issues/551)
 * Feature: Tonnetz prime ellipse coordinates on the lattice tab [#588](https://github.com/xenharmonic-devs/scale-workshop/issues/588)
 * Feature: New `latticeView()` command for displaying the order of intervals (prior to sorting) [#597](https://github.com/xenharmonic-devs/scale-workshop/issues/597)
 * Feature: New "repeat" modifier [#406](https://github.com/xenharmonic-devs/scale-workshop/issues/406)
 * Feature: Show labels, ratios, cents and frequencies on the tuning table [#534](https://github.com/xenharmonic-devs/scale-workshop/issues/534)
 * Feature: Implement multi-channel MIDI mode compatible with the Lumatone [#649](https://github.com/xenharmonic-devs/scale-workshop/pull/649)
 * Feature: Call the equave "octave", "tritave", "tetrave" or "pentave" when applicable [#694](https://github.com/xenharmonic-devs/scale-workshop/pull/694)
 * Feature: Full width view dedicated to the MOS pyramid [#700](https://github.com/xenharmonic-devs/scale-workshop/issues/700)
 * Feature: Add harmonic entropy to the analysis tab and expose as a helper function [#726](https://github.com/xenharmonic-devs/scale-workshop/issues/726)
 * Feature: Add equally tempered formatting as on option for the interval matrix [#740](https://github.com/xenharmonic-devs/scale-workshop/issues/740)
 * Bug fix: Fix handling of trailing comments when importing .scl files [#706](https://github.com/xenharmonic-devs/scale-workshop/issues/706), [#787](https://github.com/xenharmonic-devs/scale-workshop/issues/787)
 * Bug fix: Extreme ratios now only break parts of the tuning table that do not have IEEE floating point representation and format better when non-finite [#631](https://github.com/xenharmonic-devs/scale-workshop/issues/631), [#632](https://github.com/xenharmonic-devs/scale-workshop/issues/632)
 * Style fix: Make checkbox and radio button labels more consistent [#644](https://github.com/xenharmonic-devs/scale-workshop/issues/644)
 * Beta cycle issues: [#643](https://github.com/xenharmonic-devs/scale-workshop/issues/643), [#640](https://github.com/xenharmonic-devs/scale-workshop/issues/640), [#577](https://github.com/xenharmonic-devs/scale-workshop/issues/577), [#513](https://github.com/xenharmonic-devs/scale-workshop/issues/513), [#658](https://github.com/xenharmonic-devs/scale-workshop/issues/658), [#664](https://github.com/xenharmonic-devs/scale-workshop/issues/664), [#666](https://github.com/xenharmonic-devs/scale-workshop/issues/666), [#777](https://github.com/xenharmonic-devs/scale-workshop/issues/777), [#784](https://github.com/xenharmonic-devs/scale-workshop/issues/784) [#785](https://github.com/xenharmonic-devs/scale-workshop/issues/785), [#786](https://github.com/xenharmonic-devs/scale-workshop/issues/786)
 * Alpha cycle issues: [#574](https://github.com/xenharmonic-devs/scale-workshop/issues/574), [#579](https://github.com/xenharmonic-devs/scale-workshop/issues/579)

## 2.4.1
 * Bug fix: Unison is no longer affected by random variance [#613](https://github.com/xenharmonic-devs/scale-workshop/issues/613)

## 2.4.0
 * Feature: Export scales for Ableton Live 12 [#601](https://github.com/xenharmonic-devs/scale-workshop/issues/601)
 * Feature: MOS patterns supported by EDO can be sorted by size or hardness [#599](https://github.com/xenharmonic-devs/scale-workshop/issues/599)
 * Bug fix: The frequency for 1/1 is now at MIDI note for base frequency even in "White only" mode [#603](https://github.com/xenharmonic-devs/scale-workshop/issues/603)

## 2.3.8
 * Feature: Rank-2 circle now displays generator ranges of valid MOS patterns [#580](https://github.com/xenharmonic-devs/scale-workshop/issues/580)
 * Bug fix: Pressing "More" for EDO inside the MOS modal now produces all supported MOS patterns
 * Bug fix: CPS and Span lattice modals now report basis parsing errors [#585](https://github.com/xenharmonic-devs/scale-workshop/issues/585)
 * Bug fix: MOS pattern errors no longer steal focus from the subgroup input during rank-2 generation [#587](https://github.com/xenharmonic-devs/scale-workshop/issues/587)

## 2.3.7
 * Bug fix: Fix the bottom row of virtual QWERTY being offset by one [#452](https://github.com/xenharmonic-devs/scale-workshop/issues/452)
 * Bug fix: Fix the equave shift keys on virtual QWERTY [#564](https://github.com/xenharmonic-devs/scale-workshop/issues/563)
 * Bug fix: Fix rank-2 modal crashing when clearing number of periods [#573](https://github.com/xenharmonic-devs/scale-workshop/issues/573)
 * Documentation: Move changelog to a dedicated file [#556](https://github.com/xenharmonic-devs/scale-workshop/issues/556)
 * Documentation: Include an example NGINX config [#470](https://github.com/xenharmonic-devs/scale-workshop/issues/470)

## 2.3.6
 * Feature: Be more informative about why vals or commas do not span a rank-2 temperament [#540](https://github.com/xenharmonic-devs/scale-workshop/issues/540)
 * Feature: Implement more MOS coloring options [#554](https://github.com/xenharmonic-devs/scale-workshop/issues/554)
 * Bug fix: Fix rank-2 modal crashing when changing number of periods [#553](https://github.com/xenharmonic-devs/scale-workshop/issues/553)
 * Bug fix: Display custom validation messages on input elements [#540](https://github.com/xenharmonic-devs/scale-workshop/issues/540)
 * Bug fix: Implement soft limits to approximation numerators and denominators [#544](https://github.com/xenharmonic-devs/scale-workshop/issues/544)

## 2.3.5
 * Bug fix: Parse nothing-of-EDO [#537](https://github.com/xenharmonic-devs/scale-workshop/issues/537)

## 2.3.4
 * Feature: Support primes as equaves in lattice visualization
 * Feature: Clear scale title when clearing scale data [#530](https://github.com/xenharmonic-devs/scale-workshop/issues/530)
 * Bug fix: Bypass complex monzo calculations in tuning table [#528](https://github.com/xenharmonic-devs/scale-workshop/issues/528)
 * Bug fix: Fix MIDI visualization when base = 0 [#526](https://github.com/xenharmonic-devs/scale-workshop/issues/526)
 * Bug fix: Fix MIDI In channel messages leaking to deactivated Out channels
 * Refactoring: Use Pinia to manage app state [#367](https://github.com/xenharmonic-devs/scale-workshop/issues/367)
 * Refactoring: Persist modal data in Pinia when changing tabs [#529](https://github.com/xenharmonic-devs/scale-workshop/issues/529)

## 2.3.3
 * Feature: Add a link to the Discord channel on About page [#468](https://github.com/xenharmonic-devs/scale-workshop/issues/468)
 * Improvement: Improve loading times with asynchronous components [#520](https://github.com/xenharmonic-devs/scale-workshop/issues/520)
 * Bug fix: Fix tempering in exotic subgroups [#518](https://github.com/xenharmonic-devs/scale-workshop/issues/518)
 * Bug fix: Close Korg export modal when pressing escape [#524](https://github.com/xenharmonic-devs/scale-workshop/issues/524)
 * Refactoring: Split isomorhic QWERTY to s re-usable package [#336](https://github.com/xenharmonic-devs/scale-workshop/issues/336)

## 2.3.2
 * Bug fix: Make copy & paste possible outside of scale data [#515](https://github.com/xenharmonic-devs/scale-workshop/issues/515)
 * Quality assurance: End-to-end test scale generation / approximation [#516](https://github.com/xenharmonic-devs/scale-workshop/issues/516)
 * Quality assurance: Use node version 18 in GitHub Workflows

## 2.3.1
 * Feature: Historical temperaments, target-tempered generator stacks and well temperaments [#461](https://github.com/xenharmonic-devs/scale-workshop/issues/461), [#477](https://github.com/xenharmonic-devs/scale-workshop/issues/477)
 * Bug fix: Fix audio issues in the 404 page [#512](https://github.com/xenharmonic-devs/scale-workshop/issues/512)
 * Bug fix: Fix rank-2 generation [#514](https://github.com/xenharmonic-devs/scale-workshop/issues/514)
 * Bug fix: Fix merging negative offsets [#511](https://github.com/xenharmonic-devs/scale-workshop/issues/511)
 * Refactoring: Use `xen-dev-utils` for circle difference

## 2.3.0
 * Bug fix: Minor type issues
 * Refactoring: Re-initialize the Vue project
 * Refactoring: Re-format code
 * Quality assurance: Implement Cypress test to verify URL encoding [#508](https://github.com/xenharmonic-devs/scale-workshop/issues/508) 

## 2.2.2
 * Feature: Add radio buttons for changing interval matrix indexing [#499](https://github.com/xenharmonic-devs/scale-workshop/issues/499)
 * Refactoring: Use Pinia to manage app audio state [#367](https://github.com/xenharmonic-devs/scale-workshop/issues/367)
 * Documentation: Point README links to plainsound.org
 * Documentation: Replace decimal example with pi

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
