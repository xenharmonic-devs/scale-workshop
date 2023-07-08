import JSZip from "jszip";
import { BaseExporter, type ExporterParams } from "@/exporters/base";
import { mtof } from "xen-dev-utils";
import { frequencyTableToBinaryData } from "./mts-sysex";

// This exporter converts tuning data into a zip-compressed file for use with
// Korg's Sound Librarian software, supporting their 'logue series of synthesizers.
// The zip contains a small amount of metadata and a binary file containing a
// tuning table that follows the MTS Bulk Tuning Dump specification.
// The Sound Librarian software falls a bit short of being suitable for
// advanced tuning specifications by ignoring KBM files and truncating to
// 1 cent precision. Since the MTS tuning specifications support 0.0061 cent
// precision with arbitrary mapping, this exporter intends to fully utilize the
// capabilities of the 'logue tuning implementation. However it has not been
// strictly tested if the additional precision is employed in the synthesis.

export enum KorgModels {
  MONOLOGUE = "monologue",
  MINILOGUE = "minilogue",
  MINILOGUE_XD = "miniloguexd",
  PROLOGUE = "prologue",
}

export const KORG_MODEL_INFO = {
  [KorgModels.MONOLOGUE]: {
    name: "monologue",
    title: "Monologue",
    scale: ".molgtuns",
    octave: ".molgtuno",
  },
  [KorgModels.MINILOGUE]: {
    name: "minilogue",
    title: "Minilogue",
    scale: ".mnlgtuns",
    octave: ".mnlgtuno",
  },
  [KorgModels.MINILOGUE_XD]: {
    name: "minilogue xd",
    title: "Minilogue XD",
    scale: ".mnlgxdtuns",
    octave: ".mnlgxdtuno",
  },
  [KorgModels.PROLOGUE]: {
    name: "prologue",
    title: "Prologue",
    scale: ".prlgtuns",
    octave: ".prlgtuno",
  },
};

const OCTAVE_SIZE = 12;
const SCALE_SIZE = 128;

export function getKorgModelInfo(modelName: string) {
  switch (modelName) {
    case "minilogue":
      return KORG_MODEL_INFO[KorgModels.MINILOGUE];
    case "miniloguexd":
      return KORG_MODEL_INFO[KorgModels.MINILOGUE_XD];
    case "monologue":
      return KORG_MODEL_INFO[KorgModels.MONOLOGUE];
    case "prologue":
      return KORG_MODEL_INFO[KorgModels.PROLOGUE];
    default:
      throw new Error("Unknown Korg model name");
  }
}

export class KorgExporter extends BaseExporter {
  params: ExporterParams;
  modelName: string;
  useScaleFormat: boolean;

  constructor(
    params: ExporterParams,
    modelName: string,
    useScaleFormat: boolean
  ) {
    super();
    this.params = params;
    this.modelName = modelName;
    this.useScaleFormat = useScaleFormat;
  }

  getTuningInfoXml(model: string, programmer = "Scale Workshop", comment = "") {
    const format = getKorgModelInfo(model);
    const name = format.name;
    const tagName = name.replace(" ", "").toLowerCase();

    const rootName = this.useScaleFormat
      ? `${tagName}_TuneScaleInformation`
      : `${tagName}_TuneOctInformation`;

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      "\n" +
      `<${rootName}>\n` +
      `  <Programmer>${programmer}</Programmer>\n` +
      `  <Comment>${comment}</Comment>\n` +
      `</${rootName}>\n`;

    return xml;
  }

  getFileInfoXml(model: string) {
    const format = getKorgModelInfo(model);

    const [
      numTuneScaleData,
      numTuneOctData,
      fileNameHeader,
      dataName,
      binName,
    ] = this.useScaleFormat
      ? ["1", "0", "TunS_000.TunS_", "TuneScaleData", "TuneScaleBinary"]
      : ["0", "1", "TunO_000.TunO_", "TuneOctData", "TuneOctBinary"];

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      "\n" +
      "<KorgMSLibrarian_Data>\n" +
      `  <Product>${format.name}</Product>\n` +
      '  <Contents NumProgramData="0" NumPresetInformation="0" ' +
      `NumTuneScaleData="${numTuneScaleData}"\n` +
      `            NumTuneOctData="${numTuneOctData}">\n` +
      `    <${dataName}>\n` +
      `      <Information>${fileNameHeader}info</Information>\n` +
      `      <${binName}>${fileNameHeader}bin</${binName}>\n` +
      `    </${dataName}>\n` +
      "  </Contents>\n" +
      "</KorgMSLibrarian_Data>\n";

    return xml;
  }

  getFileContents(): [JSZip, string] {
    const scale = this.params.scale;
    const baseMidiNote = this.params.baseMidiNote;

    let frequencies = scale.getFrequencyRange(
      -baseMidiNote,
      SCALE_SIZE - baseMidiNote
    );

    if (!this.useScaleFormat) {
      // Normalize to lowest definable pitch, C = 0 "cents"
      // Choose C below base MIDI note
      const cNote = Math.trunc(baseMidiNote / OCTAVE_SIZE) * OCTAVE_SIZE;

      const rootFreq = mtof(0);
      const octaveFreq = mtof(12);

      const cRatio = rootFreq / frequencies[cNote];
      frequencies = frequencies
        .slice(cNote, cNote + OCTAVE_SIZE)
        .map((f: number) => {
          // Wrap all frequencies to within first octave
          let fnorm = f * cRatio;
          if (fnorm > octaveFreq) {
            const y = -Math.trunc(Math.log2(fnorm / rootFreq));
            fnorm = fnorm * Math.pow(2, y);
          }
          return fnorm;
        });
    }

    const binaryData = frequencyTableToBinaryData(frequencies);

    // prepare files for zipping
    const format = getKorgModelInfo(this.modelName);
    const tuningInfo = this.getTuningInfoXml(
      this.modelName,
      "ScaleWorkshop",
      this.params.name ?? ""
    );
    const fileInfo = this.getFileInfoXml(this.modelName);
    const [fileNameHeader, fileType] = this.useScaleFormat
      ? ["TunS_000.TunS_", format.scale]
      : ["TunO_000.TunO_", format.octave];

    const zip = new JSZip();
    zip.file(fileNameHeader + "bin", binaryData);
    zip.file(fileNameHeader + "info", tuningInfo);
    zip.file("FileInformation.xml", fileInfo);
    return [zip, fileType];
  }

  async saveFile() {
    const [zip, fileType] = this.getFileContents();
    const base64 = await zip.generateAsync({ type: "base64" });
    super.saveFile(
      this.params.filename + fileType,
      base64,
      false,
      "application/zip;base64,"
    );
  }
}
