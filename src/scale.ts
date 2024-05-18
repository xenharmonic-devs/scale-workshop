import { mmod, valueToCents } from 'xen-dev-utils'

/** Musical scale designed to calculate frequencies repeated at octaves or generic equaves. */
export class Scale {
  intervalRatios: number[]
  baseFrequency: number
  baseMidiNote: number
  title: string

  /**
   * Construct a new musical scale.
   * @param intervalRatios Intervals of the scale excluding 1/1, ending with the interval of equivalence.
   * @param baseFrequency Base frequency of 1/1.
   * @param baseMidiNote MIDI note corresponfing to base frequency
   */
  constructor(
    intervalRatios: number[],
    baseFrequency: number,
    baseMidiNote: number,
    title: string
  ) {
    this.intervalRatios = intervalRatios
    this.baseFrequency = baseFrequency
    this.baseMidiNote = baseMidiNote
    this.title = title
  }

  /** Number of intervals in the scale. */
  get size() {
    return this.intervalRatios.length
  }

  get equaveRatio() {
    return this.intervalRatios[this.intervalRatios.length - 1]
  }

  get equaveCents() {
    return valueToCents(this.equaveRatio)
  }

  /**
   * Obtain the ratio against the base MIDI note.
   * @param index MIDI index of a note.
   * @returns Ratio associated with the MIDI index.
   */
  getRatio(index: number) {
    // Deal with implicit 1/1
    index -= 1
    // Center on base MIDI note
    index -= this.baseMidiNote

    const baseIndex = mmod(index, this.size)
    const numEquaves = (index - baseIndex) / this.size
    return this.intervalRatios[baseIndex] * this.equaveRatio ** numEquaves
  }

  /**
   * Obtain the frequency of an interval in the scale (repeats at equaves).
   * @param index MIDI index of a note.
   * @returns The frequency of an interval in the scale with equaves factored in as necessary.
   */
  getFrequency(index: number) {
    return this.baseFrequency * this.getRatio(index)
  }

  /**
   * Obtain the cents offset from the base MIDI note.
   * @param index MIDI index of a note.
   * @returns Cents associated with the MIDI index.
   */
  getCents(index: number) {
    // Deal with implicit 0c
    index -= 1
    // Center on base MIDI note
    index -= this.baseMidiNote

    const baseIndex = mmod(index, this.size)
    const numEquaves = (index - baseIndex) / this.size
    return (
      valueToCents(this.intervalRatios[baseIndex]) + valueToCents(this.equaveRatio) * numEquaves
    )
  }

  /**
   * Obtain a range of frequencies in the scale.
   * More efficient to compute than getting individual frequencies.
   * @param start The MIDI index of the lowest note to include.
   * @param end The MIDI index of the end point (`end` itself not included in the result).
   * @returns An array of frequencies corresponding to the specified range.
   */
  getFrequencyRange(start: number, end: number) {
    // Deal with implicit 1/1 and center on base MIDI note
    const low = start - 1 - this.baseMidiNote
    const high = end - 1 - this.baseMidiNote
    const numEquaves = Math.floor(low / this.size)
    let referenceFrequency = this.baseFrequency * this.equaveRatio ** numEquaves
    const result = []
    if (!referenceFrequency || !isFinite(referenceFrequency)) {
      // The scale is too extreme for optimized calculation. Spend compute.
      for (let i = start; i < end; ++i) {
        result.push(this.getFrequency(i))
      }
      return result
    }
    let index = low - numEquaves * this.size
    for (let i = low; i < high; ++i) {
      result.push(referenceFrequency * this.intervalRatios[index])
      index++
      if (index >= this.size) {
        index -= this.size
        referenceFrequency *= this.equaveRatio
      }
    }
    return result
  }

  getCentsRange(start: number, end: number) {
    // Deal with implicit 1/1
    start -= 1
    end -= 1
    // Center on base MIDI note
    start -= this.baseMidiNote
    end -= this.baseMidiNote
    const equaveCents = this.equaveCents
    const intervalCents = this.intervalRatios.map(valueToCents)
    const numEquaves = Math.floor(start / this.size)
    let referenceCents = this.equaveCents * numEquaves
    let index = start - numEquaves * this.size
    const result = []
    for (let i = start; i < end; ++i) {
      result.push(referenceCents + intervalCents[index])
      index++
      if (index >= this.size) {
        index -= this.size
        referenceCents += equaveCents
      }
    }
    return result
  }
}
