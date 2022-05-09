import Fraction from "fraction.js";
import ExtendedMonzo from "./monzo";

export enum Quality {
  Perfect = "P",
  Major = "M",
  Minor = "m",
  Augmented = "a",  // Reserve capital 'A' for future use (A4 = 440Hz)
  Diminished = "d",
  Neutral = "N",
  HalfAugmented = "ha",
  HalfDiminished = "hd"
};

const BASIC_MONZOS = {
  "d2": [19, -12],
  "d6": [18, -11],
  "d3": [16, -10],
  "d7": [15, -9],
  "d4": [13, -8],
  "d1": [11, -7],
  "d5": [10, -6],
  "m2": [8, -5],
  "m6": [7, -4],
  "m3": [5, -3],
  "m7": [4, -2],
  "P4": [2, -1],
  "P1": [0, 0],
  "P5": [-1, 1],
  "M2": [-3, 2],
  "M6": [-4, 3],
  "M3": [-6, 4],
  "M7": [-7, 5],
  "a4": [-9, 6],
  "a1": [-11, 7],
  "a5": [-12, 8],
  "a2": [-14, 9],
  "a6": [-15, 10],
  "a3": [-17, 11],
  "a7": [-18, 12],

  // Extra half-diminished intervals
  "hd2": [13.5, -8.5],
  "hd6": [12.5, -7.5],
  "hd3": [10.5, -6.5],
  "hd7": [9.5, -5.5],
  "hd4": [7.5, -4.5],
  "hd1": [5.5, -3.5],
  "hd5": [4.5, -2.5],
  // Extra neutral intervals
  "N2": [2.5, -1.5],
  "N6": [1.5, -0.5],
  "N3": [-0.5, 0.5],
  "N7": [-1.5, 1.5],
  // Extra half-augmented intervals
  "ha4": [-3.5, 2.5],
  "ha1": [-5.5, 3.5],
  "ha5": [-6.5, 4.5],
  "ha2": [-8.5, 5.5],
  "ha6": [-9.5, 6.5],
  "ha3": [-11.5, 7.5],
  "ha7": [-12.5, 8.5],
};

export class Interval {
  quality: Quality;
  intervalClass: number;
  augmentations: number;

  constructor(quality: Quality, intervalClass: number, augmentations = 0) {
    this.quality = quality;
    this.intervalClass = intervalClass;
    this.augmentations = augmentations;
  }

  canParse(token: string) {
    return /([PMmadN]|ha|hd)[ad]*\d+/.test(token);
  }

  static fromString(token: string) {
    let prefix = token[0];
    token = token.slice(1);
    if (prefix === "h") {
      prefix += token[0];
      token = token.slice(1);
    }
    let augmentations = 0;
    while (token.startsWith("a") || token.startsWith("d")) {
      if (token.startsWith("a")) {
        augmentations++;
      } else {
        augmentations--;
      }
      token = token.slice(1);
    }
    return new Interval(prefix as Quality, parseInt(token), augmentations);
  }

  getBasicAndOctave() : [string, number] {
    const octaves = Math.floor((this.intervalClass - 1)/7);
    const basicClass = this.intervalClass - octaves*7;
    return [`${this.quality}${basicClass}`, octaves];
  }

  toExtendedMonzo(numberOfComponent: number) {
    if (numberOfComponent < 2) {
      throw new Error("Need at least two components to store 3 limit intervals");
    }
    const [basic, octaves] = this.getBasicAndOctave();
    let [twos, threes] = BASIC_MONZOS[basic as keyof typeof BASIC_MONZOS];
    twos += octaves - this.augmentations * 11;
    threes += this.augmentations * 7;
    const monzo = [new Fraction(twos), new Fraction(threes)];
    for (let i = 2; i < numberOfComponent; ++i) {
      monzo.push(new Fraction(0));
    }
    return new ExtendedMonzo(monzo);
  }
}
