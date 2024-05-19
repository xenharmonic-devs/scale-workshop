import { describe, beforeEach, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScaleStore } from '../scale'
import { Scale } from '../../scale'
import { Interval } from 'sonic-weave'

const SERIALIZED = String.raw`{"scale":{"type":"ScaleWorkshopScale","intervalRatios":[1.148698354997035,1.3195079107728942,1.515716566510398,1.7411011265922482,2],"baseFrequency":261.6255653005987,"baseMidiNote":60,"title":""},"relativeIntervals":[{"type":"Interval","v":{"type":"TimeMonzo","t":{"n":0,"d":1},"p":[1,5],"r":{"n":1,"d":1}},"d":1,"s":0,"l":"","n":{"type":"n","n":1,"d":5,"p":null,"q":null},"t":[]},{"type":"Interval","v":{"type":"TimeMonzo","t":{"n":0,"d":1},"p":[2,5],"r":{"n":1,"d":1}},"d":1,"s":0,"l":"","n":{"type":"n","n":2,"d":5,"p":null,"q":null},"t":[]},{"type":"Interval","v":{"type":"TimeMonzo","t":{"n":0,"d":1},"p":[3,5],"r":{"n":1,"d":1}},"d":1,"s":0,"l":"","n":{"type":"n","n":3,"d":5,"p":null,"q":null},"t":[]},{"type":"Interval","v":{"type":"TimeMonzo","t":{"n":0,"d":1},"p":[4,5],"r":{"n":1,"d":1}},"d":1,"s":0,"l":"","n":{"type":"n","n":4,"d":5,"p":null,"q":null},"t":[]},{"type":"Interval","v":{"type":"TimeMonzo","t":{"n":0,"d":1},"p":[1,1],"r":{"n":1,"d":1}},"d":1,"s":0,"l":"","n":{"type":"n","n":5,"d":5,"p":null,"q":null},"t":[]}],"latticeIntervals":null,"name":"","baseMidiNote":60,"userBaseFrequency":261.63,"autoFrequency":true,"autoColors":"silver","sourceText":"tet(5)","colors":["silver","silver","silver","silver","gray"],"labels":["1\\5","2\\5","3\\5","4\\5","5\\5"],"error":"","warning":"","isomorphicVertical":5,"isomorphicHorizontal":1,"keyboardMode":"isomorphic","equaveShift":0,"degreeShift":0,"pianoMode":"Asdf","accidentalColor":"black","lowAccidentalColor":"maroon","middleAccidentalColor":"navy","highAccidentalColor":"indigo"}`

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
})
