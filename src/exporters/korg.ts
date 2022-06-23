import { clamp, frequencyToCentOffset, mmod, ratioToCents } from "@/utils";
import JSZip from "jszip";
import { BaseExporter, type ExporterParams } from "./base";

// This exporter converts tuning data into a zip-compressed file for use with Korg's
// 'logue Sound Librarian software, supporting their 'logue series of synthesizers.
// While this exporter preserves accuracy as much as possible, the Sound Librarian software
// unforunately truncates cent values to 1 cent precision. It's unknown whether the tuning accuracy
// from this exporter is written to the synthesizer and used in the synthesis.
class KorgExporter extends BaseExporter {
  static mnlgOctaveSize = 12;
  static mnlgScaleSize = 128;
  static mnlgMaxCents = 128000;
  static mnlgRefA = { val: 6900, ind: 69, freq: 440.0 };
  static mnlgRefC = { val: 6000, ind: 60, freq: 261.6255653 };
  static programmer = "ScaleWorkshop";

  params: ExporterParams;
  useScaleFormat: boolean;

  constructor(params: ExporterParams, useScaleFormat: boolean) {
    super();
    this.params = params;
    this.useScaleFormat = useScaleFormat;
  }

  centsTableToMnlgBinary(centsTableIn: number[]) {
    const dataSize = centsTableIn.length * 3;
    const data = new Uint8Array(dataSize);
    let dataIndex = 0;
    centsTableIn.forEach((c) => {
      // restrict to valid values
      const cents = clamp(0, KorgExporter.mnlgMaxCents, c);

      const semitones = cents / 100.0;
      const microtones = Math.trunc(semitones);

      const u16a = new Uint16Array([
        Math.round(0x8000 * (semitones - microtones)),
      ]);
      const u8a = new Uint8Array(u16a.buffer);

      data[dataIndex] = microtones;
      data[dataIndex + 1] = u8a[1];
      data[dataIndex + 2] = u8a[0];
      dataIndex += 3;
    });
    return data;
  }

  getMnlgtunTuningInfoXML(programmer: string, comment: string) {
    // Builds an XML file necessary for the .mnlgtun file format
    const rootName = this.useScaleFormat
      ? "minilogue_TuneScaleInformation"
      : "minilogue_TuneOctInformation";
    const xml = document.implementation.createDocument(null, rootName);

    const Programmer = xml.createElement("Programmer");
    Programmer.textContent = programmer;
    xml.documentElement.appendChild(Programmer);

    const Comment = xml.createElement("Comment");
    Comment.textContent = comment;
    xml.documentElement.appendChild(Comment);

    return xml;
  }

  getMnlgtunFileInfoXML(product = "minilogue") {
    // Builds an XML file necessary for the .mnlgtun file format
    const rootName = "KorgMSLibrarian_Data";
    const xml = document.implementation.createDocument(null, rootName);

    const Product = xml.createElement("Product");
    Product.textContent = product;
    xml.documentElement.appendChild(Product);

    const Contents = xml.createElement("Contents");
    Contents.setAttribute("NumProgramData", "0");
    Contents.setAttribute("NumPresetInformation", "0");
    Contents.setAttribute("NumTuneScaleData", this.useScaleFormat ? "1" : "0");
    Contents.setAttribute("NumTuneOctData", this.useScaleFormat ? "0" : "1");

    const [fileNameHeader, dataName, binName] = this.useScaleFormat
      ? ["TunS_000.TunS_", "TuneScaleData", "TuneScaleBinary"]
      : ["TunO_000.TunO_", "TuneOctData", "TuneOctBinary"];

    const TuneData = xml.createElement(dataName);

    const Information = xml.createElement("Information");
    Information.textContent = fileNameHeader + "info";
    TuneData.appendChild(Information);

    const BinData = xml.createElement(binName);
    BinData.textContent = fileNameHeader + "bin";
    TuneData.appendChild(BinData);

    Contents.appendChild(TuneData);
    xml.documentElement.appendChild(Contents);

    return xml;
  }

  getFileContents(): [JSZip, string] {
    const scale = this.params.scale;
    const baseMidiNote = this.params.baseMidiNote;

    // the index of the table that's equal to the baseNote should have the following value
    const refOffsetCents =
      KorgExporter.mnlgRefA.val +
      ratioToCents(scale.baseFrequency / KorgExporter.mnlgRefA.freq);

    // offset cents array for binary conversion
    let centsTable = [];

    for (let i = 0; i < KorgExporter.mnlgScaleSize; ++i) {
      const cents =
        frequencyToCentOffset(scale.getFrequency(i - baseMidiNote)) +
        refOffsetCents;
      centsTable.push(Math.round(cents * 1000) / 1000); // Round to 3 decimals
    }

    if (!this.useScaleFormat) {
      // normalize around root, truncate to 12 notes, and wrap flattened Cs
      const cNote =
        Math.floor(baseMidiNote / KorgExporter.mnlgOctaveSize) *
        KorgExporter.mnlgOctaveSize;
      centsTable = centsTable
        .slice(cNote, cNote + KorgExporter.mnlgOctaveSize)
        .map((cents) =>
          mmod(cents - KorgExporter.mnlgRefC.val, KorgExporter.mnlgMaxCents)
        );
    }

    // convert to binary
    const binaryData = this.centsTableToMnlgBinary(centsTable);

    // prepare files for zipping
    const tuningInfo = this.getMnlgtunTuningInfoXML(
      "ScaleWorkshop",
      this.params.filename
    );
    const fileInfo = this.getMnlgtunFileInfoXML();
    const [fileNameHeader, fileType] = this.useScaleFormat
      ? ["TunS_000.TunS_", ".mnlgtuns"]
      : ["TunO_000.TunO_", ".mnlgtuno"];

    // build zip
    const zip = new JSZip();
    zip.file(fileNameHeader + "bin", binaryData);
    zip.file(fileNameHeader + "info", tuningInfo.documentElement.outerHTML);
    zip.file("FileInformation.xml", fileInfo.documentElement.outerHTML);
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

export class MnlgtunsExporter extends KorgExporter {
  constructor(params: ExporterParams) {
    super(params, true);
  }
}

export class MnlgtunoExporter extends KorgExporter {
  constructor(params: ExporterParams) {
    super(params, false);
  }
}
