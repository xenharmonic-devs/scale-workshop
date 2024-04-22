import { clamp, frequencyToMtsBytes } from 'xen-dev-utils'
import { BaseExporter } from './base'

export function frequencyTableToBinaryData(frequencyTableIn: number[]): Uint8Array {
  const dataSize = frequencyTableIn.length * 3
  const data = new Uint8Array(dataSize)
  let dataIndex = 0
  frequencyTableIn.forEach((f: number) => {
    const bytes = frequencyToMtsBytes(f)
    data[dataIndex] = bytes[0]
    data[dataIndex + 1] = bytes[1]
    data[dataIndex + 2] = bytes[2]
    dataIndex += 3
  })

  return data
}

export function getSysexChecksum(data: number[]): number {
  const checksum = data
    .filter((byte: number) => byte >= 0 && byte < 128)
    .reduce((sum: number, byte: number) => sum ^ byte, 0xff)
  return checksum & 0x7f
}

export default class MtsSysexExporter extends BaseExporter {
  getBulkTuningData() {
    const scale = this.params.scale

    const frequencies = scale.getFrequencyRange(0, 128)

    const scaleData = frequencyTableToBinaryData(frequencies)
    return scaleData
  }

  getNameData() {
    let name = this.params.scale.title
    while (name.length < 16) {
      name += ' '
    }

    const nameData = Array.from(name)
      .slice(0, 16)
      .map((char: string) => char.charCodeAt(0))
    return nameData
  }

  buildSysExDump() {
    if (this.params.presetIndex === undefined) throw new Error('No preset index defined')

    const presetIndex = clamp(0, 0x7f, this.params.presetIndex)

    const nameData = this.getNameData()
    const scaleData = this.getBulkTuningData()

    const data: number[] = []
    data.push(
      0xf0,
      0x7e, // SysEx header
      0x00,
      0x08,
      0x01, // protocol IDs
      presetIndex,
      ...nameData,
      ...scaleData
    )
    const checksum = getSysexChecksum(data)
    data.push(checksum)
    data.push(0xf7)

    return Uint8Array.from(data)
  }

  saveFile() {
    const sysexDump = this.buildSysExDump()
    super.saveFile(this.params.filename + '.syx', sysexDump, true)
  }
}
