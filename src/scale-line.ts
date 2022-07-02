import Fraction from "fraction.js";
import ExtendedMonzo from "@/monzo";
import { fractionToString, isSafeFraction } from "@/utils";

export type ScaleLineOptions = {
  forbidMonzo?: boolean;
  forbidComposite?: boolean;
  preferredNumerator?: number;
  preferredDenominator?: number;
  preferredEtDenominator?: number;
  preferredEtEquave?: Fraction;
  centsFractionDigits?: number;
  decimalFractionDigits?: number;
};

function mergeOptions(a: ScaleLineOptions, b: ScaleLineOptions) {
  const result = Object.assign({}, a);
  Object.keys(b).forEach((key) => {
    const value = b[key as keyof ScaleLineOptions];
    if (value !== undefined) {
      (result as any)[key] = value;
    }
  });
  return result;
}

export type LineType =
  | "cents"
  | "decimal"
  | "monzo"
  | "equal temperament"
  | "ratio"
  | "unison"
  | "any";

// Result of parsing a scale line
// The line type and options are preferences and cannot always be enforced.
// The basic idea that there's a base interval and an optional small cents offset.
// If the basic idea fails, errors will be logged to the console.
export class ScaleLine {
  monzo: ExtendedMonzo;
  lineType: LineType;
  name: string;
  options: ScaleLineOptions;

  constructor(
    monzo: ExtendedMonzo,
    lineType: LineType,
    name?: string,
    options?: ScaleLineOptions
  ) {
    this.monzo = monzo;
    this.lineType = lineType;
    this.options = options || {};
    this.name = name || this.toString();
  }

  zeroed() {
    return new ScaleLine(this.monzo.mul(0), "unison", "1/1", this.options);
  }

  stretch(scalar: number) {
    return new ScaleLine(
      this.monzo.stretch(scalar),
      this.lineType,
      this.name,
      this.options
    );
  }

  neg() {
    const options = Object.assign({}, this.options);
    options.preferredDenominator = this.options.preferredNumerator;
    options.preferredNumerator = this.options.preferredDenominator;

    return new ScaleLine(this.monzo.neg(), this.lineType, undefined, options);
  }

  add(other: ScaleLine): ScaleLine {
    const monzo = this.monzo.add(other.monzo);
    const options = mergeOptions(this.options, other.options);
    if (this.lineType === "cents") {
      if (other.lineType === "cents") {
        return new ScaleLine(monzo, other.lineType, undefined, options);
      } else {
        return new ScaleLine(monzo, other.lineType, other.name, options);
      }
    }
    if (other.lineType === "cents") {
      return new ScaleLine(monzo, this.lineType, this.name, options);
    }
    if (this.lineType === "monzo") {
      if (
        other.lineType === "monzo" ||
        other.lineType === "equal temperament"
      ) {
        return new ScaleLine(monzo, this.lineType, undefined, options);
      }
      if (other.lineType === "ratio" && other.monzo.residual.equals(1)) {
        return new ScaleLine(monzo, this.lineType, undefined, options);
      }
      return new ScaleLine(monzo, "any", undefined, options);
    }
    if (other.lineType === "monzo") {
      return other.add(this);
    }
    if (this.lineType === other.lineType) {
      return new ScaleLine(monzo, this.lineType, undefined, options);
    }
    return new ScaleLine(monzo, "any", undefined, options);
  }

  sub(other: ScaleLine) {
    return this.add(other.neg());
  }

  mul(scalar: number | Fraction) {
    let lineType = this.lineType;
    if (
      this.lineType === "ratio" &&
      scalar instanceof Fraction &&
      scalar.d !== 1
    ) {
      lineType = "equal temperament";
    }
    return new ScaleLine(
      this.monzo.mul(scalar),
      lineType,
      undefined,
      this.options
    );
  }

  div(scalar: number | Fraction) {
    let lineType = this.lineType;
    if (this.lineType === "ratio") {
      if (typeof scalar === "number" && scalar !== 1) {
        lineType = "equal temperament";
      }
      if (scalar instanceof Fraction && scalar.n !== 1) {
        lineType = "equal temperament";
      }
    }
    return new ScaleLine(
      this.monzo.div(scalar),
      lineType,
      undefined,
      this.options
    );
  }

  mmod(other: ScaleLine) {
    const otherCents = other.monzo.totalCents();
    if (otherCents == 0) {
      throw Error("Modulo by unison");
    }
    const floorDiv = Math.floor(this.monzo.totalCents() / otherCents);
    return this.sub(other.mul(floorDiv));
  }

  equals(other: ScaleLine) {
    return this.monzo.equals(other.monzo);
  }

  compare(other: ScaleLine) {
    return this.monzo.compare(other.monzo);
  }

  totalCents() {
    return this.monzo.totalCents();
  }

  approximateHarmonic(denominator: number) {
    const options = Object.assign({}, this.options);
    options.preferredDenominator = denominator;
    return new ScaleLine(
      this.monzo.approximateHarmonic(denominator),
      "ratio",
      undefined,
      options
    );
  }

  approximateSubharmonic(numerator: number) {
    const options = Object.assign({}, this.options);
    options.preferredNumerator = numerator;
    return new ScaleLine(
      this.monzo.approximateSubharmonic(numerator),
      "ratio",
      undefined,
      options
    );
  }

  approximateOddLimit(limit: number) {
    return new ScaleLine(
      this.monzo.approximateOddLimit(limit),
      "ratio",
      undefined,
      this.options
    );
  }

  vary(maxCents: number) {
    const offset = (Math.random() * 2 - 1) * maxCents;
    const monzo = this.monzo;
    return new ScaleLine(
      new ExtendedMonzo(monzo.vector, monzo.residual, monzo.cents + offset),
      this.lineType,
      this.name,
      this.options
    );
  }

  monzoString() {
    let result = "[";
    for (let i = 0; i < this.monzo.vector.length; ++i) {
      result += this.monzo.vector[i].toFraction();
      if (i < this.monzo.vector.length - 1) {
        result += ", ";
      }
    }
    while (result.endsWith(", 0")) {
      result = result.slice(0, -3);
    }
    return result + ">";
  }

  centsString(offset = false) {
    let fractionDigits = this.options.centsFractionDigits;
    let cents;
    let operation = "";
    if (offset) {
      cents = this.monzo.cents;
      if (cents < 0) {
        operation = " - ";
        cents = -cents;
      } else if (cents > 0) {
        operation = " + ";
      } else {
        return "";
      }
    } else {
      cents = this.monzo.toCents();
    }
    if (cents === Math.round(cents)) {
      fractionDigits = undefined;
    }
    let result;
    if (fractionDigits === undefined) {
      result = cents.toString();
    } else {
      result = cents.toFixed(fractionDigits);
    }
    if (!result.includes(".")) {
      return operation + result + ".";
    }
    while (result[result.length - 1] === "0") {
      result = result.slice(0, -1);
    }
    return operation + result;
  }

  decimalString() {
    let fractionDigits = this.options.decimalFractionDigits;
    const value = this.monzo.valueOf();
    if (value === Math.round(value)) {
      fractionDigits = undefined;
    }
    let result;
    if (fractionDigits === undefined) {
      result = value.toString();
    } else {
      result = value.toFixed(fractionDigits);
    }
    if (!result.includes(".")) {
      return result + ",";
    }
    while (result[result.length - 1] === "0") {
      result = result.slice(0, -1);
    }
    return result.replace(".", ",");
  }

  equalTemperamentString() {
    const preferredDenominator = this.options.preferredEtDenominator;
    const preferredEquave = this.options.preferredEtEquave || new Fraction(2);
    let [fractionOfEquave, equave] = this.monzo.toEqualTemperament();
    for (let power = 2; power < 10; ++power) {
      if (equave.pow(power).equals(preferredEquave)) {
        fractionOfEquave = fractionOfEquave.div(power);
        equave = preferredEquave;
        break;
      }
      if (preferredEquave.pow(power).equals(equave)) {
        fractionOfEquave = fractionOfEquave.mul(power);
        equave = preferredEquave;
        break;
      }
    }

    const result = fractionToString(
      fractionOfEquave,
      undefined,
      preferredDenominator
    ).replace("/", "\\");
    if (equave.equals(2)) {
      return result;
    }
    return result + `<${equave.toFraction()}>`;
  }

  // Reverse parsing.
  // May produce composite lines if there is no other option.
  // May fall back to cents if composites are not allowed.
  toString(): string {
    const options = this.options;
    const cents = () => this.centsString();

    if (this.lineType === "cents") {
      return cents();
    }

    if (this.lineType === "decimal") {
      return this.decimalString();
    }

    if (this.lineType === "unison" && !this.monzo.totalCents()) {
      return "1/1";
    }

    if (this.lineType === "ratio") {
      const maybeFraction = this.monzo.clone();
      maybeFraction.cents = 0;

      if (maybeFraction.isFractional()) {
        const fraction = maybeFraction.toFraction();
        if (isSafeFraction(fraction)) {
          return (
            fractionToString(
              fraction,
              options.preferredNumerator,
              options.preferredDenominator
            ) + this.centsString(true)
          );
        }
        if (options.forbidMonzo) {
          return cents();
        }
      } else {
        console.warn("Failed to represent ratio line. Falling back.");
      }
    }

    if (this.lineType === "equal temperament") {
      const maybeEt = this.monzo.clone();
      maybeEt.cents = 0;

      if (maybeEt.isEqualTemperament()) {
        const [fractionOfEquave, equave] = maybeEt.toEqualTemperament();
        if (isSafeFraction(fractionOfEquave) && isSafeFraction(equave)) {
          const et = new ScaleLine(
            maybeEt,
            "equal temperament",
            "dummy",
            this.options
          );
          return et.equalTemperamentString() + this.centsString(true);
        }
        if (options.forbidMonzo) {
          return cents();
        }
      } else {
        console.warn(
          "Failed to represent equal temperament line. Falling back."
        );
      }
    }

    // Monzos and fallback for unsafe ratios and equal temperaments with residue
    if (!this.monzo.cents) {
      if (this.monzo.residual.equals(1)) {
        return this.monzoString();
      }
      if (options.forbidComposite) {
        return cents();
      }
      if (isSafeFraction(this.monzo.residual)) {
        if (this.lineType === "monzo") {
          console.warn("Failed to represent monzo. Displaying residue.");
        }
        return (
          this.monzoString() +
          " + " +
          fractionToString(
            this.monzo.residual,
            options.preferredNumerator,
            options.preferredDenominator
          )
        );
      } else {
        return cents();
      }
    }
    if (options.forbidComposite) {
      return cents();
    }
    if (this.monzo.residual.equals(1)) {
      return this.monzoString() + this.centsString(true);
    }
    if (this.lineType === "monzo") {
      console.warn("Failed to represent monzo. Displaying residue and offset.");
    }
    return (
      this.monzoString() +
      " + " +
      fractionToString(
        this.monzo.residual,
        options.preferredNumerator,
        options.preferredDenominator
      ) +
      this.centsString(true)
    );
  }
}
