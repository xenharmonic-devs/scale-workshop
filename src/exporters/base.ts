import type { Scale } from "@/scale"
import type { Interval } from "sonic-weave"

export type LineFormat = 'label' | 'cents' | 'frequency' | 'decimal' | 'degree'

export type ExporterParams = {
  newline: string
  filename: string
  relativeIntervals: Interval[]
  baseFrequency: number
  baseMidiNote: number
  midiOctaveOffset: number
  scale: Scale
  labels: string[]
  name?: string
  scaleUrl?: string
  description?: string
  sourceText?: string // May contain invalid lines
  appTitle?: string
  date?: Date
  format?: LineFormat
  basePeriod?: number
  baseDegree?: number
  centsRoot?: number
  displayPeriod?: boolean
  integratePeriod?: boolean
  presetIndex?: number
}

export class BaseExporter {
  params: ExporterParams

  constructor(params: ExporterParams) {
    this.params = params
    this.validateParams()
  }

  validateParams() {
    for (const interval of this.params.relativeIntervals) {
      if (!interval.isRelative()) {
        throw new Error('Intervals must be given relative to the base frequency.');
      }
    }
  }

  saveFile(filename: string, contents: any, raw = false, mimeType = 'application/octet-stream,') {
    const link = document.createElement('a')
    link.download = filename

    if (raw) {
      const blob = new Blob([contents], { type: 'application/octet-stream' })
      link.href = window.URL.createObjectURL(blob)
    } else {
      link.href = 'data:' + mimeType + encodeURIComponent(contents)
    }

    // Open save dialog
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
  }
}
