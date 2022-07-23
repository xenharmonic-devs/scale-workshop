import ExtendedMonzo from "@/monzo";
import { fractionToString, isSafeFraction } from "@/utils";
import { Fraction } from "xen-dev-utils";

export type IntervalOptions = {
  forbidMonzo?: boolean;
  forbidComposite?: boolean;
  preferredNumerator?: number;
  preferredDenominator?: number;
  preferredEtDenominator?: number;
  preferredEtEquave?: Fraction;
  centsFractionDigits?: number;
  decimalFractionDigits?: number;
};

function mergeOptions(a: IntervalOptions, b: IntervalOptions) {
  const result = Object.assign({}, a);
  Object.keys(b).forEach((key) => {
    const value = b[key as keyof IntervalOptions];
    if (value !== undefined) {
      (result as any)[key] = value;
    }
  });
  return result;
}

export type IntervalType =
  | "cents"
  | "decimal"
  | "monzo"
  | "equal temperament"
  | "ratio"
  | "any";

// Musical interval with preferred text formatting
// Result of parsing a scale line or format-aware scale generation
// The line type and options are preferences and cannot always be enforced.
// The basic idea that there's a base interval and an optional small cents offset.
// If the basic idea fails, errors will be logged to the console.
export class Interval {
  monzo: ExtendedMonzo;
  type: IntervalType;
  name: string;
  options: IntervalOptions;

  constructor(
    monzo: ExtendedMonzo,
    type: IntervalType,
    name?: string,
    options?: IntervalOptions
  ) {
    this.monzo = monzo;
    this.type = type;
    this.options = options || {};
    this.name = name || this.toString();
  }

  zeroed() {
    return new Interval(this.monzo.mul(0), this.type, undefined, this.options);
  }

  stretch(scalar: number) {
    return new Interval(
      this.monzo.stretch(scalar),
      this.type,
      this.name,
      this.options
    );
  }

  neg() {
    const options = Object.assign({}, this.options);
    options.preferredDenominator = this.options.preferredNumerator;
    options.preferredNumerator = this.options.preferredDenominator;

    return new Interval(this.monzo.neg(), this.type, undefined, options);
  }

  add(other: Interval): Interval {
    const monzo = this.monzo.add(other.monzo);
    const options = mergeOptions(this.options, other.options);
    if (this.type === "cents") {
      if (other.type === "cents") {
        return new Interval(monzo, other.type, undefined, options);
      } else {
        return new Interval(monzo, other.type, other.name, options);
      }
    }
    if (other.type === "cents") {
      return new Interval(monzo, this.type, this.name, options);
    }
    if (this.type === "monzo") {
      if (other.type === "monzo" || other.type === "equal temperament") {
        return new Interval(monzo, this.type, undefined, options);
      }
      if (other.type === "ratio" && other.monzo.residual.equals(1)) {
        return new Interval(monzo, this.type, undefined, options);
      }
      return new Interval(monzo, "any", undefined, options);
    }
    if (other.type === "monzo") {
      return other.add(this);
    }
    if (this.type === other.type) {
      return new Interval(monzo, this.type, undefined, options);
    }
    return new Interval(monzo, "any", undefined, options);
  }

  sub(other: Interval) {
    return this.add(other.neg());
  }

  mul(scalar: number | Fraction) {
    let type = this.type;
    if (this.type === "ratio" && scalar instanceof Fraction && scalar.d !== 1) {
      type = "equal temperament";
    }
    return new Interval(this.monzo.mul(scalar), type, undefined, this.options);
  }

  div(scalar: number | Fraction) {
    let type = this.type;
    if (this.type === "ratio") {
      if (typeof scalar === "number" && scalar !== 1) {
        type = "equal temperament";
      }
      if (scalar instanceof Fraction && scalar.n !== 1) {
        type = "equal temperament";
      }
    }
    return new Interval(this.monzo.div(scalar), type, undefined, this.options);
  }

  mmod(other: Interval) {
    const otherCents = other.monzo.totalCents();
    if (otherCents == 0) {
      throw Error("Modulo by unison");
    }
    const floorDiv = Math.floor(this.monzo.totalCents() / otherCents);
    return this.sub(other.mul(floorDiv));
  }

  equals(other: Interval) {
    return this.monzo.equals(other.monzo);
  }

  compare(other: Interval) {
    return this.monzo.compare(other.monzo);
  }

  totalCents() {
    return this.monzo.totalCents();
  }

  approximateHarmonic(denominator: number) {
    const options = Object.assign({}, this.options);
    options.preferredDenominator = denominator;
    return new Interval(
      this.monzo.approximateHarmonic(denominator),
      "ratio",
      undefined,
      options
    );
  }

  approximateSubharmonic(numerator: number) {
    const options = Object.assign({}, this.options);
    options.preferredNumerator = numerator;
    return new Interval(
      this.monzo.approximateSubharmonic(numerator),
      "ratio",
      undefined,
      options
    );
  }

  approximateOddLimit(limit: number) {
    return new Interval(
      this.monzo.approximateOddLimit(limit),
      "ratio",
      undefined,
      this.options
    );
  }

  vary(maxCents: number) {
    const offset = (Math.random() * 2 - 1) * maxCents;
    const monzo = this.monzo;
    return new Interval(
      new ExtendedMonzo(monzo.vector, monzo.residual, monzo.cents + offset),
      this.type,
      this.name,
      this.options
    );
  }

  mergeOptions(options: IntervalOptions) {
    return new Interval(
      this.monzo.clone(),
      this.type,
      this.name,
      mergeOptions(this.options, options)
    );
  }

  asType(type: IntervalType, options?: IntervalOptions) {
    return new Interval(
      this.monzo.clone(),
      type,
      undefined,
      options || this.options
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
    if (equave.equals(1)) {
      equave = preferredEquave;
    } else {
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

    if (this.type === "cents") {
      return cents();
    }

    if (this.type === "decimal") {
      return this.decimalString();
    }

    if (this.type === "ratio") {
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

    if (this.type === "equal temperament") {
      const maybeEt = this.monzo.clone();
      maybeEt.cents = 0;

      if (maybeEt.isEqualTemperament()) {
        const [fractionOfEquave, equave] = maybeEt.toEqualTemperament();
        if (isSafeFraction(fractionOfEquave) && isSafeFraction(equave)) {
          const et = new Interval(
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
        if (this.type === "monzo") {
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
    if (this.type === "monzo") {
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
