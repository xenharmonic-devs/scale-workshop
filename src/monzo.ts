import Fraction from "fraction.js";
import { PRIMES, LOG_PRIMES } from "@/constants";
import {
  gcd,
  lcm,
  getSemiConvergents,
  isSafeFraction,
  natsToCents,
  centsToNats,
  fractionToString,
} from "@/utils";

type Monzo = Fraction[];

export type ScaleLineOptions = {
  forbidMonzo?: boolean;
  forbidComposite?: boolean;
  centsFractionDigits?: number;
  preferredNumerator?: number;
  preferredDenominator?: number;
  preferredEdo?: number;
};

function monzosEqual(a: Monzo, b: Monzo) {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (!a[i].equals(b[i])) {
      return false;
    }
  }
  return true;
}

function numberToMonzoAndResidual(
  n: number,
  numberOfComponents: number
): [Monzo, Fraction] {
  const result: Monzo = [];
  for (let i = 0; i < numberOfComponents; ++i) {
    let component = 0;
    while (n % PRIMES[i] === 0) {
      n /= PRIMES[i];
      component++;
    }
    result.push(new Fraction(component));
  }
  return [result, new Fraction(n)];
}

function fractionToMonzoAndResidual(
  fraction: Fraction,
  numberOfComponents: number
): [Monzo, Fraction] {
  let numerator = fraction.n;
  let denominator = fraction.d;

  const result: Monzo = [];
  for (let i = 0; i < numberOfComponents; ++i) {
    let component = 0;
    while (numerator % PRIMES[i] === 0) {
      numerator /= PRIMES[i];
      component++;
    }
    while (denominator % PRIMES[i] === 0) {
      denominator /= PRIMES[i];
      component--;
    }
    result.push(new Fraction(component));
  }

  const residual = new Fraction({
    s: fraction.s,
    n: numerator,
    d: denominator,
  });
  return [result, residual];
}

export default class ExtendedMonzo {
  vector: Monzo;
  residual: Fraction;
  nats: number;

  constructor(vector: Monzo, residual?: Fraction, nats = 0) {
    if (residual === undefined) {
      residual = new Fraction(1);
    }
    this.vector = vector;
    this.residual = residual;
    this.nats = nats;
  }

  static fromNumber(n: number, numberOfComponents: number) {
    const [vector, residual] = numberToMonzoAndResidual(n, numberOfComponents);
    return new ExtendedMonzo(vector, residual);
  }

  static fromFraction(fraction: Fraction, numberOfComponents: number) {
    const [vector, residual] = fractionToMonzoAndResidual(
      fraction,
      numberOfComponents
    );
    return new ExtendedMonzo(vector, residual);
  }

  static fromCents(cents: number, numberOfComponents: number) {
    const vector: Monzo = [];
    while (vector.length < numberOfComponents) {
      vector.push(new Fraction(0));
    }
    return new ExtendedMonzo(vector, undefined, centsToNats(cents));
  }

  static fromEqualTemperament(
    fractionOfEquave: Fraction,
    equave: Fraction,
    numberOfComponents: number
  ) {
    const [equaveVector, residual] = fractionToMonzoAndResidual(
      equave,
      numberOfComponents
    );
    if (!residual.equals(1)) {
      throw new Error("Unable to convert equave to monzo");
    }
    const vector = equaveVector.map((component) =>
      component.mul(fractionOfEquave)
    );
    return new ExtendedMonzo(vector);
  }

  static fromValue(value: number, numberOfComponents: number) {
    const vector: Monzo = [];
    while (vector.length < numberOfComponents) {
      vector.push(new Fraction(0));
    }
    return new ExtendedMonzo(vector, undefined, Math.log(value));
  }

  get numberOfComponents() {
    return this.vector.length;
  }

  clone() {
    const vector: Monzo = [];
    this.vector.forEach((component) => {
      vector.push(new Fraction(component));
    });
    return new ExtendedMonzo(vector, new Fraction(this.residual), this.nats);
  }

  toFraction() {
    if (this.nats !== 0) {
      throw new Error("Unable to convert irrational number to fraction");
    }
    let result = this.residual;
    this.vector.forEach((component, i) => {
      const factor = new Fraction(PRIMES[i]).pow(component);
      if (factor === null) {
        throw new Error("Unable to convert irrational number to fraction");
      }
      result = result.mul(factor);
    });
    return result;
  }

  toCents() {
    return natsToCents(this.totalNats());
  }

  toEqualTemperament(): [Fraction, Fraction] {
    if (this.nats !== 0) {
      throw new Error(
        "Unable to convert non-algebraic number to equal temperament"
      );
    }
    if (!this.residual.equals(1)) {
      throw new Error(
        "Unable to convert non-representable fraction to equal temperament"
      );
    }
    if (this.vector.length === 0) {
      // At this point we know it's the zero monzo.
      return [new Fraction(0), new Fraction(1)];
    }
    let denominator = 1;
    this.vector.forEach((component) => {
      denominator = lcm(denominator, component.d);
    });
    let numerator = 0;
    this.vector.forEach((component) => {
      numerator = gcd(numerator, component.mul(denominator).n);
    });
    if (numerator === 0) {
      return [new Fraction(0), new Fraction(1)];
    }
    const fractionOfEquave = new Fraction(numerator, denominator);
    const equave = this.div(fractionOfEquave).toFraction();

    return [fractionOfEquave, equave];
  }

  isFractional() {
    if (this.nats !== 0) {
      return false;
    }
    for (let i = 0; i < this.numberOfComponents; ++i) {
      if (this.vector[i].d !== 1) {
        return false;
      }
    }
    return true;
  }

  isEqualTemperament() {
    if (this.nats !== 0) {
      return false;
    }
    if (!this.residual.equals(1)) {
      return false;
    }
    return true;
  }

  isPowerOfTwo() {
    if (this.nats !== 0) {
      return false;
    }
    if (!this.residual.equals(1)) {
      return false;
    }
    if (!this.vector.length) {
      return false;
    }
    for (let i = 1; i < this.vector.length; ++i) {
      if (!this.vector[i].equals(0)) {
        return false;
      }
    }
    return true;
  }

  monzoString() {
    let result = "[";
    for (let i = 0; i < this.vector.length; ++i) {
      result += this.vector[i].toFraction();
      if (i < this.vector.length - 1) {
        result += ", ";
      }
    }
    return result + ">";
  }

  centsString(total = true, fractionDigits?: number) {
    let cents;
    if (total) {
      cents = this.toCents();
    } else {
      cents = natsToCents(this.nats);
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
      return (result += ".");
    }
    while (result[result.length - 1] === "0") {
      result = result.slice(0, -1);
    }
    return result;
  }

  // Reverse parsing
  toScaleLine(options?: ScaleLineOptions): string {
    options = options || {};
    const centsFractionDigits = options.centsFractionDigits;
    const cents = () => this.centsString(true, centsFractionDigits);

    if (this.isFractional()) {
      if (options.preferredEdo !== undefined && this.isPowerOfTwo()) {
        return `${this.vector[0].valueOf() * options.preferredEdo}\\${
          options.preferredEdo
        }`;
      }
      const fraction = this.toFraction();
      if (isSafeFraction(fraction)) {
        return fractionToString(
          fraction,
          options.preferredNumerator,
          options.preferredDenominator
        );
      }
      if (options.forbidMonzo) {
        return cents();
      }
      if (this.residual.equals(1)) {
        return this.monzoString();
      }
      if (!options.forbidComposite || !isSafeFraction(this.residual)) {
        return cents();
      }
      return this.monzoString() + " + " + this.residual.toFraction();
    }

    if (this.isEqualTemperament()) {
      const [fractionOfEquave_, equave] = this.toEqualTemperament();
      let fractionOfEquave = fractionOfEquave_;
      if (equave.mod(2).equals(0)) {
        fractionOfEquave = fractionOfEquave.mul(equave.div(2));
        if (isSafeFraction(fractionOfEquave)) {
          return fractionToString(
            fractionOfEquave,
            undefined,
            options.preferredEdo
          ).replace("/", "\\");
        }
      }
      if (isSafeFraction(fractionOfEquave) && isSafeFraction(equave)) {
        return (
          fractionToString(
            fractionOfEquave,
            undefined,
            options.preferredEdo
          ).replace("/", "\\") +
          "<" +
          equave.toFraction() +
          ">"
        );
      }
      if (options.forbidMonzo) {
        return cents();
      }
      return this.monzoString();
    }

    if (options.forbidComposite || this.totalNats() === this.nats) {
      return cents();
    }

    const maybeFractionalPart = this.clone();
    maybeFractionalPart.nats = 0;
    if (
      maybeFractionalPart.isFractional() ||
      maybeFractionalPart.isEqualTemperament()
    ) {
      return (
        maybeFractionalPart.toScaleLine(options) +
        " + " +
        this.centsString(false, options.centsFractionDigits)
      );
    }

    return cents();
  }

  neg() {
    const vector = this.vector.map((component) => component.neg());
    const residual = this.residual.inverse();
    return new ExtendedMonzo(vector, residual, -this.nats);
  }

  add(other: ExtendedMonzo) {
    if (this.vector.length !== other.vector.length) {
      throw new Error("Monzos of different length cannot be combined");
    }
    const vector = this.vector.map((component, i) =>
      component.add(other.vector[i])
    );
    const residual = this.residual.mul(other.residual);
    return new ExtendedMonzo(vector, residual, this.nats + other.nats);
  }

  sub(other: ExtendedMonzo) {
    if (this.vector.length !== other.vector.length) {
      throw new Error("Monzos of different length cannot be combined");
    }
    const vector = this.vector.map((component, i) =>
      component.sub(other.vector[i])
    );
    const residual = this.residual.div(other.residual);
    return new ExtendedMonzo(vector, residual, this.nats - other.nats);
  }

  mul(scalar: number | Fraction): ExtendedMonzo {
    if (typeof scalar === "number") {
      scalar = new Fraction(scalar);
    }
    const vector = this.vector.map((component) => component.mul(scalar));
    let residual: Fraction | null | undefined = this.residual.pow(scalar);
    let nats = this.nats;
    if (residual === null) {
      nats += Math.log(this.residual.valueOf());
      residual = undefined;
    }
    nats *= scalar.valueOf();
    return new ExtendedMonzo(vector, residual, nats);
  }

  div(scalar: number | Fraction): ExtendedMonzo {
    if (typeof scalar === "number") {
      scalar = new Fraction(scalar);
    }
    const vector = this.vector.map((component) => component.div(scalar));
    let residual: Fraction | null | undefined = this.residual.pow(
      scalar.inverse()
    );
    let nats = this.nats;
    if (residual === null) {
      nats += Math.log(this.residual.valueOf());
      residual = undefined;
    }
    nats /= scalar.valueOf();
    return new ExtendedMonzo(vector, residual, nats);
  }

  // Same as mul, but the offset is accumulated in nats
  stretch(scalar: number): ExtendedMonzo {
    const offset = this.totalNats() * (scalar - 1);
    return new ExtendedMonzo(this.vector, this.residual, this.nats + offset);
  }

  abs() {
    if (this.totalNats() < 0) {
      return this.neg();
    }
    return this;
  }

  // Consistent with Fraction.js
  mod(other: ExtendedMonzo) {
    const truncDiv = Math.trunc(this.totalNats() / other.totalNats());
    return this.sub(other.mul(truncDiv));
  }

  // Consistent with Mathematics
  mmod(other: ExtendedMonzo) {
    const otherNats = other.totalNats();
    if (otherNats == 0) {
      throw Error("Modulo by unison");
    }
    const floorDiv = Math.floor(this.totalNats() / otherNats);
    return this.sub(other.mul(floorDiv));
  }

  strictEquals(other: ExtendedMonzo) {
    return (
      monzosEqual(this.vector, other.vector) &&
      this.residual.equals(other.residual) &&
      this.nats === other.nats
    );
  }

  totalNats() {
    let total = this.nats + Math.log(this.residual.valueOf());
    this.vector.forEach(
      (component, i) => (total += component.valueOf() * LOG_PRIMES[i])
    );
    return total;
  }

  valueOf() {
    return Math.exp(this.totalNats());
  }

  toContinued() {
    if (this.isFractional()) {
      return this.toFraction().toContinued();
    }
    return new Fraction(this.valueOf()).toContinued();
  }

  equals(other: ExtendedMonzo) {
    return this.totalNats() == other.totalNats();
  }

  compare(other: ExtendedMonzo) {
    return this.totalNats() - other.totalNats();
  }

  approximateHarmonic(denominator: number) {
    const numerator = Math.round(this.valueOf() * denominator);
    return ExtendedMonzo.fromFraction(
      new Fraction(numerator, denominator),
      this.numberOfComponents
    );
  }

  approximateSubharmonic(numerator: number) {
    const denominator = Math.round(numerator / this.valueOf());
    return ExtendedMonzo.fromFraction(
      new Fraction(numerator, denominator),
      this.numberOfComponents
    );
  }

  approximateOddLimit(limit: number) {
    const nats = this.totalNats();
    let bestError = Infinity;
    let best = new Fraction(1);
    // This is probably still unoptimized, but at least we calculate the logs only once
    const oddLogs: number[] = [];
    for (let n = 1; n <= limit; n += 2) {
      oddLogs.push(Math.log(n));
    }
    oddLogs.forEach((logNumerator, i) => {
      const numerator = 1 + 2 * i;
      oddLogs.forEach((logDenominator, j) => {
        const denominator = 1 + 2 * j;
        let candidate = logNumerator - logDenominator;
        let exponent = 0;
        while (candidate > nats) {
          candidate -= Math.LN2;
          exponent--;
        }
        while (candidate < nats) {
          candidate += Math.LN2;
          exponent++;
        }
        if (Math.abs(candidate - nats) < bestError) {
          bestError = Math.abs(candidate - nats);
          best = new Fraction(numerator, denominator).mul(
            new Fraction(2).pow(exponent)
          );
        }
        if (Math.abs(candidate - Math.LN2 - nats) < bestError) {
          bestError = Math.abs(candidate - Math.LN2 - nats);
          best = new Fraction(numerator, denominator).mul(
            new Fraction(2).pow(exponent - 1)
          );
        }
      });
    });
    return ExtendedMonzo.fromFraction(best, this.numberOfComponents);
  }

  approximateSimple(eps: number) {
    const fraction = new Fraction(this.valueOf()).simplify(eps);
    return ExtendedMonzo.fromFraction(fraction, this.numberOfComponents);
  }

  getConvergent(depth: number) {
    const continuedFraction = this.toContinued().slice(0, depth + 1);
    let result = new Fraction(continuedFraction[continuedFraction.length - 1]);
    for (let i = continuedFraction.length - 2; i >= 0; i--) {
      result = result.inverse().add(continuedFraction[i]);
    }
    return ExtendedMonzo.fromFraction(result, this.numberOfComponents);
  }

  getSemiConvergent(depth: number) {
    let x;
    if (this.isFractional()) {
      x = this.toFraction();
    } else {
      x = new Fraction(this.valueOf());
    }
    const semiConvergents = getSemiConvergents(x, undefined, depth + 1);
    return semiConvergents[Math.min(depth, semiConvergents.length - 1)];
  }
}
