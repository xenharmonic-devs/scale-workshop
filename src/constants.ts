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
    refA: { val: 6900, ind: 69, freq: 440.0 },
    refC: { val: 6000, ind: 60, freq: 261.6255653 },
  },
};

// Browser interaction
export const LEFT_MOUSE_BTN = 0;
