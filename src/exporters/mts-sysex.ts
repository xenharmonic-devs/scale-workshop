import { frequencyToMtsBytes } from "xen-dev-utils";
import { BaseExporter, type ExporterParams } from "./base";

export function frequencyTableToBinaryData(
  frequencyTableIn: number[]
): Uint8Array {
  const dataSize = frequencyTableIn.length * 3;
  const data = new Uint8Array(dataSize);
  let dataIndex = 0;
  frequencyTableIn.forEach((f: number) => {
    const bytes = frequencyToMtsBytes(f);
    data[dataIndex] = bytes[0];
    data[dataIndex + 1] = bytes[1];
    data[dataIndex + 2] = bytes[2];
    dataIndex += 3;
  });

  return data;
}

export function getSysexChecksum(data: number[]): number {
  const checksum = data
    .filter((byte: number) => byte >= 0 && byte < 128)
    .reduce((sum: number, byte: number) => sum ^ byte, 0xff);
  return checksum & 0x7f;
}

export default class MtsSysexExporter extends BaseExporter {
  params: ExporterParams;

  constructor(params: ExporterParams) {
    super();
    this.params = params;
  }

  buildSysexDump() {
    if (this.params.presetIndex === undefined)
      throw new Error("No preset index defined");

    const scale = this.params.scale;
    const baseMidiNote = this.params.baseMidiNote;

    const presetIndex = this.params.presetIndex & 0x7f;

    let name = this.params.name ?? "";
    while (name.length < 16) {
      name += " ";
    }

    const nameData = Array.from(name).map((char: string) => char.charCodeAt(0));

    const data: number[] = [];
    data.push(
      0xf0,
      0x7e, // SysEx header
      0x00,
      0x08,
      0x01, // protocol IDs
      presetIndex,
      ...nameData
    );

    const frequencies = scale.getFrequencyRange(
      -baseMidiNote,
      128 - baseMidiNote
    );

    const scaleData = frequencyTableToBinaryData(frequencies);
    data.push(...scaleData);

    const checksum = getSysexChecksum(data);
    data.push(checksum);
    data.push(0xf7);

    return Uint8Array.from(data);
  }

  saveFile() {
    const sysexDump = this.buildSysexDump();
    super.saveFile(this.params.filename + ".syx", sysexDump, true);
  }
}
