import { describe, it, expect } from "vitest";
import { valueToCents } from "xen-dev-utils";

import {
  approximateOddLimit,
  autoKeyColors,
  formatExponential,
  formatHertz,
  stringToFraction,
} from "../utils";

function naiveExponential(x: number, fractionDigits = 3) {
  if (Math.abs(x) < 10000) {
    return x.toFixed(fractionDigits);
  }
  const f = 10 ** (Math.floor(Math.log10(Math.abs(x))) - fractionDigits);
  return (Math.round(x / f) * f).toExponential();
}

describe("Exponential formatter", () => {
  it("leaves a small number as is", () => {
    expect(formatExponential(1234.567)).toBe("1234.567");
  });

  it("doesn't use scientific notation for tiny numbers", () => {
    expect(formatExponential(0.001)).toBe("0.001");
  });

  it("uses scientific notation for large numbers", () => {
    expect(formatExponential(123456.789)).toBe("1.235e+5");
  });

  it("can handle very large numbers", () => {
    expect(formatExponential(23456789e32)).toBe("2.346e+39");
  });

  it("agrees with the naive implementation", () => {
    const value = Math.random() * 10000;
    expect(formatExponential(value)).toBe(naiveExponential(value));
  });
});

describe("Hertz formatter", () => {
  it("leaves resonable frequencies as is", () => {
    expect(formatHertz(12.345)).toBe("12.345Hz");
    expect(formatHertz(21234.567)).toBe("21234.567Hz");
  });

  it("supports millihertz", () => {
    expect(formatHertz(123.456e-3)).toBe("123.456mHz");
  });

  it("supports microhertz", () => {
    expect(formatHertz(123.456e-6)).toBe("123.456µHz");
  });

  it("supports kilohertz", () => {
    expect(formatHertz(123.456e3)).toBe("123.456kHz");
  });

  it("supports megahertz", () => {
    expect(formatHertz(123.456e6)).toBe("123.456MHz");
  });
});

describe("Auto key color algorithm", () => {
  it("produces the chromatic scale starting from A with 12 notes", () => {
    const colors = autoKeyColors(12);
    expect(colors.join(" ")).toBe(
      "white black white white black white black white white black white black"
    );
  });

  it("produces something resonable with 17 notes", () => {
    const colors = autoKeyColors(17);
    expect(colors.join(" ")).toBe(
      "white white black white white white black white white black white white white black white white black"
    );
  });
});

describe("Fraction parser", () => {
  it("throws an error with multiple slashes", () => {
    expect(() => stringToFraction("1/-2/3")).toThrow();
  });
});

describe("Odd limit approximator", () => {
  it("can approximate tau in the 15-odd-limit", () => {
    const approximation = approximateOddLimit(valueToCents(2 * Math.PI), 15);
    expect(approximation.equals("44/7")).toBeTruthy();
    expect(approximation.valueOf()).toBeCloseTo(2 * Math.PI);
  });

  it("can approximate e in the 21-odd-limit", () => {
    const approximation = approximateOddLimit(valueToCents(Math.E), 21);
    expect(approximation.equals("19/7")).toBeTruthy();
    expect(approximation.valueOf()).toBeCloseTo(Math.E);
  });
});
