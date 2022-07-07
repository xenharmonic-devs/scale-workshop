import { describe, it, expect } from "vitest";

import { ScalaImporter } from "../scala";

describe("Scala importer", () => {
  it("can handle all line types", () => {
    const text = [
      "! meanschis.scl",
      "!",
      "1/8-schisma temperament, Helmholtz",
      " 12",
      "!",
      " 91.44607",
      " 203.42157",
      " 294.86764",
      " 5/4",
      " 498.28921",
      " 589.73529",
      " 701.71079",
      " 793.15686",
      " 884.60293",
      " 996.57843",
      " 1088.02450",
      " 2/1",
    ].join("\n");

    const importer = new ScalaImporter();
    const { scale } = importer.parseText(text);

    expect(scale.getMonzo(0).totalCents()).toBe(0);

    expect(scale.getMonzo(1).toCents()).toBeCloseTo(91.44607);

    expect(scale.getMonzo(4).valueOf()).toBe(1.25);
  });
});
