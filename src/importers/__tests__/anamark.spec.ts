import { describe, it, expect } from "vitest";

import { AnaMarkImporter } from "../anamark";
// @ts-ignore
import UNIT_TEST_SCALE from "./unittestscale.tun?raw";

describe("Anamark importer", () => {
  it("can parse text", () => {
    const importer = new AnaMarkImporter();
    const { scale, name, baseMidiNote } = importer.parseText(
      UNIT_TEST_SCALE,
      "unittestscale.tun"
    );

    expect(scale.getMonzo(0).totalCents()).toBe(0);

    expect(scale.getMonzo(1).toCents()).toBeCloseTo(111);

    expect(name).toBe("Unit Test Scale");
    expect(scale.baseFrequency).toBeCloseTo(444);
    expect(baseMidiNote).toBe(68);
  });
});
