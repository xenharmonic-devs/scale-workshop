import ExtendedMonzo from "@/monzo";
import Scale from "@/scale";
import Fraction from "fraction.js";
import type { ExporterParams } from "../base";

export function getTestData(appTitle: string) {
  const intervals = [
    ExtendedMonzo.fromCents(100, 3),
    ExtendedMonzo.fromEqualTemperament(new Fraction(4, 5), new Fraction(2), 3),
    ExtendedMonzo.fromFraction(new Fraction(5, 3), 3),
    ExtendedMonzo.fromValue(Math.E / 2, 3),
    ExtendedMonzo.fromFraction(new Fraction(81, 80), 3).mul(5),
    ExtendedMonzo.fromNumber(2, 3),
  ];
  const scale = Scale.fromIntervalArray(intervals);
  const params: ExporterParams = {
    filename: "test",
    newline: "\n",
    scaleUrl: "https://sevish.com/scaleworkshop/",
    name: "Test Scale",
    scale: scale,
    appTitle,
    description: "A scale for testing if the exporter works",
    baseMidiNote: 69,
    lines: [
      "100.",
      "4\\5",
      "5/3",
      "1,3591409142295225",
      "3486784401/3276800000",
      "2/1",
    ],
    date: new Date("February 22, 2022 20:22"),
  };
  return params;
}
