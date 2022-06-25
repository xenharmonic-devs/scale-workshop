import type Scale from "@/scale";

export type ExporterParams = {
  newline: string;
  name: string;
  scaleUrl: string;
  scale: Scale;
  filename: string;
  baseMidiNote: number;
  description?: string;
  lines?: string[]; // May contain invalid lines
  names?: string[]; // Should always match scale
  appTitle?: string;
  date?: Date;
  format?: "name" | "cents" | "frequency" | "decimal" | "degree";
  basePeriod?: number;
  baseDegree?: number;
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
