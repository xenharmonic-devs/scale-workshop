import {
  centsToValue,
  Fraction,
  gcd,
  getSemiconvergents,
  lcm,
  PRIMES,
  PRIME_CENTS,
  valueToCents,
} from "xen-dev-utils";
import { approximateOddLimit } from "./utils";

type Monzo = Fraction[];

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
  cents: number;

  constructor(vector: Monzo, residual?: Fraction, cents = 0) {
    if (residual === undefined) {
      residual = new Fraction(1);
    }
    this.vector = vector;
    this.residual = residual;
    this.cents = cents;
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
    return new ExtendedMonzo(vector, undefined, cents);
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
    return new ExtendedMonzo(vector, undefined, valueToCents(value));
  }

  get numberOfComponents() {
    return this.vector.length;
  }

  clone() {
    const vector: Monzo = [];
    this.vector.forEach((component) => {
      vector.push(new Fraction(component));
    });
    return new ExtendedMonzo(vector, new Fraction(this.residual), this.cents);
  }

  toFraction() {
    if (this.cents !== 0) {
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
    return this.totalCents();
  }

  toEqualTemperament(): [Fraction, Fraction] {
    if (this.cents !== 0) {
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

    if (equave.compare(1) < 0) {
      return [fractionOfEquave.neg(), equave.inverse()];
    }

    return [fractionOfEquave, equave];
  }

  isFractional() {
    if (this.cents !== 0) {
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
    if (this.cents !== 0) {
      return false;
    }
    if (!this.residual.equals(1)) {
      return false;
    }
    return true;
  }

  isPowerOfTwo() {
    if (this.cents !== 0) {
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

  neg() {
    const vector = this.vector.map((component) => component.neg());
    const residual = this.residual.inverse();
    return new ExtendedMonzo(vector, residual, -this.cents);
  }

  add(other: ExtendedMonzo) {
    if (this.vector.length !== other.vector.length) {
      throw new Error("Monzos of different length cannot be combined");
    }
    const vector = this.vector.map((component, i) =>
      component.add(other.vector[i])
    );
    const residual = this.residual.mul(other.residual);
    return new ExtendedMonzo(vector, residual, this.cents + other.cents);
  }

  sub(other: ExtendedMonzo) {
    if (this.vector.length !== other.vector.length) {
      throw new Error("Monzos of different length cannot be combined");
    }
    const vector = this.vector.map((component, i) =>
      component.sub(other.vector[i])
    );
    const residual = this.residual.div(other.residual);
    return new ExtendedMonzo(vector, residual, this.cents - other.cents);
  }

  mul(scalar: number | Fraction): ExtendedMonzo {
    if (typeof scalar === "number") {
      scalar = new Fraction(scalar);
    }
    const vector = this.vector.map((component) => component.mul(scalar));
    let residual: Fraction | null | undefined = this.residual.pow(scalar);
    let cents = this.cents;
    if (residual === null) {
      cents += valueToCents(this.residual.valueOf());
      residual = undefined;
    }
    cents *= scalar.valueOf();
    return new ExtendedMonzo(vector, residual, cents);
  }

  div(scalar: number | Fraction): ExtendedMonzo {
    if (typeof scalar === "number") {
      scalar = new Fraction(scalar);
    }
    const vector = this.vector.map((component) => component.div(scalar));
    let residual: Fraction | null | undefined = this.residual.pow(
      scalar.inverse()
    );
    let cents = this.cents;
    if (residual === null) {
      cents += valueToCents(this.residual.valueOf());
      residual = undefined;
    }
    cents /= scalar.valueOf();
    return new ExtendedMonzo(vector, residual, cents);
  }

  // Same as mul, but the offset is accumulated in cents
  stretch(scalar: number): ExtendedMonzo {
    const offset = this.totalCents() * (scalar - 1);
    return new ExtendedMonzo(this.vector, this.residual, this.cents + offset);
  }

  abs() {
    if (this.totalCents() < 0) {
      return this.neg();
    }
    return this;
  }

  // Consistent with Fraction.js
  mod(other: ExtendedMonzo) {
    const truncDiv = Math.trunc(this.totalCents() / other.totalCents());
    return this.sub(other.mul(truncDiv));
  }

  // Consistent with Mathematics
  mmod(other: ExtendedMonzo) {
    const otherCents = other.totalCents();
    if (otherCents == 0) {
      throw Error("Modulo by unison");
    }
    const floorDiv = Math.floor(this.totalCents() / otherCents);
    return this.sub(other.mul(floorDiv));
  }

  strictEquals(other: ExtendedMonzo) {
    return (
      monzosEqual(this.vector, other.vector) &&
      this.residual.equals(other.residual) &&
      this.cents === other.cents
    );
  }

  totalCents() {
    let total = this.cents + valueToCents(this.residual.valueOf());
    this.vector.forEach(
      (component, i) => (total += component.valueOf() * PRIME_CENTS[i])
    );
    return total;
  }

  valueOf() {
    return centsToValue(this.totalCents());
  }

  toContinued() {
    if (this.isFractional()) {
      return this.toFraction().toContinued();
    }
    return new Fraction(this.valueOf()).toContinued();
  }

  equals(other: ExtendedMonzo) {
    return this.totalCents() == other.totalCents();
  }

  compare(other: ExtendedMonzo) {
    return this.totalCents() - other.totalCents();
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
    return ExtendedMonzo.fromFraction(
      approximateOddLimit(this.totalCents(), limit),
      this.numberOfComponents
    );
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

  getSemiconvergent(depth: number) {
    let x;
    if (this.isFractional()) {
      x = this.toFraction();
    } else {
      x = new Fraction(this.valueOf());
    }
    const semiconvergents = getSemiconvergents(x, undefined, depth + 1);
    return semiconvergents[Math.min(depth, semiconvergents.length - 1)];
  }
}
