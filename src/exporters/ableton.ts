import { APP_TITLE } from '@/constants'
import { BaseExporter, type ExporterParams } from '@/exporters/base'
import { fractionToString } from 'scale-workshop-core'
import { ftom } from 'xen-dev-utils'

export default class AbletonAsclExporter extends BaseExporter {
  // Make sure .ascl is valid .scl
  static maxInteger = 2147483647

  params: ExporterParams
  name: string
  appTitle: string

  constructor(params: ExporterParams) {
    super()
    this.params = params
    this.name = params.name || 'Untitled tuning'
    this.appTitle = params.appTitle || APP_TITLE
  }

  getFileContents() {
    const newline = this.params.newline
    const scale = this.params.scale
    const referenceFrequency = this.params.scale.baseFrequency.toFixed(8)
    // assemble the .ascl file contents
    let file = '! ' + this.params.filename + '.ascl' + newline
    file += '! Created using ' + this.appTitle + newline
    file += '!' + newline
    file += this.name + newline
    file += '!' + newline
    file += `! default tuning: degree 0 = ${referenceFrequency} Hz` + newline
    file += '!' + newline
    file += scale.size.toString() + newline
    file += '!' + newline

    const names: string[] = []

    for (let i = 1; i <= scale.size; i++) {
      const interval = scale.getInterval(i)
      const monzo = interval.monzo
      if (monzo.isFractional()) {
        const ratio = monzo.toFraction()
        if (
          ratio.n <= AbletonAsclExporter.maxInteger &&
          ratio.d <= AbletonAsclExporter.maxInteger
        ) {
          file += fractionToString(ratio)
        } else {
          // The intended accuracy is undocumented, but a sample file had 8 decimals
          file += monzo.toCents().toFixed(8)
        }
      } else {
        // Incidentally cent accuracy is undocumented in Scala as well, so I guess this is fine
        file += monzo.toCents().toFixed(8)
      }
      file += ' ! ' + interval.name + newline
      names.push('"' + interval.name + '"')
    }
    if (names.length) {
      // Put unison's name first
      names.unshift(names.pop()!)
    }

    // It's unclear what "octave number" means in the spec
    const octave = Math.floor(ftom(scale.baseFrequency)[0] / 12) - 1

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
