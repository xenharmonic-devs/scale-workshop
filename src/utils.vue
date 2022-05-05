<script lang="ts">
import Fraction from "fraction.js";

export function arraysEqual(a: any[], b: any[]) {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

// Stolen from fraction.js, because it's not exported.
export function gcd(a: number, b: number): number {
  if (!a) return b;
  if (!b) return a;

  while (true) {
    a %= b;
    if (!a) return b;
    b %= a;
    if (!b) return a;
  }
}

export function lcm(a: number, b: number): number {
  return (Math.abs(a) / gcd(a, b)) * Math.abs(b);
}

export function mmod(a: number, b: number) {
  return ((a % b) + b) % b;
}

// Calculate best rational approximations to a given fraction
// that are closer than any approximation with a smaller or equal denominator
export function getSemiConvergents(
  x: Fraction,
  maxDenominator?: number,
  maxLength?: number
) {
  /*
    Glossary
      cfDigit : the continued fraction digit
      num : the convergent numerator
      den : the convergent denominator
      scnum : the semiconvergent numerator
      scden : the semiconvergen denominator
      cind : tracks indicies of convergents
  */

  const result: Fraction[] = [];
  const cf = x.toContinued();
  const cind: number[] = [];

  for (let d = 0; d < cf.length; d++) {
    const cfDigit = cf[d];
    let num = cfDigit;
    let den = 1;

    // calculate the convergent
    for (let i = d; i > 0; i--) {
      [den, num] = [num, den];
      num += den * cf[i - 1];
    }

    if (d > 0) {
      for (let i = Math.ceil(cfDigit / 2); i < cfDigit; i++) {
        const scnum = num - (cfDigit - i) * result[cind[d - 1]].n;
        const scden = den - (cfDigit - i) * result[cind[d - 1]].d;

        if (scden > maxDenominator!) break;

        const convergent = new Fraction(scnum, scden);
        // See https://en.wikipedia.org/wiki/Continued_fraction#Semiconvergents
        // for the origin of this half-rule
        if (2 * i > cfDigit) {
          result.push(convergent);
        } else if (
          convergent
            .sub(x)
            .abs()
            .compare(result[result.length - 1].sub(x).abs()) < 0
        ) {
          result.push(convergent);
        }
        if (result.length >= maxLength!) {
          return result;
        }
      }
    }

    if (den > maxDenominator!) break;

    cind.push(result.length);
    result.push(new Fraction(num, den));
    if (result.length >= maxLength!) {
      return result;
    }
  }
  return result;
}
</script>
