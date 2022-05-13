import { transpose, multiply, inv } from "mathjs";
import Fraction from "fraction.js";
import { LOG_PRIMES } from "@/constants";
import ExtendedMonzo from "@/monzo";
import Scale from "@/scale";

type Monzo = number[];
type MappingVector = number[];
type Metric = number[];
type IndexArray = number[];

function dot(monzo: Monzo, mapping: MappingVector): number {
  let result = 0;
  for (let i = 0; i < monzo.length; ++i) {
    result += monzo[i] * mapping[i];
  }
  return result;
}

function mul(monzo: Monzo, scalar: number) {
  return monzo.map((component) => component * scalar);
}

function div(monzo: Monzo, scalar: number) {
  return mul(monzo, 1 / scalar);
}

function norm(monzo: Monzo) {
  let total = 0;
  monzo.forEach((component) => {
    total += component * component;
  });
  return Math.sqrt(total);
}

function subInPlace(a: Monzo, b: Monzo) {
  for (let i = 0; i < a.length; ++i) {
    a[i] -= b[i];
  }
}

function sub(a: Monzo, b: Monzo) {
  const result = [...a];
  subInPlace(result, b);
  return result;
}

function abs(monzo: Monzo) {
  return monzo.map((component) => Math.abs(component));
}

function mulComponentwiseInPlace(a: Monzo, b: Metric) {
  for (let i = 0; i < a.length; ++i) {
    a[i] *= b[i];
  }
}

function divComponentwiseInPlace(a: Monzo, b: Metric) {
  for (let i = 0; i < a.length; ++i) {
    a[i] /= b[i];
  }
}

/*
Temper out a given list of commas while keeping the constrained intervals pure if possible.

Unless constrained, the magnitude of the resulting mapping is arbitrary, but reasonably close to just intonation
*/
function temper(
  justIntonation: MappingVector,
  commaList: Monzo[],
  constraints: Monzo[],
  numberOfIterations = 1000,
  stepSize = 0.5
) {
  const jFactors = constraints.map((constraint) =>
    dot(constraint, justIntonation)
  );

  const mapping: MappingVector = [...justIntonation];

  const normalizedCommaList = commaList.map((comma) => div(comma, norm(comma)));
  for (let i = 0; i < numberOfIterations; ++i) {
    normalizedCommaList.forEach((comma) => {
      subInPlace(mapping, mul(comma, dot(mapping, comma)));
    });
    for (let i = 0; i < constraints.length; ++i) {
      const mFactor = dot(constraints[i], mapping);
      subInPlace(
        mapping,
        mul(constraints[i], (mFactor - jFactors[i]) * mFactor * stepSize)
      );
    }
  }
  return mapping;
}

/*
Scale the mapping to minimize the maximum error from just intonation.
*/
function minimax(mapping: MappingVector, justIntonation: MappingVector) {
  let leastError = Infinity;
  let bestMapping = mapping;
  for (let i = 0; i < mapping.length; ++i) {
    for (let j = i + 1; j < mapping.length; ++j) {
      const candidate = mul(
        mapping,
        (justIntonation[i] + justIntonation[j]) / (mapping[i] + mapping[j])
      );
      const error = Math.max(...abs(sub(candidate, justIntonation)));
      if (error < leastError) {
        leastError = error;
        bestMapping = candidate;
      }
    }
  }
  return bestMapping;
}

export function inverseLogMetric(numberOfComponents: number): Metric {
  return LOG_PRIMES.slice(0, numberOfComponents).map(
    (logPrime) => 1 / logPrime
  );
}

function pseudoInverse(mat: MappingVector[]) {
  const transposed = transpose(mat);
  return multiply(transposed, inv(multiply(mat, transposed)));
}

function natssToColumns(natss: number[]) {
  const zero = new Fraction(0);
  const unison = Array(natss.length).fill(zero);
  const one = new Fraction(1);
  const columns: ExtendedMonzo[] = [];
  natss.forEach((nats) => {
    columns.push(new ExtendedMonzo(unison, one, nats));
  });
  return columns;
}

export class Mapping {
  columns: ExtendedMonzo[];

  constructor(columns: ExtendedMonzo[]) {
    this.columns = columns;
  }

  static fromCommaList(
    commaList: ExtendedMonzo[],
    subgroup: IndexArray,
    metric?: Metric,
    constraintList?: ExtendedMonzo[]
  ) {
    const realCommaList: Monzo[] = [];
    commaList.forEach((comma) => {
      if (!comma.residual.equals(1) || comma.nats !== 0) {
        throw new Error("Non-algebraic comma");
      }
      realCommaList.push(
        subgroup.map((index) => comma.vector[index].valueOf())
      );
    });

    const realConstraintList: Monzo[] = [];
    (constraintList || []).forEach((constraint) => {
      if (!constraint.residual.equals(1) || constraint.nats !== 0) {
        throw new Error("Non-algebraic constraint");
      }
      realConstraintList.push(
        subgroup.map((index) => constraint.vector[index].valueOf())
      );
    });

    const justIntonation = subgroup.map((index) => LOG_PRIMES[index]);
    if (metric !== undefined) {
      mulComponentwiseInPlace(justIntonation, metric);
      realCommaList.forEach((comma) => divComponentwiseInPlace(comma, metric));
      realConstraintList.forEach((constraint) =>
        divComponentwiseInPlace(constraint, metric)
      );
    }

    let primesToNats = temper(
      justIntonation,
      realCommaList,
      realConstraintList
    );
    if (realConstraintList.length === 0) {
      primesToNats = minimax(primesToNats, justIntonation);
    }

    if (metric !== undefined) {
      divComponentwiseInPlace(primesToNats, metric);
    }

    const numColumns = commaList[0].vector.length;
    const numRows = numColumns;

    const zero = new Fraction(0);
    const unison = Array(numRows).fill(zero);
    const columns: ExtendedMonzo[] = [];
    for (let i = 0; i < numColumns; ++i) {
      columns.push(new ExtendedMonzo(unison));
    }
    subgroup.forEach((index, i) => (columns[index].nats = primesToNats[i]));
    return new Mapping(columns);
  }

  static fromPatentVal(
    numberOfSteps: number,
    equave: Fraction,
    offsets: number[]
  ) {
    const numberOfComponents = offsets.length;
    const valNorm = numberOfSteps / Math.log(equave.valueOf());
    const columns: ExtendedMonzo[] = [];
    offsets.forEach((offset, i) => {
      const steps = Math.round(LOG_PRIMES[i] * valNorm) + offset;
      columns.push(
        ExtendedMonzo.fromEqualTemperament(
          new Fraction(steps, numberOfSteps),
          equave,
          numberOfComponents
        )
      );
    });
    return new Mapping(columns);
  }

  static fromTenneyEuclid(
    patentVals: number[],
    equave: number,
    metric: Metric
  ) {
    const logEquave = Math.log(equave.valueOf());
    const subspaceBasis: number[][] = [];
    patentVals.forEach((val) => {
      const basis: number[] = [];
      for (let i = 0; i < metric.length; ++i) {
        basis.push(Math.round((LOG_PRIMES[i] * val) / logEquave) * metric[i]);
      }
      subspaceBasis.push(basis);
    });

    const jip = LOG_PRIMES.slice(0, metric.length);
    mulComponentwiseInPlace(jip, metric);
    const natss = multiply(
      jip,
      multiply(pseudoInverse(subspaceBasis), subspaceBasis)
    );
    divComponentwiseInPlace(natss, metric);
    const columns = natssToColumns(natss);
    return new Mapping(columns);
  }

  get size() {
    return this.columns.length;
  }

  pureOctaves() {
    const purifier = Math.LN2 / this.columns[0].totalNats();
    const columns = this.columns.map((column) => column.stretch(purifier));
    return new Mapping(columns);
  }

  apply(interval: ExtendedMonzo): ExtendedMonzo;
  apply(scale: Scale): Scale;
  apply(intervalOrScale: ExtendedMonzo | Scale): ExtendedMonzo | Scale {
    if (intervalOrScale instanceof ExtendedMonzo) {
      const interval = intervalOrScale;
      let result = this.columns[0].mul(interval.vector[0]);
      for (let i = 1; i < this.size; ++i) {
        result = result.add(this.columns[i].mul(interval.vector[i]));
      }
      return result;
    }
    const scale = intervalOrScale;
    const intervals = scale.intervals.map((interval) => this.apply(interval));
    return new Scale(intervals, this.apply(scale.equave), scale.baseFrequency);
  }
}
