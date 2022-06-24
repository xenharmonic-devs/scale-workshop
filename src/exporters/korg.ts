import { KORG } from "@/constants";
import JSZip from "jszip";
import { BaseExporter, type ExporterParams } from "@/exporters/base";
import {
  clamp,
  frequencyToCentOffset,
  mmod,
  valueToCents,
} from "xen-dev-utils";

// This exporter converts tuning data into a zip-compressed file for use with Korg's
// 'logue Sound Librarian software, supporting their 'logue series of synthesizers.
// While this exporter preserves accuracy as much as possible, the Sound Librarian software
// unforunately truncates cent values to 1 cent precision. It's unknown whether the tuning accuracy
// from this exporter is written to the synthesizer and used in the synthesis.
class KorgExporter extends BaseExporter {
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
      const cents = clamp(0, KORG.mnlg.maxCents, c);

      const semitones = Math.floor(cents / 100.0);
      const microtones = cents / 100.0 - semitones;

      const u16a = new Uint16Array([Math.round(0x8000 * microtones)]);
      const u8a = new Uint8Array(u16a.buffer);

      data[dataIndex] = semitones;
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
      KORG.mnlg.refA.val +
      valueToCents(scale.baseFrequency / KORG.mnlg.refA.freq);

    // offset cents array for binary conversion
    let centsTable = [];

    for (let i = 0; i < KORG.mnlg.scaleSize; ++i) {
      const cents =
        frequencyToCentOffset(scale.getFrequency(i - baseMidiNote)) +
        refOffsetCents;
      centsTable.push(Math.round(cents * 1000) / 1000); // Round to 3 decimals
    }

    if (!this.useScaleFormat) {
      // normalize around root, truncate to 12 notes, and wrap flattened Cs
      const cNote =
        Math.floor(baseMidiNote / KORG.mnlg.octaveSize) * KORG.mnlg.octaveSize;
      centsTable = centsTable
        .slice(cNote, cNote + KORG.mnlg.octaveSize)
        .map((cents) => mmod(cents - KORG.mnlg.refC.val, KORG.mnlg.maxCents));
    }

    // convert to binary
    const binaryData = this.centsTableToMnlgBinary(centsTable);

    // prepare files for zipping
    const tuningInfo = this.getMnlgtunTuningInfoXML(
      "ScaleWorkshop",
      this.params.name!
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
