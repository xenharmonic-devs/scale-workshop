import type { LINE_TYPE } from "@/parser";
import type Scale from "@/scale";
import JSZip, { type JSZipObject } from "jszip";

export type ImportResult = {
  scale: Scale;
  lineTypes: LINE_TYPE[];
  name?: string;
  baseMidiNote?: number;
};

export type ImportResultFragment = {
  scale?: Scale;
  lineTypes?: LINE_TYPE[];
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

export abstract class ZipImporter {
  event: Event;

  constructor(event: Event) {
    this.event = event;
  }

  abstract parseFile(file: JSZipObject): Promise<ImportResultFragment>;

  async parse() {
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

    const zip = new JSZip();

    const loadedZip = await zip.loadAsync(files[0]);

    const partials: Promise<ImportResultFragment>[] = [];
    Object.keys(loadedZip.files).forEach((key) => {
      const file = loadedZip.files[key];
      partials.push(this.parseFile(file));
    });

    const fragments = await Promise.all(partials);

    const result = {};
    fragments.forEach((fragment) => Object.assign(result, fragment));

    return result as ImportResult;
  }
}
