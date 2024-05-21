import { DEFAULT_NUMBER_OF_COMPONENTS, NEWLINE_TEST } from '@/constants'
import { TextImporter, type ImportResult } from '@/importers/base'
import { getLineType, LINE_TYPE, parseLine, Scale, type Interval } from 'scale-workshop-core'

export class ScalaImporter extends TextImporter {
  parseText(input: string): ImportResult {
    const lines = input.split(NEWLINE_TEST)
    const intervals: Interval[] = []
    let name = ''
    let validLineCount = 0
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
        line = line.split(/\s/)[0]
        const lineType = getLineType(line)
        if (lineType === LINE_TYPE.INVALID) {
          throw new Error(`Failed to parse line ${line}`)
        }
        intervals.push(parseLine(line, DEFAULT_NUMBER_OF_COMPONENTS, undefined, true, false))
      }
    }
    const scale = Scale.fromIntervalArray(intervals)
    return { name, scale }
  }
}
