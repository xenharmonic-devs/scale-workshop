import { LINE_TYPE } from "@/parser";
import { describe, it, expect } from "vitest";

import { AnaMarkImporter } from "../anamark";
import UNIT_TEST_SCALE from "./unittestscale.tun?raw";

describe("Anamark importer", () => {
  it("can parse text", () => {
    const importer = new AnaMarkImporter({} as Event);
    const { scale, lineTypes, name, baseMidiNote } = importer.parseText(
      UNIT_TEST_SCALE,
      "unittestscale.tun"
    );

    expect(scale.getMonzo(0).totalNats()).toBe(0);
    expect(lineTypes[0]).toBe(LINE_TYPE.UNISON);

    expect(scale.getMonzo(1).toCents()).toBeCloseTo(111);
    expect(lineTypes[1]).toBe(LINE_TYPE.CENTS);

    expect(name).toBe("Unit Test Scale");
    expect(scale.baseFrequency).toBeCloseTo(444);
    expect(baseMidiNote).toBe(68);
  });
});
