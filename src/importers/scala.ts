import { NEWLINE_TEST } from '@/constants'
import { TextImporter, type ImportResult } from '@/importers/base'

export class ScalaImporter extends TextImporter {
  parseText(input: string): ImportResult {
    const lines = input.split(NEWLINE_TEST)
    const firstLine = lines.lastIndexOf('!') + 1
    const sourceLines: string[] = []
    lines.slice(firstLine).forEach((line) => {
      line = line.trim()
      if (!line.length) {
        return
      }
      const parts = line.split(/\s/)
      if (parts.length === 1) {
        // Valid .scl is valid SonicWeave
        sourceLines.push(parts[0])
      } else if (parts.length > 1) {
        // Unofficially labeled .scl is valid SonicWeave if quoted
        sourceLines.push(parts[0] + ' ' + JSON.stringify(parts.slice(1).join('')))
      }
    })
    return { sourceText: sourceLines.join('\n') }
  }
}
