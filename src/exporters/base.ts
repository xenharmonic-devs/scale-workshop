import type { Scale } from "scale-workshop-core";

export type ExporterParams = {
  newline: string;
  scale: Scale;
  filename: string;
  baseMidiNote: number;
  name?: string;
  scaleUrl?: string;
  description?: string;
  lines?: string[]; // May contain invalid lines
  appTitle?: string;
  date?: Date;
  format?: "name" | "cents" | "frequency" | "decimal" | "degree";
  basePeriod?: number;
  baseDegree?: number;
  centsRoot?: number;
  displayPeriod?: boolean;
  integratePeriod?: boolean;
};

export class BaseExporter {
  saveFile(
    filename: string,
    contents: any,
    raw = false,
    mimeType = "application/octet-stream,"
  ) {
    const link = document.createElement("a");
    link.download = filename;

    if (raw) {
      const blob = new Blob([contents], { type: "application/octet-stream" });
      link.href = window.URL.createObjectURL(blob);
    } else {
      link.href = "data:" + mimeType + encodeURIComponent(contents);
    }

    // Open save dialog
    link.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, view: window })
    );
  }
}
