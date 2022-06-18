import Fraction from "fraction.js";
import { describe, it, expect } from "vitest";

import { LINE_TYPE } from "../parser";
import { ScaleWorkshopOneData } from "../scaleWorkshopOne";

describe("Scale Workshop 1 compatibility layer", () => {
  it("can parse old query strings", () => {
    const url = new URL(
      "https://sevish.com/scaleworkshop/?name=16%20equal%20divisions%20of%202%2F1&data=75.%0A150.%0A225.%0A300.%0A375.%0A450.%0A525.%0A600.%0A675.%0A750.%0A825.%0A900.%0A975.%0A1050.%0A1125.%0A1200.&freq=440&midi=69&vert=5&horiz=1&colors=white%20black%20white%20black%20white%20black%20white%20white%20black%20white%20black%20white%20black%20white%20black%20white&waveform=sine&ampenv=pad"
    );
    const data = new ScaleWorkshopOneData(url);

    expect(data.name).toBe("16 equal divisions of 2/1");
    expect(data.midi).toBe(69);
    expect(data.source).toBe("");
    expect(data.vertical).toBe(5);
    expect(data.horizontal).toBe(1);
    expect(data.colors).toBe(
      "white black white black white black white white black white black white black white black white"
    );
    expect(data.waveform).toBe("sine");
    expect(data.ampenv).toBe("pad");

    const [scale, lineTypes] = data.parseTuningData();

    expect(lineTypes[0]).toBe(LINE_TYPE.UNISON);
    expect(lineTypes[1]).toBe(LINE_TYPE.CENTS);
    expect(scale.getMonzo(0).toCents()).toBeCloseTo(0);
    expect(scale.getMonzo(1).toCents()).toBeCloseTo(75);
    expect(scale.getMonzo(2).toCents()).toBeCloseTo(150);
    expect(scale.getMonzo(3).toCents()).toBeCloseTo(225);
    expect(scale.getMonzo(4).toCents()).toBeCloseTo(300);
    expect(scale.getMonzo(5).toCents()).toBeCloseTo(375);
    expect(scale.getMonzo(6).toCents()).toBeCloseTo(450);
    expect(scale.getMonzo(7).toCents()).toBeCloseTo(525);
    expect(scale.getMonzo(8).toCents()).toBeCloseTo(600);
    expect(scale.getMonzo(9).toCents()).toBeCloseTo(675);
    expect(scale.getMonzo(10).toCents()).toBeCloseTo(750);
    expect(scale.getMonzo(11).toCents()).toBeCloseTo(825);
    expect(scale.getMonzo(12).toCents()).toBeCloseTo(900);
    expect(scale.getMonzo(13).toCents()).toBeCloseTo(975);
    expect(scale.getMonzo(14).toCents()).toBeCloseTo(1050);
    expect(scale.getMonzo(15).toCents()).toBeCloseTo(1125);
    expect(scale.getMonzo(16).toCents()).toBeCloseTo(1200);
  });

  it("can parse all line types", () => {
    const url = new URL(
      "https://sevish.com/scaleworkshop/?data=100.0%0A1%2C2%0A3%2F2%0A4%5C5%0A2%2F1"
    );
    const data = new ScaleWorkshopOneData(url);

    const [scale, lineTypes] = data.parseTuningData();

    expect(lineTypes[0]).toBe(LINE_TYPE.UNISON);
    expect(scale.getFrequency(0)).toBeCloseTo(440);

    expect(lineTypes[1]).toBe(LINE_TYPE.CENTS);
    expect(scale.getMonzo(1).toCents()).toBeCloseTo(100);

    expect(lineTypes[2]).toBe(LINE_TYPE.DECIMAL);
    expect(scale.getMonzo(2).valueOf()).toBeCloseTo(1.2);

    expect(lineTypes[3]).toBe(LINE_TYPE.RATIO);
    expect(
      scale.getMonzo(3).toFraction().equals(new Fraction(3, 2))
    ).toBeTruthy();

    expect(lineTypes[4]).toBe(LINE_TYPE.N_OF_EDO);
    const [fractionOfEquave, equave] = scale.getMonzo(4).toEqualTemperament();
    expect(fractionOfEquave.equals(new Fraction(4, 5))).toBeTruthy();
    expect(equave.equals(new Fraction(2, 1))).toBeTruthy();

    expect(lineTypes[5]).toBe(LINE_TYPE.RATIO);
    expect(
      scale.getMonzo(5).toFraction().equals(new Fraction(2, 1))
    ).toBeTruthy();
  });
});
