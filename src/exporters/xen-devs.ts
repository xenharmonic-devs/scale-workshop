import { APP_TITLE } from '@/constants'
import { BaseExporter, type ExporterParams } from '@/exporters/base'
import { literalToString } from 'sonic-weave'

// Specs: https://github.com/xenharmonic-devs/sonic-weave/blob/main/documentation/interchange.md
export default class SonicWeaveInterchangeExporter extends BaseExporter {
  constructor(params: ExporterParams) {
    super(params)
  }

  getFileContents() {
    const params = this.params
    const lines = [`(* Created using ${params.appTitle ?? APP_TITLE} *)`, '']
    lines.push(JSON.stringify(params.scale.title))
    if (params.unisonFrequency) {
      const unisonFrequency = literalToString(params.unisonFrequency.asInterchangeLiteral())
      lines.push(`1 = ${unisonFrequency}`)
      lines.push('')
    }
    const intervals = params.rawIntervals ?? params.relativeIntervals
    for (const interval of intervals) {
      const universal = interval.shallowClone()
      universal.node = universal.asMonzoLiteral(true)
      let line = universal.toString(undefined, true)
      if (line.startsWith('(') && line.endsWith(')')) {
        line = line.slice(1, -1)
      }
      lines.push(line)
    }
    lines.push('')
    return lines.join('\n')
  }

  saveFile() {
    super.saveFile(this.params.filename + '.swi', this.getFileContents())
  }
}
