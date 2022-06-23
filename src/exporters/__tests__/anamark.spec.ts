import { describe, it, expect } from "vitest";

import { AnaMarkV1Exporter, AnaMarkV2Exporter } from "../anamark";

import EXPECTED_CONTENT_V1 from "./anamark.v1.tun?raw";
import EXPECTED_CONTENT_V2 from "./anamark.v2.tun?raw";
import { getTestData } from "./test-data";

describe("Anamark exporters", () => {
  it("can handle all line types", () => {
    const params = getTestData("Anamark exporter unit test v0.0.0");
    const exporterV1 = new AnaMarkV1Exporter(params);
    expect(exporterV1.getFileContents()).toBe(EXPECTED_CONTENT_V1);

    const exporterV2 = new AnaMarkV2Exporter(params);
    expect(exporterV2.getFileContents()).toBe(EXPECTED_CONTENT_V2);
  });
});
