import { clamp, frequencyToCentOffset } from "@/utils";
import { BaseExporter, type ExporterParams } from "./base";

class ImageLineExporter extends BaseExporter {
  static numberOfNotes = 121; // IL products can only retune from C0 to C10
  static headerBytes = Uint8Array.from([
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    this.numberOfNotes,
    0,
    0,
    0,
  ]);
  static endingBytes = Uint8Array.from([
    0, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255,
  ]);
  static xStride = 1 / this.numberOfNotes; // constant x offset from one point to the next
  static curveData = 33554432; // curve data for straight line, observed experimentally

  params: ExporterParams;

  constructor(params: ExporterParams) {
    super();
    this.params = params;
  }

  getFileContents(range: number) {
    const scale = this.params.scale;

    const baseFreqOffset = Math.log2(scale.baseFrequency / 440); // in number of octaves

    // construct point data
    const points = new ArrayBuffer(121 * 24);
    const pointsDoubles = new Float64Array(points);
    const pointsUint32 = new Uint32Array(points);
    for (let i = 0; i < ImageLineExporter.numberOfNotes; i++) {
      const edo12cents = (i - 69) * 100;
      const offset =
        frequencyToCentOffset(
          scale.getFrequency(i - this.params.baseMidiNote)
        ) - edo12cents;
      const normalizedOffset =
        ((offset / 1200 + baseFreqOffset) / range) * 0.5 + 0.5;
      const yCoord = clamp(0, 1, normalizedOffset);
      pointsDoubles[i * 3 + 1] = yCoord;
      if (i !== 0) {
        // no x offset and no curve data for first point
        pointsDoubles[i * 3] = ImageLineExporter.xStride;
        pointsUint32[i * 6 + 4] = 0;
        pointsUint32[i * 6 + 5] = ImageLineExporter.curveData;
      }
    }

    // assemble .fnv file
    const file = new Uint8Array(
      ImageLineExporter.headerBytes.length +
        points.byteLength +
        ImageLineExporter.endingBytes.length
    );
    let offset = 0;
    file.set(ImageLineExporter.headerBytes, offset);
    offset += ImageLineExporter.headerBytes.length;
    file.set(new Uint8Array(points), offset);
    offset += points.byteLength;
    file.set(ImageLineExporter.endingBytes, offset);

    return file;
  }

  saveHarmorPitchMap() {
    super.saveFile(
      this.params.filename + ".fnv",
      this.getFileContents(5),
      true
    );
  }

  saveSytrusPitchMap() {
    super.saveFile(
      this.params.filename + ".fnv",
      this.getFileContents(4),
      true
    );
  }
}

export class HarmorExporter extends ImageLineExporter {
  saveFile() {
    super.saveHarmorPitchMap();
  }
}

export class SytrusExporter extends ImageLineExporter {
  saveFile() {
    super.saveSytrusPitchMap();
  }
}
