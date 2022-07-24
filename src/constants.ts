import { version } from "../package.json";

// GLOBALS
export const APP_TITLE = `Scale Workshop ${version}`;

export const DEFAULT_NUMBER_OF_COMPONENTS = 25; // Enough to represent all primes < 100

export const NEWLINE_TEST = /\r?\n/;
export const UNIX_NEWLINE = "\n";
export const WINDOWS_NEWLINE = "\r\n";

export const NUMBER_OF_NOTES = 128;

// Korg specific constants for exporters and importers
export const KORG = {
  programmer: "ScaleWorkshop",
  mnlg: {
    octaveSize: 12,
    scaleSize: 128,
    maxCents: 128000,
  },
};

export const MIN_MTS_FREQ = 8.175798915643707;
export const MAX_MTS_FREQ = 12543.853951415975;
