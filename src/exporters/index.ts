import type { ExporterParams } from '@/exporters/base'
import { ScalaSclExporter, ScalaKbmExporter } from '@/exporters/scala'
import { AnaMarkV1Exporter, AnaMarkV2Exporter } from '@/exporters/anamark'
import KontaktExporter from '@/exporters/kontakt'
import DeflemaskExporter from '@/exporters/deflemask'
import { HarmorExporter, SytrusExporter } from '@/exporters/image-line'
import PureDataExporter from '@/exporters/pure-data'
import SoniccoutureExporter from '@/exporters/soniccouture'
import MaxMSPExporter from '@/exporters/max-msp'

const EXPORTERS = {
  scalascl: ScalaSclExporter,
  scalakbm: ScalaKbmExporter,
  anamarkv1: AnaMarkV1Exporter,
  anamarkv2: AnaMarkV2Exporter,
  kontakt: KontaktExporter,
  harmor: HarmorExporter,
  sytrus: SytrusExporter,
  deflemask: DeflemaskExporter,
  puredata: PureDataExporter,
  soniccouture: SoniccoutureExporter,
  maxmsp: MaxMSPExporter
}

export type ExporterKey = keyof typeof EXPORTERS

export function exportFile(exporter: ExporterKey, params: ExporterParams) {
  const instance = new EXPORTERS[exporter](params)
  instance.saveFile()
}
