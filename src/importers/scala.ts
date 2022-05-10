import { NEWLINE_TEST } from "@/constants";
import type ExtendedMonzo from "@/monzo";
import { getLineType, LINE_TYPE, parseLine } from "@/parser";
import Scale from "@/scale";
import { TextImporter, type ImportResult } from "./base";

export class ScalaImporter extends TextImporter {
  parseText(input: string): ImportResult {
    const lines = input.split(NEWLINE_TEST);
    const firstLine = lines.lastIndexOf("!") + 1;
    const intervals: ExtendedMonzo[] = [];
    const lineTypes: LINE_TYPE[] = [LINE_TYPE.UNISON];
    lines.slice(firstLine).forEach((line) => {
      line = line.trim();
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
    return { scale, lineTypes };
  }
}
