import { describe, beforeEach, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScaleStore } from '../scale'
import { Scale } from '../../scale'
import { Interval } from 'sonic-weave'

const SERIALIZED = String.raw`{"scale":{"type":"ScaleWorkshopScale","intervalRatios":[1.148698354997035,1.3195079107728942,1.515716566510398,1.7411011265922482,2],"baseFrequency":261.6255653005987,"baseMidiNote":60,"title":""},"relativeIntervals":[{"type":"Interval","v":{"type":"TimeMonzo","t":{"n":0,"d":1},"p":[1,5],"r":{"n":1,"d":1}},"d":1,"s":0,"l":"","n":{"type":"n","n":1,"d":5,"p":null,"q":null},"t":[]},{"type":"Interval","v":{"type":"TimeMonzo","t":{"n":0,"d":1},"p":[2,5],"r":{"n":1,"d":1}},"d":1,"s":0,"l":"","n":{"type":"n","n":2,"d":5,"p":null,"q":null},"t":[]},{"type":"Interval","v":{"type":"TimeMonzo","t":{"n":0,"d":1},"p":[3,5],"r":{"n":1,"d":1}},"d":1,"s":0,"l":"","n":{"type":"n","n":3,"d":5,"p":null,"q":null},"t":[]},{"type":"Interval","v":{"type":"TimeMonzo","t":{"n":0,"d":1},"p":[4,5],"r":{"n":1,"d":1}},"d":1,"s":0,"l":"","n":{"type":"n","n":4,"d":5,"p":null,"q":null},"t":[]},{"type":"Interval","v":{"type":"TimeMonzo","t":{"n":0,"d":1},"p":[1,1],"r":{"n":1,"d":1}},"d":1,"s":0,"l":"","n":{"type":"n","n":5,"d":5,"p":null,"q":null},"t":[]}],"colors":["silver","silver","silver","silver","gray"],"labels":["1\\5","2\\5","3\\5","4\\5","5\\5"],"latticeIntervals":null,"name":"","baseMidiNote":60,"userBaseFrequency":261.63,"autoFrequency":true,"autoColors":"silver","sourceText":"tet(5)","userNotation":"C\nC#\nD\nD#\nE\nF\nF#\nG\nG#\nA\nA#\nB","noteNames":["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],"symbols":["C-1","C#-1","D-1","D#-1","E-1","F-1","F#-1","G-1","G#-1","A-1","A#-1","B-1","C0","C#0","D0","D#0","E0","F0","F#0","G0","G#0","A0","A#0","B0","C1","C#1","D1","D#1","E1","F1","F#1","G1","G#1","A1","A#1","B1","C2","C#2","D2","D#2","E2","F2","F#2","G2","G#2","A2","A#2","B2","C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3","C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4","C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5","C6","C#6","D6","D#6","E6","F6","F#6","G6","G#6","A6","A#6","B6","C7","C#7","D7","D#7","E7","F7","F#7","G7","G#7","A7","A#7","B7","C8","C#8","D8","D#8","E8","F8","F#8","G8","G#8","A8","A#8","B8","C9","C#9","D9","D#9","E9","F9","F#9","G9"],"ottava":0,"error":"","warning":"","isomorphicVertical":5,"isomorphicHorizontal":1,"keyboardMode":"isomorphic","equaveShift":0,"degreeShift":0,"pianoMode":"Asdf","accidentalColor":"black","lowAccidentalColor":"maroon","middleAccidentalColor":"navy","highAccidentalColor":"indigo"}`

describe('Scale store', () => {
  beforeEach(() => {
    // creates a fresh pinia and makes it active
    // so it's automatically picked up by any useStore() call
    // without having to pass it to it: `useStore(pinia)`
    setActivePinia(createPinia())
  })

  it('serializes 5edo', () => {
    const scale = useScaleStore()
    scale.sourceText = 'tet(5)'
    scale.computeScale()
    const serialized = JSON.stringify(scale)
    expect(serialized).toBe(SERIALIZED)
  })

  it('deserializes 5edo', () => {
    const data = JSON.parse(SERIALIZED, (key: string, value: any) =>
      Scale.reviver(key, Interval.reviver(key, value))
    )
    data.id = '123abcABC'
    const scale = useScaleStore()
    scale.fromJSON(data)
    expect(scale.id).toBe('123abcABC')
    expect(scale.uploadedId).toBe('123abcABC')
    const centss = scale.scale.getCentsRange(60, 66)
    expect(centss[0]).toBeCloseTo(0)
    expect(centss[1]).toBeCloseTo(240)
    expect(centss[2]).toBeCloseTo(480)
    expect(centss[3]).toBeCloseTo(720)
    expect(centss[4]).toBeCloseTo(960)
    expect(centss[5]).toBeCloseTo(1200)
    expect(scale.latticeIntervals).toHaveLength(5)
  })

  it('has a cap on the number of shareable intervals', () => {
    const scale = useScaleStore()
    scale.sourceText = '500::1000'
    scale.computeScale()
    const serialized = JSON.stringify(scale)
    expect(serialized.length).toBeLessThan(80000)

    const data = JSON.parse(serialized, (key: string, value: any) =>
      Scale.reviver(key, Interval.reviver(key, value))
    )
    data.id = 'ABCabc123'
    expect(data.latticeIntervals).toBeNull()
    scale.fromJSON(data)
    expect(scale.scale.size).toBe(255)
    expect(scale.scale.equaveRatio).toBeCloseTo(2)
    expect(scale.colorForIndex(scale.baseMidiNote)).toBe('gray')
    expect(scale.colorForIndex(scale.baseMidiNote + 1)).toBe('silver')
  })
})
