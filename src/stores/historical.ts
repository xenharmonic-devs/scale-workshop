import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { DEFAULT_NUMBER_OF_COMPONENTS, FIFTH, OCTAVE } from '@/constants'
import { Fraction, centsToValue, circleDifference, lcm } from 'xen-dev-utils'
import { Interval, TimeMonzo } from 'sonic-weave'
import { parseInterval } from '@/utils'

export const useHistoricalStore = defineStore('historical', () => {
  const method = ref<'simple' | 'target' | 'well temperament'>('simple')

  const generator = ref(FIFTH)
  const generatorString = ref('3/2')

  const size = ref(12)
  const down = ref(3)
  const format = ref<'cents' | 'default'>('cents')

  const selectedPreset = ref('pythagorean')

  const pureGenerator = ref(FIFTH)
  const pureGeneratorString = ref('3/2')
  const target = ref(
    new Interval(TimeMonzo.fromFraction('7/4', DEFAULT_NUMBER_OF_COMPONENTS), 'linear')
  )
  const targetString = ref('7/4')
  const searchRange = ref(11)
  const period = ref(OCTAVE)
  const periodString = ref('2/1')
  const pureExponent = ref(10)
  const temperingStrength = ref(1)

  const wellComma = ref(
    new Interval(TimeMonzo.fromFraction('531441/524288', DEFAULT_NUMBER_OF_COMPONENTS), 'linear')
  )
  const wellCommaString = ref('531441/524288')
  const wellCommaFractionStrings = reactive<Map<number, string>>(
    new Map([
      [-6, '0'],
      [-5, '0'],
      [-4, '0'],
      [-3, '0'],
      [-2, '0'],
      [-1, '-1/6'],
      [0, '-1/6'],
      [1, '-1/6'],
      [2, '-1/6'],
      [3, '-1/6'],
      [4, '-1/6']
    ])
  )

  const selectedWellPreset = ref('vallotti')

  const up = computed(() => size.value - 1 - down.value)

  type Candidate = {
    exponent: number
    tempering: number
  }

  const candidates = computed(() => {
    const pureCents = pureGenerator.value.totalCents()
    const targetCents = target.value.totalCents()
    const periodCents = period.value.totalCents()
    const result: Candidate[] = []
    for (let i = -searchRange.value; i <= searchRange.value; ++i) {
      if (i === 0 || i === 1 || i === -1) {
        continue
      }
      const offset = circleDifference(targetCents, pureCents * i, periodCents)
      result.push({
        exponent: i,
        tempering: offset / i
      })
    }
    result.sort((a, b) => Math.abs(a.tempering) - Math.abs(b.tempering))
    return result
  })

  // This way makes the selection behave slightly nicer when other values change
  const tempering = computed(() => {
    for (const candidate of candidates.value) {
      if (candidate.exponent === pureExponent.value) {
        return candidate.tempering
      }
    }
    return 0
  })

  const wellIntervals = computed(() => {
    const comma = wellComma.value.value
    // Not a generator in the strictest sense. It accumulates offsets along the way.
    let generator = FIFTH.value.pow(0)

    // Unison
    const result = [generator]

    // Against the spiral of fifths
    for (let i = 0; i < down.value; ++i) {
      let frac = new Fraction(0)
      try {
        frac = new Fraction(wellCommaFractionStrings.get(-i - 1) ?? '0')
      } catch {
        // empty
      }
      generator = generator.div(FIFTH.value).div(comma.pow(frac)).reduce(OCTAVE.value)
      result.unshift(generator)
    }

    // Along the spiral of fifths
    generator = FIFTH.value.pow(0)
    // Note that this intentionally overshoots by one to reach the enharmonic
    for (let i = 0; i < size.value - down.value; ++i) {
      let frac = new Fraction(0)
      try {
        frac = new Fraction(wellCommaFractionStrings.get(i) ?? '0')
      } catch {
        // empty
      }
      generator = generator.mul(FIFTH.value).mul(comma.pow(frac)).reduce(OCTAVE.value)
      result.push(generator)
    }

    return result
  })

  const ZERO = new Fraction(0)

  const wellCommaFractions = computed(() => {
    const result: Fraction[] = []
    for (let i = 0; i < size.value; ++i) {
      let frac = ZERO
      try {
        frac = new Fraction(wellCommaFractionStrings.get(i - down.value) ?? '0')
      } catch {
        // Empty
      }
      result.push(frac)
    }
    return result
  })

  const allWellCommasAreZero = computed(() => {
    return wellCommaFractions.value.every((f) => f.n === 0)
  })

  // This is a simplified and linearized model of beating
  function equalizeBeating() {
    const monzo = generator.value.value
    const g = monzo.valueOf()
    let multiGenExponent = 1
    if (monzo instanceof TimeMonzo) {
      multiGenExponent = monzo.primeExponents.reduce(
        (denom, component) => lcm(component.d, denom),
        1
      )
    }
    const t = target.value.valueOf()

    const generatorMaxBeats = Math.abs(g * (1 - centsToValue(tempering.value * multiGenExponent)))
    const targetMaxBeats = Math.abs(t * (1 - centsToValue(tempering.value * pureExponent.value)))

    // Solve the linearized model:
    // generatorBeats = generatorMaxBeats * strength = targetMaxBeats * (1 - strength) = targetBeats
    temperingStrength.value = targetMaxBeats / (generatorMaxBeats + targetMaxBeats)

    // Do one more iteration of linearization:
    const generatorMidBeats = Math.abs(
      g * (1 - centsToValue(tempering.value * multiGenExponent * temperingStrength.value))
    )
    const targetMidBeats = Math.abs(
      g * (1 - centsToValue(tempering.value * pureExponent.value * (1 - temperingStrength.value)))
    )

    // generatorBeats = generatorMidBeats + mu * (generatorMaxBeats - generatorMidBeats) = targetMidBeats - mu * targetMidBeats = targetBeats
    const mu =
      (targetMidBeats - generatorMidBeats) /
      (generatorMaxBeats + targetMidBeats - generatorMidBeats)

    temperingStrength.value += mu * (1 - temperingStrength.value)
  }

  type Preset = {
    name: string
    generator: string
    down: number
    size?: number
  }

  const presets: Record<string, Preset> = {
    pythagorean: {
      name: 'Pythagorean tuning',
      generator: '3/2',
      down: 5
    },
    helmholtz: {
      name: 'Helmholtz aka Schismatic',
      down: 11,
      size: 24,
      generator: '3/2 % 32805/32768/^8'
    },
    twelve: {
      name: '12-tone equal temperament',
      generator: '7\\12',
      down: 3
    },
    eight: {
      name: '1/8-comma Meantone',
      generator: '3/2 % 531441/524288/^8',
      down: 5
    },
    sixth: {
      name: '1/6-comma Meantone',
      down: 5,
      generator: '3/2 % 531441/524288/^6'
    },
    fifth: {
      name: '1/5-comma Meantone',
      down: 3,
      generator: '3/2 % 81/80/^5'
    },
    quarter: {
      name: '1/4-comma Meantone',
      down: 3,
      generator: '3/2 % 81/80/^4'
    },
    twosevenths: {
      name: '2/7-comma Meantone',
      down: 3,
      generator: '3/2 % 81/80^2/7'
    },
    third: {
      name: '1/3-comma Meantone',
      down: 3,
      generator: '3/2 % 81/80/^3'
    }
  }

  type WellPreset = {
    name: string
    down: number
    comma: string
    commaFractions: string
  }

  const wellPresets: Record<string, WellPreset> = {
    grammateus: {
      name: 'Grammateus 1518',
      down: 1,
      comma: '531441/524288',
      commaFractions: '0,0,0,0,0,0,-1/2,0,0,0,0'
    },
    neidhardtgrosse: {
      name: 'Neidhardt Große Stadt 1724',
      down: 5,
      comma: '531441/524288',
      commaFractions: '-1/12,0,-1/12,-1/12,0,-1/6,-1/6,-1/6,-1/12,0,-1/12'
    },
    neidhardtkleine: {
      name: 'Neidhardt Kleine Stadt 1732',
      down: 4,
      comma: '531441/524288',
      commaFractions: '-1/12,-1/12,0,0,-1/6,-1/6,-1/6,-1/6,-1/12,-1/12,0'
    },
    vallotti: {
      name: 'Vallotti 1754',
      down: 6,
      comma: '531441/524288',
      commaFractions: '0,0,0,0,0,-1/6,-1/6,-1/6,-1/6,-1/6,-1/6'
    },
    lambert: {
      name: 'Lambert 1774',
      down: 6,
      comma: '531441/524288',
      commaFractions: '0,0,0,0,0,-1/7,-1/7,-1/7,-1/7,-1/7,-1/7,-1/7'
    },
    barnes: {
      name: 'Bach/Barnes 1979',
      down: 3,
      comma: '531441/524288',
      commaFractions: '0,0,-1/6,-1/6,-1/6,-1/6,-1/6,0,-1/6,0,0'
    },
    lehman: {
      name: 'Bach/Lehman 2005',
      down: 1,
      comma: '531441/524288',
      commaFractions: '-1/6,-1/6,-1/6,-1/6,-1/6,0,0,0,-1/12,-1/12,-1/12'
    },
    odonnell: {
      name: "Bach/O'Donnell 2006",
      down: 3,
      comma: '531441/524288',
      commaFractions: '-1/12,0,0,-1/6,-1/6,-1/6,0,-1/6,0,-1/12,-1/12,-1/12'
    },
    hill: {
      name: 'Bach/Hill 2008',
      down: 4,
      comma: '531441/524288',
      commaFractions: '0,0,0,-2/13,-2/13,-2/13,-2/13,-2/13,0,-1/13,-1/13,-1/13'
    },
    swich: {
      name: 'Bach/Swich 2011',
      down: 3,
      comma: '531441/524288',
      commaFractions: '1/36,0,-1/5,-1/5,-1/5,-1/5,-1/5,0,-1/12,0,1/36'
    },
    louie: {
      name: 'Bach/Louie 2018',
      down: 4,
      comma: '531441/524288',
      commaFractions: '0,0,0,0,-1/6,-1/6,-1/6,-1/6,-1/6,-1/18,-1/18'
    },
    werckmeister3: {
      name: 'Werckmeister III 1691',
      down: 3,
      comma: '81/80',
      commaFractions: '0,0,0,-1/4,-1/4,-1/4,0,0,-1/4,0,0'
    },
    rameau: {
      name: 'Rameau 1726',
      down: 3,
      comma: '81/80',
      commaFractions: '11/24,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,0,0,-1/6'
    },
    rousseau: {
      name: "d'Alembert/Rousseau 1752",
      down: 3,
      comma: '81/80',
      commaFractions: '1/12,1/12,1/12,-1/4,-1/4,-1/4,-1/4,-1/12,-1/12,-1/12,-1/12'
    },
    corrette: {
      name: "Corrette's Wolf 1753",
      down: 3,
      comma: '81/80',
      commaFractions: '1/12,1/12,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/12'
    },
    marpourg: {
      name: 'Marpourg 1756',
      down: 3,
      comma: '81/80',
      commaFractions: '3/20,3/20,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,3/20,3/20,3/20'
    },
    kirnberger3: {
      name: 'Kirnberger III 1779',
      down: 5,
      comma: '81/80',
      commaFractions: '0,0,0,0,0,-1/4,-1/4,-1/4,-1/4,0,0'
    },
    kellner: {
      name: 'Kellner 1975',
      down: 4,
      comma: '81/80',
      commaFractions: '0,0,0,0,-1/5,-1/5,-1/5,-1/5,0,-1/5,0'
    },
    egarr: {
      name: "Egarr's English Ord 2007",
      down: 3,
      comma: '81/80',
      commaFractions: '1/4,1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/4,-1/8,-1/8,-1/8,0'
    }
  }

  // Record order is supposed to be guaranteed since ES2015, but that doesn't seem to be the case...
  const presetKeys: string[] = [...Object.keys(presets)]

  // Sort by wideness of the generator
  presetKeys.sort(
    (a, b) =>
      parseInterval(presets[b].generator).totalCents() -
      parseInterval(presets[a].generator).totalCents()
  )

  const wellPresetKeys: string[] = [...Object.keys(wellPresets)]

  function extractYear(name: string) {
    for (const word of name.split(' ')) {
      const year = parseInt(word, 10)
      if (isNaN(year)) {
        continue
      }
      return year
    }
    return Infinity
  }

  // Sort by comma and then by date
  wellPresetKeys.sort((a, b) => {
    // XXX: String length used as a complexity proxy.
    const c = wellPresets[b].comma.length - wellPresets[a].comma.length
    if (c) {
      return c
    }
    return extractYear(wellPresets[a].name) - extractYear(wellPresets[b].name)
  })

  watch(size, (newValue) => {
    if (down.value >= newValue) {
      down.value = newValue - 1
    }
  })

  function selectPreset(value: string) {
    if (value === 'none') {
      return
    }
    const preset = presets[value]
    size.value = preset.size ?? 12
    down.value = preset.down
    generator.value = parseInterval(preset.generator)
    generatorString.value = preset.generator
  }

  watch(selectedPreset, selectPreset, { immediate: true })

  function selectWellPreset(value: string) {
    if (value === 'none') {
      return
    }
    const preset = wellPresets[value]
    size.value = 12
    down.value = preset.down
    wellCommaString.value = preset.comma
    wellComma.value = parseInterval(preset.comma)
    const fractions = preset.commaFractions.split(',')
    wellCommaFractionStrings.clear()
    for (let i = 0; i < fractions.length; ++i) {
      wellCommaFractionStrings.set(i - preset.down, fractions[i])
    }
  }

  watch(selectedWellPreset, selectWellPreset, { immediate: true })

  function resetWellCommas() {
    wellCommaFractionStrings.clear()
    selectedWellPreset.value = 'none'
  }

  return {
    method,
    generator,
    generatorString,
    size,
    down,
    up,
    format,
    selectedPreset,
    pureGenerator,
    pureGeneratorString,
    target,
    targetString,
    searchRange,
    period,
    periodString,
    pureExponent,
    temperingStrength,
    wellComma,
    wellCommaString,
    wellCommaFractionStrings,
    wellCommaFractions,
    selectedWellPreset,
    candidates,
    tempering,
    wellIntervals,
    allWellCommasAreZero,
    equalizeBeating,
    presets,
    wellPresets,
    presetKeys,
    wellPresetKeys,
    selectPreset,
    selectWellPreset,
    resetWellCommas
  }
})
