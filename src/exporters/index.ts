import type { ExporterParams } from "@/exporters/base";
import { AnaMarkV1Exporter, AnaMarkV2Exporter } from "@/exporters/anamark";
import DeflemaskExporter from "@/exporters/deflemask";
import { HarmorExporter, SytrusExporter } from "@/exporters/image-line";
import KontaktExporter from "@/exporters/kontakt";
import { MnlgtunoExporter, MnlgtunsExporter } from "@/exporters/korg";
import MaxMSPExporter from "@/exporters/max-msp";
import PureDataExporter from "@/exporters/pure-data";
import { ScalaSclExporter, ScalaKbmExporter } from "@/exporters/scala";
import SoniccoutureExporter from "@/exporters/soniccouture";

const EXPORTERS = {
  anamarkv1: AnaMarkV1Exporter,
  anamarkv2: AnaMarkV2Exporter,
  scalascl: ScalaSclExporter,
  scalakbm: ScalaKbmExporter,
  maxmsp: MaxMSPExporter,
  puredata: PureDataExporter,
  kontakt: KontaktExporter,
  soniccouture: SoniccoutureExporter,
  harmor: HarmorExporter,
  sytrus: SytrusExporter,
  mnlgtuns: MnlgtunsExporter,
  mnlgtuno: MnlgtunoExporter,
  deflemask: DeflemaskExporter,
};

export type ExporterKey = keyof typeof EXPORTERS;

export function exportFile(exporter: ExporterKey, params: ExporterParams) {
  const instance = new EXPORTERS[exporter](params);
  alert("Saving instance " + exporter);
  instance.saveFile();
}
