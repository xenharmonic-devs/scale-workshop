import { BaseExporter } from '@/exporters/base'
import { Interval, TimeReal, intervalValueAs } from 'sonic-weave'
import { mmod, valueToCents } from 'xen-dev-utils'

export default class ReaperExporter extends BaseExporter {
  static tuningMaxSize = 128
  static fractionDigits = 3

  getFileContentsAndSuffix() {
    const digits = ReaperExporter.fractionDigits
    const scale = this.params.scale
    const labels = this.params.labels
    const baseFrequency = scale.baseFrequency
    const format = this.params.format
    const basePeriod = this.params.basePeriod || 0
    const baseDegree = this.params.baseDegree || 0
    const modBySize = !this.params.integratePeriod

    const intervals = this.params.relativeIntervals
    if (!intervals.length) {
      throw new Error('Cannot export empty scale.')
    }
    const equave = intervals[intervals.length - 1].value

    let file = '# MIDI note / CC name map' + this.params.newline

    for (let i = ReaperExporter.tuningMaxSize - 1; i >= 0; i--) {
      file += i.toString() + ' '

      let index = i - scale.baseMidiNote
      const period = basePeriod + Math.floor(index / scale.size)
      if (modBySize) {
        index = mmod(index, scale.size)
      }

      if (format === 'label' && index > 0 && index <= labels.length) {
        file += labels[index - 1]
      } else if (format === 'degree') {
        file += `${index + baseDegree}/${scale.size}`
      } else {
        const frequency = scale.getFrequency(i)
        const ratio = frequency / baseFrequency

        switch (format) {
          case 'cents':
            file += valueToCents(ratio).toFixed(digits)
            break
          case 'decimal':
            file += ratio.toFixed(digits)
            break
          case 'frequency':
            file += frequency.toFixed(digits)
            break
        }
        if (format === 'label' || format === undefined) {
          // XXX: We'd like to use the original intervals here, but that would require changes to the scale store and access to the SonicWeave root context.
          // Leave it for now until someone requests better labels.
          const interval = intervals[mmod(index - 1, intervals.length)]
          const numEquaves = Math.floor((index - 1) / intervals.length)
          const value = interval.value.mul(equave.pow(numEquaves))
          if (value instanceof TimeReal) {
            if (interval.domain === 'linear') {
              file += value.valueOf().toFixed(digits).replace('.', ',')
            } else {
              file += value.totalCents(true).toFixed(digits)
            }
          } else {
            file += new Interval(
              value,
              interval.domain,
              0,
              intervalValueAs(value, interval.node),
              interval
            ).toString()
          }
        }
      }

      if (this.params.displayPeriod) {
        file += ` (${period})`
      }
      file += this.params.newline
    }

    let suffix = ` NoteNames_${format}`

    if (this.params.displayPeriod) {
      suffix += '_p'
    }
    if (this.params.integratePeriod) {
      suffix += '_exact'
    }

    return [file, suffix]
  }

  saveFile() {
    const [contents, suffix] = this.getFileContentsAndSuffix()
    super.saveFile(this.params.filename + suffix + '.txt', contents)
  }
}
