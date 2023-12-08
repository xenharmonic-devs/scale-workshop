import { BaseExporter, type ExporterParams } from '@/exporters/base'

export default class PureDataExporter extends BaseExporter {
  static tuningMaxSize = 128

  params: ExporterParams

  constructor(params: ExporterParams) {
    super()
    this.params = params
  }

  // assemble the text file contents
  getFileContents() {
    let file = ''
    for (let i = 0; i < PureDataExporter.tuningMaxSize; i++) {
      file +=
        this.params.scale.getFrequency(i - this.params.baseMidiNote).toFixed(7) +
        ';' +
        this.params.newline
    }

    return file
  }

  saveFile() {
    super.saveFile(this.params.filename + '.txt', this.getFileContents())
  }
}
