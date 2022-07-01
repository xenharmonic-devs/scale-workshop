import type ExtendedMonzo from "@/monzo";
import { getLineType, LINE_TYPE } from "@/parser";

export function adjustedLine(
  line: string,
  monzo: ExtendedMonzo,
  adjusted: ExtendedMonzo,
  centsFractionDigits = 3,
  fractionDigits = 6
) {
  const lineType = getLineType(line);
  if (
    [
      LINE_TYPE.RATIO,
      LINE_TYPE.N_OF_EDO,
      LINE_TYPE.GENERALIZED_N_OF_EDO,
    ].includes(lineType)
  ) {
    const diff = adjusted.sub(monzo).toCents();
    if (diff === 0) {
      return line;
    }
    const adjustment =
      diff >= 0
        ? `+ ${diff.toFixed(centsFractionDigits)}`
        : `- ${(-diff).toFixed(centsFractionDigits)}`;
    return `${line} ${adjustment}`;
  } else if (lineType === LINE_TYPE.DECIMAL) {
    return adjusted.valueOf().toFixed(fractionDigits).replace(".", ",");
  } else {
    return adjusted.toScaleLine({ centsFractionDigits });
  }
}
