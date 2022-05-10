import { NEWLINE_TEST } from "@/constants";
import type ExtendedMonzo from "@/monzo";
import { getLineType, LINE_TYPE, parseLine } from "@/parser";
import Scale from "@/scale";
import { TextImporter, type ImportResult } from "./base";

export class AnaMarkImporter extends TextImporter {
  parseText(input: string, filename: string): ImportResult {
    const lines = input.split(NEWLINE_TEST);
    let name;
    let atInfoSection = false;
    for (let i = 0; i < lines.length; ++i) {
      if (lines[i].includes("[Info]")) {
        atInfoSection = true;
      } else if (atInfoSection) {
        if (lines[i].trim().startsWith("Name")) {
          const regex = /"(.*?)"/g;
          const match = lines[i].match(regex);
          if (match == null) {
            continue;
          }
          name = match[0].replace(/"/g, "").replace(/\.tun/g, "");
        }
      }
    }
    if (name === undefined) {
      name = filename.slice(0, -4);
    }
    let firstLineIndex = lines.findIndex(
      (line) =>
        line.includes("[Functional Tuning]") ||
        line.includes("[Functional tuning]")
    );
    if (firstLineIndex < 0) {
      throw new Error("Missing functional tuning");
    } else {
      firstLineIndex += 1;
    }
    const functionalLines = [];
    for (let i = firstLineIndex; i < lines.length; ++i) {
      const noteNumber = i - firstLineIndex;
      if (lines[i].includes("#=0")) {
        functionalLines.push(
          lines[i]
            .substring(lines[i].indexOf("#=0") + 6, lines[i].length - 2)
            .trim()
        );
      }
      if (lines[i].includes("#>")) {
        const m = (noteNumber + 1).toString();
        const prefix = "note " + m + '="#>-' + m;
        const dePrefixed = lines[i].replace(prefix, "");
        functionalLines.push(
          dePrefixed.substring(3, dePrefixed.indexOf("~")).trim()
        );
      }
    }

    const intervals: ExtendedMonzo[] = [];
    const lineTypes: LINE_TYPE[] = [LINE_TYPE.UNISON];
    functionalLines.forEach((line) => {
      if (!line.length) {
        return;
      }
      const lineType = getLineType(line);
      if (lineType === LINE_TYPE.INVALID) {
        throw new Error(`Failed to parse line ${line}`);
      }
      lineTypes.push(lineType);
      intervals.push(parseLine(line));
    });
    const scale = Scale.fromIntervalArray(intervals);

    const result: ImportResult = { scale, lineTypes, name };

    // get base frequency and MIDI note
    for (let i = firstLineIndex + 1; i < lines.length; i++) {
      if (lines[i].includes("!")) {
        scale.baseFrequency = parseFloat(
          lines[i].substring(lines[i].indexOf("!") + 2, lines[i].length - 2)
        );
        result.baseMidiNote = parseInt(
          lines[i].substring(0, lines[i].indexOf("!") - 2).replace("note ", "")
        );
      }
    }

    return result;
  }
}
