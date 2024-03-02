import PRESETS from '@/presets.json'

type PresetFragment = {
  name: string
  source: string
  categories: string[]
  title?: string
  baseFrequency?: number
  baseMidiNote?: number
}

export type Preset = {
  name: string
  title: string
  id: string
  source: string
  categories: string[]
  baseFrequency: number
  baseMidiNote: number
}

export type PresetGroup = {
  name: string
  members: Preset[]
}

function normalized(id: string): Preset {
  const result: any = Object.assign({}, (PRESETS as unknown as { [key: string]: PresetFragment })[id])
  result.id = id
  result.title = result.title || result.name
  result.baseFrequency = result.baseFrequency || 440
  result.baseMidiNote = result.baseMidiNote === undefined ? 69 : result.baseMidiNote
  return result
}

export const presets: { [key: string]: Preset } = {}

Object.keys(PRESETS).forEach((id) => {
  presets[id] = normalized(id)
})

export function presetsByGroup(): PresetGroup[] {
  const traditional: PresetGroup = {
    name: 'Traditional scales',
    members: []
  }
  const justIntonation: PresetGroup = {
    name: 'Just intonation scales',
    members: []
  }
  const equalTemperament: PresetGroup = {
    name: 'Equal temperament subsets',
    members: []
  }
  const nonOctave: PresetGroup = {
    name: 'Non-octave scales',
    members: []
  }
  const generatorOffset: PresetGroup = {
    name: 'Generator offset scales',
    members: []
  }
  const higherRank: PresetGroup = {
    name: 'Higher rank scales',
    members: []
  }
  const misc: PresetGroup = {
    name: 'Miscellaneous scales',
    members: []
  }

  Object.keys(presets).forEach((id) => {
    const preset = presets[id]
    if (preset.categories.includes('traditional')) {
      traditional.members.push(preset)
    } else if (preset.categories.includes('non-octave')) {
      nonOctave.members.push(preset)
    } else if (preset.categories.includes('GO')) {
      generatorOffset.members.push(preset)
    } else if (preset.categories.includes('rank 2') || preset.categories.includes('rank 3')) {
      higherRank.members.push(preset)
    } else if (preset.categories.includes('just intonation')) {
      justIntonation.members.push(preset)
    } else if (preset.categories.includes('equal temperament')) {
      equalTemperament.members.push(preset)
    } else {
      misc.members.push(preset)
    }
  })
  const result = [
    traditional,
    justIntonation,
    equalTemperament,
    nonOctave,
    generatorOffset,
    higherRank
  ]
  if (misc.members.length) {
    result.push(misc)
  }
  return result
}
