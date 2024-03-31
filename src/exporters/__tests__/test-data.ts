import { Interval, TimeMonzo, getSourceVisitor, parseAST, relative } from 'sonic-weave'
import type { ExporterParams } from '../base'
import { UNIX_NEWLINE, WINDOWS_NEWLINE } from '../../constants'
import { Scale } from '../../scale'
import { Fraction } from 'xen-dev-utils'

export function getTestData(appTitle: string) {
  const absoluteC5 = new Interval(TimeMonzo.fromFractionalFrequency(528, 3), 'logarithmic', {
    type: 'AbsoluteFJS',
    pitch: {
      type: 'AbsolutePitch',
      nominal: 'C',
      accidentals: [],
      octave: 5n
    },
    ups: 0,
    lifts: 0,
    superscripts: [],
    subscripts: [[5, '']]
  })
  const visitor = getSourceVisitor()
  visitor.visit(parseAST('A4 = 440 Hz').body[0])
  const ev = visitor.createExpressionVisitor()
  const relativeC5 = relative.bind(ev)(absoluteC5)

  const relativeIntervals = [
    new Interval(TimeMonzo.fromEqualTemperament('100/1200', 2, 3), 'logarithmic', {
      type: 'CentsLiteral',
      sign: '',
      whole: 100n,
      fractional: ''
    }),
    relativeC5,
    new Interval(
      TimeMonzo.fromEqualTemperament(new Fraction(4, 5), new Fraction(2), 3),
      'logarithmic',
      {
        type: 'NedjiLiteral',
        numerator: 4,
        denominator: 5,
        equaveNumerator: null,
        equaveDenominator: null
      }
    ),
    new Interval(TimeMonzo.fromFraction(new Fraction(5, 3), 3), 'linear', {
      type: 'FractionLiteral',
      numerator: 5n,
      denominator: 3n
    }),
    new Interval(TimeMonzo.fromValue(Math.E / 2, 3), 'linear', {
      type: 'DecimalLiteral',
      sign: '',
      whole: 1n,
      fractional: '3591409142295225',
      flavor: 'r',
      exponent: null
    }),
    new Interval(TimeMonzo.fromFraction(new Fraction(81, 80), 3).pow(5), 'linear', {
      type: 'FractionLiteral',
      numerator: 3486784401n,
      denominator: 3276800000n
    }),
    new Interval(TimeMonzo.fromFraction(2, 3), 'linear', {
      type: 'FractionLiteral',
      numerator: 2n,
      denominator: 1n
    })
  ]
  const ratios = relativeIntervals.map((i) => i.value.valueOf())
  const scale = new Scale(ratios, 440, 69)
  const params: ExporterParams = {
    filename: 'test',
    newline: process.platform === 'linux' ? UNIX_NEWLINE : WINDOWS_NEWLINE,
    scaleUrl: 'https://scaleworkshop.plainsound.org/',
    name: 'Test Scale',
    relativeIntervals,
    scale,
    appTitle,
    description: 'A scale for testing if the exporter works',
    baseMidiNote: 69,
    baseFrequency: 440,
    midiOctaveOffset: 0,
    sourceText: '100.\nC5_5\n4\\5\n5/3\n1,3591409142295225r\n3486784401/3276800000\n2/1',
    labels: ['100.', 'C5_5', '4\\5', '5/3', '1,3591409142295225r', '3486784401/3276800000', '2/1'],
    date: new Date('2022-02-22T20:22Z')
  }
  return params
}
