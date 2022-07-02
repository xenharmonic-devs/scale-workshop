import Fraction from "fraction.js";
import type { ExporterParams } from "../base";
import ExtendedMonzo from "../../monzo";
import { Interval } from "../../interval";
import Scale from "../../scale";

export function getTestData(appTitle: string) {
  const intervals = [
    new Interval(ExtendedMonzo.fromCents(100, 3), "cents"),
    new Interval(
      ExtendedMonzo.fromEqualTemperament(
        new Fraction(4, 5),
        new Fraction(2),
        3
      ),
      "equal temperament"
    ),
    new Interval(ExtendedMonzo.fromFraction(new Fraction(5, 3), 3), "ratio"),
    new Interval(ExtendedMonzo.fromValue(Math.E / 2, 3), "decimal"),
    new Interval(
      ExtendedMonzo.fromFraction(new Fraction(81, 80), 3).mul(5),
      "ratio"
    ),
    new Interval(ExtendedMonzo.fromNumber(2, 3), "ratio"),
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
      "invalid",
      "1,3591409142295225",
      "3486784401/3276800000",
      "2/1",
    ],
    date: new Date("February 22, 2022 20:22"),
  };
  return params;
}
