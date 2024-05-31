import { EntropyCalculator, type HarmonicEntropyOptions } from 'harmonic-entropy'

let entropy: EntropyCalculator | undefined

onmessage = (e) => {
  const options: HarmonicEntropyOptions = e.data.options
  if (!entropy) {
    entropy = new EntropyCalculator(options)
  } else {
    entropy.options = options
  }
  postMessage({ json: entropy.toJSON(), jobId: e.data.jobId })
}
