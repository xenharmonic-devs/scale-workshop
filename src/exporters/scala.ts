import { APP_TITLE } from "@/constants";
import { fractionToString } from "@/utils";
import { BaseExporter, type ExporterParams } from "@/exporters/base";

export class ScalaSclExporter extends BaseExporter {
  static maxInteger = 2147483647;

  params: ExporterParams;
  name: string;
  appTitle: string;

  constructor(params: ExporterParams) {
    super();
    this.params = params;
    this.name = params.name || "Untitled tuning";
    this.appTitle = params.appTitle || APP_TITLE;
  }

  getFileContents() {
    const newline = this.params.newline;
    const scale = this.params.scale;
    // assemble the .scl file contents
    let file = "! " + this.params.filename + ".scl" + newline;
    file += "! Created using " + this.appTitle + newline;
    file += "!" + newline;
    file += "! " + this.params.scaleUrl + newline;
    file += "!" + newline;
    file += this.name;
    file += newline + " ";

    file += scale.size.toString() + newline;
    file += "!" + newline;

    for (let i = 1; i <= scale.size; i++) {
      const monzo = scale.getMonzo(i);
      file += " ";
      if (monzo.isFractional()) {
        const ratio = monzo.toFraction();
        if (
          ratio.n <= ScalaSclExporter.maxInteger &&
          ratio.d <= ScalaSclExporter.maxInteger
        ) {
          file += fractionToString(ratio);
        } else {
          file += monzo.toCents().toFixed(6);
        }
      } else {
        file += monzo.toCents().toFixed(6);
      }
      file += newline;
    }

    return file;
  }

  saveFile() {
    super.saveFile(this.params.filename + ".scl", this.getFileContents());
  }
}

export class ScalaKbmExporter extends BaseExporter {
  params: ExporterParams;

  constructor(params: ExporterParams) {
    super();
    this.params = params;
  }

  getFileContents() {
    const newline = this.params.newline;
    const scale = this.params.scale;
    // assemble the .kbm file contents
    let file = "! Template for a keyboard mapping" + newline;
    file += "!" + newline;
    file += "! Size of map. The pattern repeats every so many keys:" + newline;
    file += scale.size.toString() + newline;
    file += "! First MIDI note number to retune:" + newline;
    file += "0" + newline;
    file += "! Last MIDI note number to retune:" + newline;
    file += "127" + newline;
    file +=
      "! Middle note where the first entry of the mapping is mapped to:" +
      newline;
    file += this.params.baseMidiNote.toString() + newline;
    file += "! Reference note for which frequency is given:" + newline;
    file += this.params.baseMidiNote.toString() + newline;
    file += "! Frequency to tune the above note to" + newline;
    file += scale.baseFrequency.toString() + newline;
    file +=
      "! Scale degree to consider as formal octave (determines difference in pitch" +
      newline;
    file += "! between adjacent mapping patterns):" + newline;
    file += scale.size.toString() + newline;
    file += "! Mapping." + newline;
    file +=
      "! The numbers represent scale degrees mapped to keys. The first entry is for" +
      newline;
    file +=
      "! the given middle note, the next for subsequent higher keys." + newline;
    file +=
      '! For an unmapped key, put in an "x". At the end, unmapped keys may be left out.' +
      newline;

    for (let i = 0; i < scale.size; i++) {
      file += i + newline;
    }

    return file;
  }

  saveFile() {
    super.saveFile(this.params.filename + ".kbm", this.getFileContents());
  }
}
