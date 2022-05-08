import { createHash } from "crypto";
import { describe, it, expect } from "vitest";

import { HarmorExporter, SytrusExporter } from "../image-line";

import { getTestData } from "./test-data";

describe("Image-line exporters", () => {
  it("can handle all line types (Harmor)", () => {
    const params = getTestData("Image-line exporter unit test v0.0.0");
    const exporter = new HarmorExporter(params);
    const content = exporter.getFileContents(5);

    // Raw binary files are inconvenient so we're content with hashes.
    expect(createHash("sha256").update(content).digest("base64")).toBe(
      "mq2UxRopQ6dewbnMJORTStDIrHZUCthR1Qw6sDcP2Bk="
    );
  });

  it("can handle all line types (Sytrus)", () => {
    const params = getTestData("Image-line exporter unit test v0.0.0");
    const exporter = new SytrusExporter(params);
    const content = exporter.getFileContents(4);

    expect(createHash("sha256").update(content).digest("base64")).toBe(
      "GgdR29dxpMPuVRh4nXLBW4jPKCjoG8t8tckNNio6IBI="
    );
  });
});
