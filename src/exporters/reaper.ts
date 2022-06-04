import { getLineType, LINE_TYPE } from "@/parser";
import { fractionToString } from "@/utils";
import { mmod } from "temperaments";
import { BaseExporter, type ExporterParams } from "./base";

export default class ReaperExporter extends BaseExporter {
  static tuningMaxSize = 128;
  static fractionDigits = 3;

  params: ExporterParams;

  constructor(params: ExporterParams) {
    super();
    this.params = params;
  }

  getFileContentsAndSuffix() {
    const scale = this.params.scale;
    const names = this.params.names!;
    const format = this.params.format;
    const basePeriod = this.params.basePeriod || 0;
    const baseDegree = this.params.baseDegree || 0;
    let lineTypes: LINE_TYPE[];
    if (format === "name") {
      lineTypes = names.map((name) => getLineType(name));
      lineTypes.unshift(lineTypes.pop()!);
    }
    if (format === "cents") {
      lineTypes = Array(scale.size).fill(LINE_TYPE.CENTS);
    }
    if (format === "frequency") {
      lineTypes = Array(scale.size).fill(LINE_TYPE.FREQUENCY);
    }
    if (format === "decimal") {
      lineTypes = Array(scale.size).fill(LINE_TYPE.DECIMAL);
    }
    if (format === undefined) {
      throw new Error("No export format given");
    }

    let file = "# MIDI note / CC name map" + this.params.newline;

    for (let i = ReaperExporter.tuningMaxSize - 1; i >= 0; i--) {
      file += i.toString() + " ";

      let index = i - this.params.baseMidiNote;
      if (!this.params.integratePeriod) {
        index = mmod(index, scale.size);
      }

      if (format === "name" && index > 0 && index <= scale.size) {
        file += names[index - 1];
      } else if (format === "degree") {
        file += `${index + baseDegree}/${scale.size}`;
      } else {
        const digits = ReaperExporter.fractionDigits;
        const lineType = lineTypes![mmod(index, scale.size)];
        switch (lineType) {
          case LINE_TYPE.CENTS:
            file += scale.getMonzo(index).centsString();
            break;
          case LINE_TYPE.DECIMAL:
            file += scale
              .getMonzo(index)
              .valueOf()
              .toFixed(digits)
              .replace(".", ",");
            break;
          case LINE_TYPE.RATIO:
            file += fractionToString(scale.getMonzo(index).toFraction());
            break;
          case LINE_TYPE.N_OF_EDO:
            file += scale.getMonzo(index).equalTemperamentString();
            break;
          case LINE_TYPE.FREQUENCY:
            file += scale.getFrequency(index).toFixed(digits);
            break;
          case LINE_TYPE.UNISON:
            file += "1/1";
            break;
          case LINE_TYPE.INVALID:
            throw new Error("Cannot export invalid line");
          default:
            throw new Error(`Unrecognized line type ${lineType}`);
        }
      }

      if (this.params.displayPeriod) {
        file += ` (${basePeriod + Math.floor(index / scale.size)})`;
      }
      file += this.params.newline;
    }

    let suffix = ` NoteNames_${format}`;

    if (this.params.displayPeriod) {
      suffix += "_p";
    }
    if (this.params.integratePeriod) {
      suffix += "_exact";
    }

    return [file, suffix];
  }

  saveFile() {
    const [contents, suffix] = this.getFileContentsAndSuffix();
    super.saveFile(this.params.filename + suffix + ".txt", contents);
  }
}
