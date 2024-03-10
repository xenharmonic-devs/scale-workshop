import { describe, it, expect } from 'vitest'
import { Fraction } from 'xen-dev-utils'

import { ScaleWorkshopOneData } from '../scale-workshop-one'

describe('Scale Workshop 1 compatibility layer', () => {
  it('can parse old query strings', () => {
    const url = new URL(
      'https://sevish.com/scaleworkshop/?name=16%20equal%20divisions%20of%202%2F1&data=75.%0A150.%0A225.%0A300.%0A375.%0A450.%0A525.%0A600.%0A675.%0A750.%0A825.%0A900.%0A975.%0A1050.%0A1125.%0A1200.&freq=440&midi=69&vert=5&horiz=1&colors=white%20black%20white%20black%20white%20black%20white%20white%20black%20white%20black%20white%20black%20white%20black%20white&waveform=sine&ampenv=pad'
    )
    const data = new ScaleWorkshopOneData(url)

    expect(data.name).toBe('16 equal divisions of 2/1')
    expect(data.midi).toBe(69)
    expect(data.source).toBe('')
    expect(data.vertical).toBe(5)
    expect(data.horizontal).toBe(1)
    expect(data.colors).toBe(
      'white black white black white black white white black white black white black white black white'
    )
    expect(data.waveform).toBe('sine')
    expect(data.ampenv).toBe('pad')

    const intervals = data.parseTuningData()

    expect(intervals[0].totalCents()).toBeCloseTo(75)
    expect(intervals[1].totalCents()).toBeCloseTo(150)
    expect(intervals[2].totalCents()).toBeCloseTo(225)
    expect(intervals[3].totalCents()).toBeCloseTo(300)
    expect(intervals[4].totalCents()).toBeCloseTo(375)
    expect(intervals[5].totalCents()).toBeCloseTo(450)
    expect(intervals[6].totalCents()).toBeCloseTo(525)
    expect(intervals[7].totalCents()).toBeCloseTo(600)
    expect(intervals[8].totalCents()).toBeCloseTo(675)
    expect(intervals[9].totalCents()).toBeCloseTo(750)
    expect(intervals[10].totalCents()).toBeCloseTo(825)
    expect(intervals[11].totalCents()).toBeCloseTo(900)
    expect(intervals[12].totalCents()).toBeCloseTo(975)
    expect(intervals[13].totalCents()).toBeCloseTo(1050)
    expect(intervals[14].totalCents()).toBeCloseTo(1125)
    expect(intervals[15].totalCents()).toBeCloseTo(1200)
  })

  it('can parse all line types', () => {
    const url = new URL(
      'https://sevish.com/scaleworkshop/?data=100.0%0A1%2C2%0A3%2F2%0A4%5C5%0A2%2F1'
    )
    const data = new ScaleWorkshopOneData(url)

    const intervals = data.parseTuningData()

    expect(data.freq).toBeCloseTo(440)

    expect(intervals[0].totalCents()).toBeCloseTo(100)

    expect(intervals[1].valueOf()).toBeCloseTo(1.2)

    expect(intervals[2].value.toFraction().equals(new Fraction(3, 2))).toBeTruthy()

    const {fractionOfEquave, equave} = intervals[3].value.toEqualTemperament()
    expect(fractionOfEquave.equals(new Fraction(4, 5))).toBeTruthy()
    expect(equave.equals(new Fraction(2, 1))).toBeTruthy()

    expect(intervals[4].value.toFraction().equals(new Fraction(2, 1))).toBeTruthy()
  })
})
