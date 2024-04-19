import JSZip from 'jszip'
import { BaseExporter, type ExporterParams } from '@/exporters/base'
import { Fraction, mtof } from 'xen-dev-utils'
import { frequencyTableToBinaryData } from './mts-sysex'
import { Interval, TimeMonzo } from 'sonic-weave'

// This exporter converts tuning data into a zip-compressed file for use with
// Korg's Sound Librarian software, supporting their 'logue series of synthesizers.
// The zip contains a small amount of metadata and a binary file containing a
// tuning table that follows the MTS Bulk Tuning Dump specification.
// The Sound Librarian software falls a bit short of being suitable for
// advanced tuning specifications by ignoring KBM files and truncating to
// 1 cent precision. Since the MTS tuning specifications support 0.0061 cent
// precision with arbitrary mapping, this exporter intends to fully utilize the
// capabilities of the 'logue tuning implementation. However it has not been
// strictly tested if the additional precision is employed in the synthesis.

export enum KorgModels {
  MONOLOGUE = 'monologue',
  MINILOGUE = 'minilogue',
  MINILOGUE_XD = 'miniloguexd',
  PROLOGUE = 'prologue'
}

export const KORG_MODEL_INFO = {
  [KorgModels.MONOLOGUE]: {
    name: 'monologue',
    title: 'Monologue',
    scale: '.molgtuns',
    octave: '.molgtuno'
  },
  [KorgModels.MINILOGUE]: {
    name: 'minilogue',
    title: 'Minilogue',
    scale: '.mnlgtuns',
    octave: '.mnlgtuno'
  },
  [KorgModels.MINILOGUE_XD]: {
    name: 'minilogue xd',
    title: 'Minilogue XD',
    scale: '.mnlgxdtuns',
    octave: '.mnlgxdtuno'
  },
  [KorgModels.PROLOGUE]: {
    name: 'prologue',
    title: 'Prologue',
    scale: '.prlgtuns',
    octave: '.prlgtuno'
  }
}

export enum KorgExporterError {
  OCTAVE_INVALID_EQUAVE = 'Scale equave must be exactly 2/1 for the 12-note Octave format.',
  OCTAVE_INVALID_SIZE = 'Scale must comprise of exactly 12 intervals for the 12-note Octave format.',
  OCTAVE_INVALID_INTERVAL = 'Scale cannot contain intervals below unison or above an octave for the 12-note Octave format.'
}

const OCTAVE_FORMAT_SIZE = 12
const SCALE_FORMAT_SIZE = 128

export function getKorgModelInfo(modelName: string) {
  switch (modelName) {
    case 'minilogue':
      return KORG_MODEL_INFO[KorgModels.MINILOGUE]
    case 'miniloguexd':
      return KORG_MODEL_INFO[KorgModels.MINILOGUE_XD]
    case 'monologue':
      return KORG_MODEL_INFO[KorgModels.MONOLOGUE]
    case 'prologue':
      return KORG_MODEL_INFO[KorgModels.PROLOGUE]
    default:
      throw new Error('Unknown Korg model name')
  }
}

export class KorgExporter extends BaseExporter {
  modelName: string
  useOctaveFormat: boolean

  constructor(params: ExporterParams, modelName: string, useOctaveFormat: boolean) {
    super(params)
    this.modelName = modelName
    this.useOctaveFormat = useOctaveFormat

    if (this.useOctaveFormat) {
      const errorMessage = KorgExporter.getOctaveFormatErrorMessage(params.relativeIntervals)
      if (errorMessage !== '') throw new Error(errorMessage)
    }
  }

  static getOctaveFormatErrorMessage(intervals: Interval[]): string {
    const octave = new Interval(TimeMonzo.fromFraction(new Fraction(2, 1), 3), 'linear')

    if (intervals[intervals.length - 1].compare(octave) !== 0) {
      return KorgExporterError.OCTAVE_INVALID_EQUAVE
    }

    if (intervals.length !== 12) {
      return KorgExporterError.OCTAVE_INVALID_SIZE
    }

    const unison = new Interval(TimeMonzo.fromFraction(new Fraction(1, 1), 3), 'linear')

    for (const interval of intervals) {
      if (interval.compare(unison) < 0 || interval.compare(octave) > 0) {
        return KorgExporterError.OCTAVE_INVALID_INTERVAL
      }
    }

    return ''
  }

  getTuningInfoXml(model: string, programmer = 'Scale Workshop', comment = '') {
    const format = getKorgModelInfo(model)
    const name = format.name
    const tagName = name.replace(' ', '').toLowerCase()

    const rootName = this.useOctaveFormat
      ? `${tagName}_TuneOctInformation`
      : `${tagName}_TuneScaleInformation`

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      '\n' +
      `<${rootName}>\n` +
      `  <Programmer>${programmer}</Programmer>\n` +
      `  <Comment>${comment}</Comment>\n` +
      `</${rootName}>\n`

    return xml
  }

  getFileInfoXml(model: string) {
    const format = getKorgModelInfo(model)

    const [numTuneScaleData, numTuneOctData, fileNameHeader, dataName, binName] = this
      .useOctaveFormat
      ? ['0', '1', 'TunO_000.TunO_', 'TuneOctData', 'TuneOctBinary']
      : ['1', '0', 'TunS_000.TunS_', 'TuneScaleData', 'TuneScaleBinary']

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      '\n' +
      '<KorgMSLibrarian_Data>\n' +
      `  <Product>${format.name}</Product>\n` +
      '  <Contents NumProgramData="0" NumPresetInformation="0" ' +
      `NumTuneScaleData="${numTuneScaleData}"\n` +
      `            NumTuneOctData="${numTuneOctData}">\n` +
      `    <${dataName}>\n` +
      `      <Information>${fileNameHeader}info</Information>\n` +
      `      <${binName}>${fileNameHeader}bin</${binName}>\n` +
      `    </${dataName}>\n` +
      '  </Contents>\n' +
      '</KorgMSLibrarian_Data>\n'

    return xml
  }

  getFileContents(): [JSZip, string] {
    const scale = this.params.scale
    const baseMidiNote = scale.baseMidiNote

    let frequencies: number[]
    if (this.useOctaveFormat) {
      const rootFreq = mtof(0)
      const transposeRatio = rootFreq / scale.baseFrequency
      frequencies = scale
        .getFrequencyRange(baseMidiNote, baseMidiNote + OCTAVE_FORMAT_SIZE)
        .map((f: number) => f * transposeRatio)
    } else {
      frequencies = scale.getFrequencyRange(0, SCALE_FORMAT_SIZE)
    }

    const binaryData = frequencyTableToBinaryData(frequencies)

    // prepare files for zipping
    const format = getKorgModelInfo(this.modelName)
    const tuningInfo = this.getTuningInfoXml(
      this.modelName,
      'ScaleWorkshop',
      this.params.name ?? ''
    )
    const fileInfo = this.getFileInfoXml(this.modelName)
    const [fileNameHeader, fileType] = this.useOctaveFormat
      ? ['TunO_000.TunO_', format.octave]
      : ['TunS_000.TunS_', format.scale]

    const zip = new JSZip()
    zip.file(fileNameHeader + 'bin', binaryData)
    zip.file(fileNameHeader + 'info', tuningInfo)
    zip.file('FileInformation.xml', fileInfo)
    return [zip, fileType]
  }

  async saveFile() {
    const [zip, fileType] = this.getFileContents()
    const base64 = await zip.generateAsync({ type: 'base64' })
    super.saveFile(this.params.filename + fileType, base64, false, 'application/zip;base64,')
  }
}
