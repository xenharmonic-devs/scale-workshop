import { AnaMarkV1Exporter, AnaMarkV2Exporter } from "./anamark";
import type { ExporterParams } from "./base";
import DeflemaskExporter from "./deflemask";
import { HarmorExporter, SytrusExporter } from "./image-line";
import KontaktExporter from "./kontakt";
import { MnlgtunoExporter, MnlgtunsExporter } from "./korg";
import MaxMSPExporter from "./max-msp";
import PureDataExporter from "./pure-data";
import { ScalaSclExporter, ScalaKbmExporter } from "./scala";
import SoniccoutureExporter from "./soniccouture";

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
  instance.saveFile();
}
