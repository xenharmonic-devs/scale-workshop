import { NEWLINE_TEST } from '@/constants'
import { TextImporter, type ImportResult } from '@/importers/base'

export class ScalaImporter extends TextImporter {
  parseText(input: string): ImportResult {
    const lines = input.split(NEWLINE_TEST)
    let validLineCount = 0
    let name = ''
    const sourceLines: string[] = []
    for (let line of lines) {
      line = line.trim()
      // Ignore comments
      if (line.startsWith('!')) {
        continue
      }
      validLineCount++
      // Empty lines are valid, but not processed
      if (!line.length) {
        continue
      }
      // Store scale title
      if (validLineCount === 1) {
        name = line
      }
      // validLineCount === 2: Ignore number of notes

      // Process true lines
      if (validLineCount > 2) {
        const parts = line.split(/\s/)
        if (parts.length === 1) {
          // Valid .scl is valid SonicWeave
          sourceLines.push(parts[0])
        } else if (parts.length > 1) {
          // Unofficially labeled .scl is valid SonicWeave if quoted
          let label = parts.slice(1).join(' ').trim()
          if (label.startsWith('!')) {
            label = label.slice(1).trim()
          }
          sourceLines.push(parts[0] + ' ' + JSON.stringify(label))
        }
      }
    }
    return { name, sourceText: sourceLines.join('\n') }
  }
}
