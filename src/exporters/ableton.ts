import { APP_TITLE } from '@/constants'
import { BaseExporter, type ExporterParams } from '@/exporters/base'
import { ftom } from 'xen-dev-utils'

export default class AbletonAsclExporter extends BaseExporter {
  // Make sure .ascl is valid .scl
  static maxInteger = 2147483647

  name: string
  appTitle: string

  constructor(params: ExporterParams) {
    super(params)
    this.name = params.name || 'Untitled tuning'
    this.appTitle = params.appTitle || APP_TITLE
  }

  getFileContents() {
    const newline = this.params.newline
    const intervals = this.params.relativeIntervals
    const labels = this.params.labels
    const referenceFrequency = this.params.scale.baseFrequency.toFixed(8)
    // assemble the .ascl file contents
    let file = '! ' + this.params.filename + '.ascl' + newline
    file += '! Created using ' + this.appTitle + newline
    file += '!' + newline
    file += this.name + newline
    file += '!' + newline
    file += `! default tuning: degree 0 = ${referenceFrequency} Hz` + newline
    file += '!' + newline
    file += intervals.length.toString() + newline
    file += '!' + newline

    const names: string[] = []

    for (let i = 0; i < intervals.length; i++) {
      const monzo = intervals[i].value.abs()
      if (monzo.isFractional()) {
        const { numerator, denominator } = monzo.toBigNumeratorDenominator()
        if (
          numerator <= AbletonAsclExporter.maxInteger &&
          denominator <= AbletonAsclExporter.maxInteger
        ) {
          file += `${numerator}/${denominator}`
        } else {
          // The intended accuracy is undocumented, but a sample file had 8 decimals
          file += monzo.toCents().toFixed(8)
        }
      } else {
        // Incidentally cent accuracy is undocumented in Scala as well, so I guess this is fine
        file += monzo.toCents().toFixed(8)
      }
      file += ' ! ' + labels[i] + newline
      names.push('"' + labels[i].replace('"', '“') + '"') // XXX: Hax
    }
    if (names.length) {
      // Put unison's name first
      names.unshift(names.pop()!)
    }

    // It's unclear what "octave number" means in the spec
    const octave = Math.floor(ftom(this.params.scale.baseFrequency)[0] / 12) - 1

    file += '!' + newline
    file += '! @ABL NOTE_NAMES ' + names.join(' ') + newline
    file += `! @ABL REFERENCE_PITCH ${octave} 0 ${referenceFrequency}` + newline
    file += '! @ABL SOURCE Scale Workshop / Xenharmonic developers' + newline
    file += '! @ABL LINK ' + this.params.scaleUrl + newline
    // Note range omitted to let Ableton infer it based on the content
    // ! @ABL NOTE_RANGE_BY_INDEX

    return file
  }

  saveFile() {
    super.saveFile(this.params.filename + '.ascl', this.getFileContents())
  }
}
