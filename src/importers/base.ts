import type Scale from "@/scale";

export type ImportResult = {
  scale: Scale;
  name?: string;
  baseMidiNote?: number;
};

export abstract class TextImporter {
  event: Event;

  constructor(event: Event) {
    this.event = event;
  }

  abstract parseText(input: string, filename: string): ImportResult;

  parse() {
    if (this.event.target == null) {
      throw new Error("Missing event target element");
    }
    const target: HTMLInputElement = this.event.target as HTMLInputElement;
    if (target.files === null) {
      throw new Error("Missing files");
    }
    const files: FileList = target.files;
    if (!files.length) {
      throw new Error("Missing file");
    }
    const reader = new FileReader();

    return new Promise<ImportResult>((resolve, reject) => {
      reader.onload = () =>
        resolve(this.parseText(reader.result as string, files[0].name));
      reader.onerror = reject;
      reader.readAsText(files[0]);
    });
  }
}
