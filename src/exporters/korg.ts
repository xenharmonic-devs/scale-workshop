import { KORG, MAX_MTS_FREQ, MIN_MTS_FREQ } from "@/constants";
import JSZip from "jszip";
import { BaseExporter, type ExporterParams } from "@/exporters/base";
import {
  clamp,
  ftomtsBytes,
  mtof,
} from "xen-dev-utils";

// This exporter converts tuning data into a zip-compressed file for use with Korg's
// 'logue Sound Librarian software, supporting their 'logue series of synthesizers.
class KorgExporter extends BaseExporter {
  params: ExporterParams;
  useScaleFormat: boolean;

  constructor(params: ExporterParams, useScaleFormat: boolean) {
    super();
    this.params = params;
    this.useScaleFormat = useScaleFormat;
  }

  static frequencyTableToMtsBinary(frequencyTableIn: number[]) : Uint8Array {
      const dataSize = frequencyTableIn.length * 3;
      const data = new Uint8Array(dataSize);
      let index = 0;
      frequencyTableIn.forEach((freq:number) => {
        freq = clamp(MIN_MTS_FREQ, MAX_MTS_FREQ, freq);
      
        const bytes = ftomtsBytes(freq);
        data[index] = bytes[0];
        data[index + 1] = bytes[1];
        data[index + 2] = bytes[2];
        index += 3;
        })
      return data;
  }

  getTuningInfoXml(programmer: string, comment: string) {
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

  getFileInfoXml(product = "minilogue") {
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

  buildZipContents(): [JSZip, string] {
    const scale = this.params.scale;

    const tableSize = (this.useScaleFormat) ? KORG.mnlg.scaleSize : KORG.mnlg.octaveSize;
    const baseMidiNote = (this.useScaleFormat) ? -this.params.baseMidiNote : 0;
    const hzScalar = (this.useScaleFormat) ? 1 : mtof(0) / scale.getFrequency(baseMidiNote);

    const lastScaleIndex = baseMidiNote + tableSize;

    let frequencyTable = [];
    for (var i = baseMidiNote; i < lastScaleIndex; i++)
      frequencyTable.push(scale.getFrequency(i) * hzScalar);

    const binaryData = KorgExporter.frequencyTableToMtsBinary(frequencyTable);

    // prepare files for zipping
    const tuningInfo = this.getTuningInfoXml(
      "ScaleWorkshop",
      this.params.name!
    );
    const fileInfo = this.getFileInfoXml();
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
    const [zip, fileType] = this.buildZipContents();
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
