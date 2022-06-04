import { LOG_PRIMES } from "temperaments";
import { version } from "../package.json";

// GLOBALS
export const APP_TITLE = `Scale Workshop ${version}`;

const NATS_TO_CENTS = 1200 / Math.LN2;
export const PRIME_CENTS = LOG_PRIMES.map(
  (logPrime) => logPrime * NATS_TO_CENTS
);
PRIME_CENTS[0] = 1200; // Ensure that octaves are exact

export const DEFAULT_NUMBER_OF_COMPONENTS = 25; // Enough to represent all primes < 100
export const NEWLINE_TEST = /\r?\n/;
export const UNIX_NEWLINE = "\n";

export const NUMBER_OF_NOTES = 128;

// Korg specific constants for exporters and importers
export const KORG = {
  programmer: "ScaleWorkshop",
  mnlg: {
    octaveSize: 12,
    scaleSize: 128,
    maxCents: 128000,
    refA: { val: 6900, ind: 69, freq: 440.0 },
    refC: { val: 6000, ind: 60, freq: 261.6255653 },
  },
};
