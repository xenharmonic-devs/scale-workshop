import { DEFAULT_NUMBER_OF_COMPONENTS, NEWLINE_TEST } from "@/constants";
import { TextImporter, type ImportResult } from "@/importers/base";
import {
  getLineType,
  LINE_TYPE,
  parseLine,
  Scale,
  type Interval,
} from "scale-workshop-core";

export class ScalaImporter extends TextImporter {
  parseText(input: string): ImportResult {
    const lines = input.split(NEWLINE_TEST);
    const firstLine = lines.lastIndexOf("!") + 1;
    const intervals: Interval[] = [];
    lines.slice(firstLine).forEach((line) => {
      line = line.trim();
      if (!line.length) {
        return;
      }
      line = line.split(/\s/)[0];
      const lineType = getLineType(line);
      if (lineType === LINE_TYPE.INVALID) {
        throw new Error(`Failed to parse line ${line}`);
      }
      intervals.push(
        parseLine(line, DEFAULT_NUMBER_OF_COMPONENTS, undefined, true)
      );
    });
    const scale = Scale.fromIntervalArray(intervals);
    return { scale };
  }
}
