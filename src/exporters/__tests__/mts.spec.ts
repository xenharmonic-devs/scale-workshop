import { createHash } from "crypto";
import { describe, it, expect } from "vitest";

import { getTestData } from "./test-data";
import MtsSysexExporter from "../mts-sysex";

describe("MTS exporter", () => {
  it("can handle all line types", async () => {
    const params = getTestData(
      "MTS Sysex Bulk Tuning Dump exporter unit test v0.0.0"
    );
    params.presetIndex = 1;

    const exporter = new MtsSysexExporter(params);

    const scaleData = exporter.getBulkTuningData();
    expect(createHash("sha256").update(scaleData).digest("base64")).toBe(
      "Ps5Ddp9lBYZgCn7Y8aSBnhXOcfIm+sh9AcnybiLX4Zg="
    );

    // Name is padded with spaces
    const nameData = exporter.getNameData();
    expect(nameData).toEqual([
      84, 101, 115, 116, 32, 83, 99, 97, 108, 101, 32, 32, 32, 32, 32, 32,
    ]);

    const sysExMsg = exporter.buildSysExDump();
    expect(createHash("sha256").update(sysExMsg).digest("base64")).toBe(
      "Dx+z9IBMNqBrj7/g4EJ3XQxMPKbtQqmpfjLdoPPrV48="
    );
  });

  it("can gracefully handle invalid parameters", async () => {
    const params = getTestData(
      "MTS Sysex Bulk Tuning Dump exporter unit test v0.0.0"
    );
    params.name = "Super Special Test Scale";
    params.presetIndex = -1;

    const exporter = new MtsSysexExporter(params);

    const scaleData = exporter.getBulkTuningData();
    expect(createHash("sha256").update(scaleData).digest("base64")).toBe(
      "Ps5Ddp9lBYZgCn7Y8aSBnhXOcfIm+sh9AcnybiLX4Zg="
    );

    // Name is truncated
    const nameData = exporter.getNameData();
    expect(nameData).toEqual([
      83, 117, 112, 101, 114, 32, 83, 112, 101, 99, 105, 97, 108, 32, 84, 101,
    ]);

    const sysExMsg = exporter.buildSysExDump();
    expect(createHash("sha256").update(sysExMsg).digest("base64")).toBe(
      "8TgBDEn+mTm/xar39zeO9NBCcRn6KymbO/ZeMfa8rq0="
    );
  });

  return;
});
