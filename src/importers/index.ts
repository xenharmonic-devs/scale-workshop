import type { ImportResult } from '@/importers/base'
import { AnaMarkImporter } from '@/importers/anamark'
import { ScalaImporter } from '@/importers/scala'
import { SonicWeaveInterchangeImporter } from '@/importers/xen-devs'

const IMPORTERS = {
  scalascl: ScalaImporter,
  anamark: AnaMarkImporter,
  xendevs: SonicWeaveInterchangeImporter
}

export type ImporterKey = keyof typeof IMPORTERS

export async function importFile(importer: ImporterKey, event: Event): Promise<ImportResult> {
  const instance = new IMPORTERS[importer](event)
  const result = await instance.parse()
  return result
}
