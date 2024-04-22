import { APP_TITLE } from '@/constants'
import { BaseExporter, type ExporterParams } from '@/exporters/base'

export default class MaxMSPExporter extends BaseExporter {
  static tuningMaxSize = 128

  appTitle: string

  constructor(params: ExporterParams) {
    super(params)
    this.appTitle = params.appTitle || APP_TITLE
  }

  // assemble the coll file contents
  getFileContents() {
    let file =
      '# Tuning file for Max/MSP coll objects. - Created using ' +
      this.appTitle +
      this.params.newline
    file += '# ' + this.params.scale.title + this.params.newline
    file += '#' + this.params.newline
    file += '# ' + this.params.scaleUrl + this.params.newline
    file += '#' + this.params.newline

    for (let i = 0; i < MaxMSPExporter.tuningMaxSize; i++) {
      file += i + ', ' + this.params.scale.getFrequency(i).toFixed(7) + ';' + this.params.newline
    }

    return file
  }

  saveFile() {
    super.saveFile(this.params.filename + '.txt', this.getFileContents())
  }
}
