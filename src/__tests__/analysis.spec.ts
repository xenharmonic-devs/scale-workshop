import { describe, it, expect } from "vitest";
import { arraysEqual, valueToCents } from "xen-dev-utils";

import {
  alignValues,
  concordanceShell,
  minimaxConcordanceShells,
  misalignment,
  otonalFundamental,
  utonalFundamental,
} from "../analysis";

const EPSILON = 1e-4;

describe("Otonal balancer", () => {
  it("can figure out that the major chord in 12edo approximates 4:5:6", () => {
    const frequencies = [2 ** 0, 2 ** (4 / 12), 2 ** (7 / 12)];
    const fundamental = otonalFundamental(frequencies);
    expect(
      arraysEqual(
        frequencies.map((f) => Math.round(f / fundamental)),
        [4, 5, 6]
      )
    ).toBeTruthy();
  });
});

describe("Utonal balancer", () => {
  it("can figure out that the minor chord in 12edo approximates 1/6:1/5:1/4", () => {
    const frequencies = [2 ** 0, 2 ** (3 / 12), 2 ** (7 / 12)];
    const fundamental = utonalFundamental(frequencies);
    expect(
      arraysEqual(
        frequencies.map((f) => 1 / Math.round(fundamental / f)),
        [1 / 6, 1 / 5, 1 / 4]
      )
    ).toBeTruthy();
  });
});

describe("Equal-division deviation minimizer", () => {
  it("can figure out the optimal alignment of 4:5:6 on 12edo", () => {
    const minimumAchievableError = alignValues([4, 5, 6], 100.0).error;
    expect(minimumAchievableError).closeTo(7.8206, EPSILON);

    // Attempt (and fail) to find a counter-example
    const pitches = [4, 5, 6].map(valueToCents);
    for (let i = 0; i < 100; ++i) {
      const offset = Math.random() * 1200;
      const candidate = pitches.map((pitch) => pitch + offset);
      expect(misalignment(candidate, 100.0)).toBeGreaterThanOrEqual(
        minimumAchievableError
      );
    }
  });
});

describe("Concordance shell finder", () => {
  it("finds the 37 : 44 : 66 : 70 : 83 : 93 : 99 : 111 : 157 : 187 : 197 : 209 : 235 : 249 shell in 12edo", () => {
    const shell = concordanceShell(37, 255, 5.0, 12);
    expect(shell.harmonics).toEqual([
      37, 44, 66, 70, 83, 93, 99, 111, 157, 187, 197, 209, 235, 249,
    ]);
  });
});

describe("Minimaxing concordance shell finder", () => {
  it("finds more variants for the shell rooted at 37 in 12edo", () => {
    const shells = minimaxConcordanceShells(37, 127, 3, 12);

    // Just some way to create a deterministic order.
    function cmp(a: number[], b: number[]) {
      if (!a.length && b.length) {
        return -1;
      } else if (a.length && !b.length) {
        return +1;
      } else if (!a.length && !b.length) {
        return 0;
      }
      if (a[0] < b[0]) {
        return -1;
      } else if (a[0] > b[0]) {
        return +1;
      }
      return cmp(a.slice(1), b.slice(1));
    }
    shells.sort((a, b) => cmp(a.harmonics, b.harmonics));
    for (const shell of shells) {
      shell.error = Math.round(shell.error * 1000) / 1000;
      delete shell.scaleDegrees;
    }
    expect(shells).toEqual([
      {
        harmonics: [37, 44, 66, 70, 83, 99, 111],
        error: 2.59,
        degrees: [0, 3, 10, 11, 14, 17, 19],
      },
      {
        harmonics: [37, 44, 66, 70, 99, 105, 111],
        error: 2.888,
        degrees: [0, 3, 10, 11, 17, 18, 19],
      },
      {
        harmonics: [37, 44, 83, 93],
        error: 2.177,
        degrees: [0, 3, 14, 16],
      },
    ]);
  });
});
