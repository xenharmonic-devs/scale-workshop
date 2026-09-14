/**
 * Harmonium spectrum, measured from a recording of a real instrument.
 *
 * A single sustained C3 note was analysed and found to contain three free-reed
 * ranks sounding together, not one:
 *
 *   - an 8' bass reed at 131.0436 Hz            -> ratio 1
 *   - a 4' octave reed 1202.48 cents above it   -> ratio 2.0029 (a near-octave,
 *     2.48 cents wide, which is what makes the timbre shimmer rather than sit
 *     still; the two ranks beat against each other at 0.375 Hz)
 *   - a third quiet rank 153.18 cents flat      -> ratio 0.9153, beating
 *     against the 8' at 11.1 Hz, which is heard as crispness
 *
 * Each rank's partial amplitudes were measured with short-window tracking (a
 * long-window fit badly underestimates high partials, because the instrument's
 * own pitch wobble destroys their phase coherence).  Notable in the data: the
 * 8' rank's odd partials run about 9 dB above its even ones, the signature of
 * a free reed beating against its frame.
 *
 * Ratios are relative to the 8' fundamental; amplitudes are normalised to a
 * peak of 1.  Partials more than 72 dB below the peak are omitted.
 *
 * These are the measured values.  Playback loudness is a separate concern --
 * see HARMONIUM_GAIN in synth.ts.
 *
 * Generated -- do not hand-edit.
 */

/** Partial frequencies as ratios of the fundamental. */
export const HARMONIUM_SPECTRUM = [
  0.915321, 1, 2, 2.002862, 2.745964, 3, 4, 4.005723, 5, 6, 6.008585, 7, 8, 8.011447, 9, 10,
  10.014308, 10.068534, 10.983856, 11, 12, 12.01717, 13, 14, 14.020032, 15, 16, 16.022893, 17, 18,
  18.025755, 19, 20, 20.028616, 21, 21.05239, 21.967712, 22, 22.031478, 23, 24, 24.03434, 25, 26,
  26.037201, 27, 28, 28.040063, 29, 30, 30.042925, 31, 32, 32.036246, 32.045786, 32.951567, 33, 34,
  34.048648, 35, 36, 36.05151, 37, 38, 38.054371, 39, 40, 40.057233, 41, 42, 42.060095, 42.10478,
  43, 43.020102, 43.935423, 44, 44.062956, 45, 46, 46.065818, 47, 48, 48.068679, 49, 50, 50.071541,
  51, 52, 52.074403, 53, 53.088636, 54, 54.077264, 55, 56, 56.080126, 58, 58.082988, 60, 60.085849,
  62, 62.088711, 64, 64.072492, 64.091573, 66, 66.094434, 68, 68.097296, 70, 70.100158, 72,
  72.103019, 74, 74.105881, 74.141026, 76, 76.108742, 78, 78.111604, 84, 84.120189, 86, 86.123051,
  88, 88.125912, 90, 90.128774, 92, 92.131636, 94, 94.134497, 96, 96.108738, 96.137359, 98,
  98.140221, 100, 100.143082
]

/** Partial amplitudes, peak-normalised. */
export const HARMONIUM_AMPLITUDES = [
  0.027921, 0.831189, 0.232926, 0.90439, 0.005411, 0.540705, 0.107003, 0.842621, 0.321839, 0.083609,
  1, 0.130177, 0.094138, 0.31472, 0.115079, 0.033725, 0.449959, 0.006353, 0.067141, 0.037944,
  0.020431, 0.296091, 0.053404, 0.014311, 0.188859, 0.039052, 0.016881, 0.270202, 0.026112,
  0.002362, 0.134217, 0.013048, 0.003269, 0.067185, 0.003055, 0.001309, 0.004498, 0.000279,
  0.012372, 0.010974, 0.007076, 0.118236, 0.006803, 0.003091, 0.036966, 0.0048, 0.004385, 0.090209,
  0.006325, 0.005644, 0.067981, 0.005574, 0.002411, 0.07967, 0.03062, 0.002852, 0.004233, 0.002226,
  0.045071, 0.00279, 0.006781, 0.074263, 0.001139, 0.002993, 0.048271, 0.001225, 0.001741, 0.055732,
  0.000839, 0.000683, 0.029249, 0.008798, 0.001312, 0.00114, 0.000338, 0.000272, 0.037948, 0.001248,
  0.01982, 0.022676, 0.001398, 0.021052, 0.024503, 0.001311, 0.010827, 0.013252, 0.00079, 0.008206,
  0.009987, 0.000677, 0.000713, 0.00809, 0.00996, 0.000323, 0.005193, 0.00659, 0.002099, 0.002692,
  0.001344, 0.00182, 0.00086, 0.000863, 0.000857, 0.00106, 0.000858, 0.000331, 0.000332, 0.000419,
  0.00042, 0.000617, 0.000618, 0.000628, 0.000629, 0.000746, 0.000747, 0.000848, 0.00042, 0.000421,
  0.000266, 0.000266, 0.000291, 0.000291, 0.00039, 0.000391, 0.000461, 0.000462, 0.000511, 0.000511,
  0.000405, 0.000405, 0.000447, 0.000447, 0.000366, 0.000408, 0.000366, 0.000392, 0.000392,
  0.000259, 0.000259
]

/**
 * Playback gain for the measured amplitudes above.
 *
 * Chosen by rendering the timbre against a plain semisine: at this value it
 * sits about 3.7 dB under semisine in RMS and stays below it in peak amplitude
 * across the range.  Slightly quieter is deliberate -- 139 partials spread over
 * three ranks read as louder than a single sine at equal RMS.
 */
export const HARMONIUM_GAIN = 0.22
