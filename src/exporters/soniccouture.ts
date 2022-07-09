import { BaseExporter, type ExporterParams } from "@/exporters/base";
import { ftom } from "xen-dev-utils";

export default class SoniccoutureExporter extends BaseExporter {
  static tuningMaxSize = 128;

  params: ExporterParams;

  constructor(params: ExporterParams) {
    super();
    this.params = params;
  }

  // assemble the nka contents
  getFileContents() {
    const newline = this.params.newline;
    const baseMidiNote = this.params.baseMidiNote;
    const tuningMaxSize = SoniccoutureExporter.tuningMaxSize;

    // first line should always be "%XenSetup"
    let file = "%XenSetup" + newline;

    let centsOffsetPart = "";
    // loop through 128 notes to get semitone offset
    for (let i = 0; i < tuningMaxSize; i++) {
      const [noteNumber, cents] = ftom(
        this.params.scale.getFrequency(i - baseMidiNote)
      );

      // if we're out of MIDI note range, leave semitone offset as default
      if (noteNumber < 0 || noteNumber >= tuningMaxSize) {
        file += "0" + newline;
        centsOffsetPart += "0" + newline;
      }

      // success, we're in range of another note, so get the semitone offset
      else {
        file += (noteNumber - i).toString() + newline;
        centsOffsetPart += (cents * 100).toFixed() + newline;
      }
    }

    // simulate looping through 128 notes to get cents offset
    file += centsOffsetPart;

    // Soniccouture .nka format requires 0 followed by newline to end the file
    file += "0" + newline;

    return file;
  }

  saveFile() {
    super.saveFile(this.params.filename + ".nka", this.getFileContents());
  }
}
