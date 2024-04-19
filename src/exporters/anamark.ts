import { APP_TITLE, NEWLINE_TEST } from '@/constants'
import { BaseExporter, type ExporterParams } from '@/exporters/base'
import { mtof, valueToCents } from 'xen-dev-utils'

class AnaMarkExporter extends BaseExporter {
  static tuningMaxSize = 128
  static baseFrequency = mtof(0)

  version: number
  appTitle: string
  date: Date
  sourceText: string

  constructor(params: ExporterParams, version: number) {
    super(params)
    if (params.sourceText === undefined) {
      throw new Error('Missing text lines')
    }
    this.version = version
    this.appTitle = params.appTitle || APP_TITLE
    this.date = params.date || new Date()
    this.sourceText = params.sourceText
  }

  getFileContents() {
    // TUN format spec:
    // http://www.mark-henning.de/files/am/Tuning_File_V2_Doc.pdf

    // Assemble the .tun file contents:
    const newline = this.params.newline
    const intervals = this.params.relativeIntervals
    const scale = this.params.scale
    const filename = this.params.filename

    // Comment section
    let file = '; VAZ Plus/AnaMark softsynth tuning file' + newline
    file += '; ' + this.params.name + newline
    file += ';' + newline

    // If version 200 or higher, display the scale URL so user can easily get back to the original scale that generates this tun file.
    // If earlier than version 200, we must be careful that a long URL doesn't break the line-length limit of 512 characters.
    // Note: TUN spec says line-length limit is 255 but in the v1 file format source the limit is indeed 512.
    if (this.version >= 200 || this.params.scaleUrl!.length <= 508) {
      file += '; ' + this.params.scaleUrl + newline
    }
    // If version before 200 and URL is too long, fall back to an alternative way of displaying the original scale data.
    else {
      for (const line of this.sourceText.split(NEWLINE_TEST)) {
        file += '; ' + line + newline
      }
    }

    file += ';' + newline
    file += '; VAZ Plus section' + newline
    file += '[Tuning]' + newline

    for (let i = 0; i < AnaMarkExporter.tuningMaxSize; i++) {
      const freq = scale.getFrequency(i)
      const cents = valueToCents(freq / AnaMarkExporter.baseFrequency)
      file += 'note ' + i.toString() + '=' + Math.round(cents).toString() + newline
    }

    file += newline + '; AnaMark section' + newline
    file += '[Scale Begin]' + newline
    file += 'Format= "AnaMark-TUN"' + newline
    file += 'FormatVersion= ' + this.version.toString() + newline
    file +=
      'FormatSpecs= "http://www.mark-henning.de/eternity/tuningspecs.html"' + newline + newline
    file += '[Info]' + newline
    file += 'Name= "' + filename + '.tun"' + newline
    file += 'ID= "' + filename.replace(/ /g, '') + '.tun"' + newline // this line strips whitespace from filename, as per .tun spec
    file += 'Filename= "' + filename + '.tun"' + newline
    file += 'Description= "' + this.params.description + '"' + newline
    file += 'Date= "' + this.date.toISOString().slice(0, 10) + '"' + newline
    file += 'Editor= "' + this.appTitle + '"' + newline + newline
    file += '[Exact Tuning]' + newline

    for (let i = 0; i < AnaMarkExporter.tuningMaxSize; i++) {
      const freq = scale.getFrequency(i)
      const cents = valueToCents(freq / AnaMarkExporter.baseFrequency)
      file += 'note ' + i + '= ' + cents.toFixed(6) + newline
    }

    // version 2.00 only
    if (this.version >= 200) {
      file += newline + '[Functional Tuning]' + newline

      for (let i = 1; i <= intervals.length; i++) {
        if (i === intervals.length) {
          file +=
            'note ' +
            i +
            '="#>-' +
            i +
            ' % ' +
            intervals[i - 1].totalCents(true).toFixed(6) +
            ' ~999"' +
            newline
        } else {
          file +=
            'note ' + i + '="#=0 % ' + intervals[i - 1].totalCents(true).toFixed(6) + '"' + newline
        }
      }

      file +=
        newline +
        '; Set reference key to absolute frequency (not scale note but midi key)' +
        newline
      file += 'note ' + scale.baseMidiNote + '="! ' + scale.baseFrequency.toFixed(6) + '"' + newline
    }

    file += newline + '[Scale End]' + newline

    return file
  }

  saveFile() {
    super.saveFile(this.params.filename + '.tun', this.getFileContents())
  }
}

export class AnaMarkV1Exporter extends AnaMarkExporter {
  constructor(params: ExporterParams) {
    super(params, 100)
  }
}

export class AnaMarkV2Exporter extends AnaMarkExporter {
  constructor(params: ExporterParams) {
    super(params, 200)
  }
}
