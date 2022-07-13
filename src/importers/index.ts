import { AnaMarkImporter } from "./anamark";
import type { ImportResult } from "./base";
import { ScalaImporter } from "./scala";
import { KorgImporter } from "./korg"

const IMPORTERS = {
  scalascl: ScalaImporter,
  anamark: AnaMarkImporter,
  mnlgtun: KorgImporter,
};

export type ImporterKey = keyof typeof IMPORTERS;

export async function importFile(
  importer: ImporterKey,
  event: Event
): Promise<ImportResult> {
  const instance = new IMPORTERS[importer](event);
  const result = await instance.parse();
  return result;
}
