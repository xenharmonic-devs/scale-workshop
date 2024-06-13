import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import {
  kraigGrady9,
  type LatticeOptions,
  scottDakota24,
  primeRing72,
  align,
  type LatticeOptions3D,
  WGP9,
  primeSphere
} from 'ji-lattice'
import { LOG_PRIMES, dot, mmod } from 'xen-dev-utils'
import { computedAndError } from '@/utils'
import { TimeMonzo, parseChord } from 'sonic-weave'

export const useJiLatticeStore = defineStore('ji-lattice', () => {
  // Kraig Grady's coordinates only go up to 23-limit, but it was the default in Scale Workshop 2.
  const opts = kraigGrady9()
  const horizontalCoordinates = reactive(opts.horizontalCoordinates)
  const verticalCoordinates = reactive(opts.verticalCoordinates)
  const maxDistance = ref(1)
  const edgesString = ref('')
  const size = ref(2)
  const labelOffset = ref(2)
  const showLabels = ref(true)
  const rotation = ref(0)
  const drawArrows = ref(false)
  const grayExtras = ref(false)

  const [edges, edgesError] = computedAndError(() => {
    return parseChord(edgesString.value)
  }, [])

  // XXX: Janky
  const horizontals = computed({
    get() {
      return horizontalCoordinates.join(' ')
    },
    set(value: string) {
      horizontalCoordinates.length = 0
      horizontalCoordinates.push(
        ...value.split(' ').map((v) => {
          const i = parseInt(v)
          return isNaN(i) ? 0 : i
        })
      )
    }
  })
  const verticals = computed({
    get() {
      return verticalCoordinates.join(' ')
    },
    set(value: string) {
      verticalCoordinates.length = 0
      verticalCoordinates.push(
        ...value.split(' ').map((v) => {
          const i = parseInt(v)
          return isNaN(i) ? 0 : i
        })
      )
    }
  })
  const xs = computed({
    get() {
      return xCoords.map((x) => x.toFixed(2)).join(' ')
    },
    set(value: string) {
      xCoords.length = 0
      xCoords.push(
        ...value.split(' ').map((v) => {
          const c = parseFloat(v)
          return isNaN(c) ? 0 : c
        })
      )
    }
  })
  const ys = computed({
    get() {
      return yCoords.map((y) => y.toFixed(2)).join(' ')
    },
    set(value: string) {
      yCoords.length = 0
      yCoords.push(
        ...value.split(' ').map((v) => {
          const c = parseFloat(v)
          return isNaN(c) ? 0 : c
        })
      )
    }
  })
  const zs = computed({
    get() {
      return zCoords.map((z) => z.toFixed(2)).join(' ')
    },
    set(value: string) {
      zCoords.length = 0
      zCoords.push(
        ...value.split(' ').map((v) => {
          const c = parseFloat(v)
          return isNaN(c) ? 0 : c
        })
      )
    }
  })

  const edgeMonzos = computed(() => {
    const numComponents = horizontalCoordinates.length
    const result: number[][] = []
    for (const interval of edges.value) {
      const value = interval.value.clone()
      if (value instanceof TimeMonzo) {
        value.numberOfComponents = numComponents
        const monzo = value.primeExponents.map((pe) => pe.valueOf())
        result.push(monzo)
      } else {
        result.push(Array(numComponents).fill(0))
      }
    }
    return result
  })

  const latticeOptions = computed<LatticeOptions>(() => {
    return {
      horizontalCoordinates,
      verticalCoordinates,
      maxDistance: maxDistance.value,
      edgeMonzos: edgeMonzos.value,
      mergeEdges: true
    }
  })

  const opts3D = WGP9(0)
  const xCoords = reactive(opts3D.horizontalCoordinates)
  const yCoords = reactive(opts3D.verticalCoordinates)
  const zCoords = reactive(opts3D.depthwiseCoordinates)
  const depth = ref(100)

  const latticeOptions3D = computed<LatticeOptions3D>(() => {
    return {
      horizontalCoordinates: xCoords,
      verticalCoordinates: yCoords,
      depthwiseCoordinates: zCoords,
      maxDistance: maxDistance.value,
      edgeMonzos: edgeMonzos.value,
      mergeEdges: false
    }
  })

  watch(rotation, (newValue) => {
    if (newValue < 0 || newValue >= 360) {
      rotation.value = mmod(newValue, 360)
    }
  })

  // 2D presets

  function kraigGrady(equaveIndex = 0) {
    size.value = 2
    const kg = kraigGrady9(equaveIndex)
    horizontalCoordinates.length = 0
    horizontalCoordinates.push(...kg.horizontalCoordinates)
    verticalCoordinates.length = 0
    verticalCoordinates.push(...kg.verticalCoordinates)
    edgesString.value = ''
  }

  function scott24(equaveIndex = 0) {
    size.value = 2
    const sd = scottDakota24(equaveIndex)
    horizontalCoordinates.length = 0
    horizontalCoordinates.push(...sd.horizontalCoordinates)
    verticalCoordinates.length = 0
    verticalCoordinates.push(...sd.verticalCoordinates)
    if (equaveIndex === 0) {
      edgesString.value = '6/5'
    } else {
      edgesString.value = ''
    }
  }

  function pr72(equaveIndex = 0) {
    size.value = 4
    const pr = primeRing72(equaveIndex)
    horizontalCoordinates.length = 0
    horizontalCoordinates.push(...pr.horizontalCoordinates)
    verticalCoordinates.length = 0
    verticalCoordinates.push(...pr.verticalCoordinates)
    if (equaveIndex === 0) {
      edgesString.value = '6/5'
    } else {
      edgesString.value = ''
    }
  }

  function pe72(equaveIndex = 0) {
    size.value = 4
    const pr = primeRing72(equaveIndex, undefined, false)
    align(pr, equaveIndex + 1, equaveIndex + 2)
    horizontalCoordinates.length = 0
    horizontalCoordinates.push(...pr.horizontalCoordinates.map(Math.round))
    verticalCoordinates.length = 0
    verticalCoordinates.push(...pr.verticalCoordinates.map(Math.round))
    if (equaveIndex === 0) {
      edgesString.value = '6/5'
    } else {
      edgesString.value = ''
    }
  }

  // 3D presets

  function autoDepth(monzos: number[][]) {
    if (!xCoords.length || !yCoords.length || !zCoords.length) {
      return
    }
    const x = monzos.map((m) => dot(m, xCoords))
    const y = monzos.map((m) => dot(m, yCoords))
    const z = monzos.map((m) => dot(m, zCoords))
    const objectSize = Math.max(
      Math.max(...x) - Math.min(...x),
      Math.max(...y) - Math.min(...y),
      Math.max(...z) - Math.min(...z)
    )
    depth.value = Math.ceil(2 * objectSize)
  }

  function WGP(equaveIndex = 0) {
    size.value = 2
    depth.value = 100
    const w = WGP9(equaveIndex)
    xCoords.length = 0
    xCoords.push(...w.horizontalCoordinates)
    yCoords.length = 0
    yCoords.push(...w.verticalCoordinates)
    zCoords.length = 0
    zCoords.push(...w.depthwiseCoordinates)
    edgesString.value = ''
  }

  function sphere(equaveIndex = 0, numberOfComponents = 24) {
    size.value = 2
    depth.value = 300
    const ps = primeSphere(equaveIndex, LOG_PRIMES.slice(0, numberOfComponents))
    const scale = 3000
    xCoords.length = 0
    xCoords.push(...ps.horizontalCoordinates.map((x) => Math.round(x * scale) / 100))
    yCoords.length = 0
    yCoords.push(...ps.verticalCoordinates.map((y) => Math.round(y * scale) / 100))
    zCoords.length = 0
    zCoords.push(...ps.depthwiseCoordinates.map((z) => Math.round(z * scale) / 100))
    if (equaveIndex === 0) {
      edgesString.value = '6/5'
    } else {
      edgesString.value = ''
    }
  }

  function pitch(degrees: number) {
    const theta = (degrees / 180) * Math.PI
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    for (let i = 0; i < Math.max(yCoords.length, zCoords.length); ++i) {
      const y = yCoords[i] ?? 0
      const z = zCoords[i] ?? 0
      yCoords[i] = c * y + s * z
      zCoords[i] = c * z - s * y
    }
  }

  function yaw(degrees: number) {
    const theta = (degrees / 180) * Math.PI
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    for (let i = 0; i < Math.max(xCoords.length, zCoords.length); ++i) {
      const x = xCoords[i] ?? 0
      const z = zCoords[i] ?? 0
      xCoords[i] = c * x + s * z
      zCoords[i] = c * z - s * x
    }
  }

  function roll(degrees: number) {
    const theta = (degrees / 180) * Math.PI
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    for (let i = 0; i < Math.max(xCoords.length, yCoords.length); ++i) {
      const x = xCoords[i] ?? 0
      const y = yCoords[i] ?? 0
      xCoords[i] = c * x + s * y
      yCoords[i] = c * y - s * x
    }
  }

  /** Non-reactive live state */
  const LIVE_STATE = {
    maxDistance,
    size,
    labelOffset,
    edgesString,
    showLabels,
    rotation,
    drawArrows,
    grayExtras,
    depth
  }

  /**
   * Convert live state to a format suitable for storing on the server.
   */
  function toJSON() {
    const result: any = {
      horizontalCoordinates,
      verticalCoordinates,
      xCoords,
      yCoords,
      zCoords
    }
    for (const [key, value] of Object.entries(LIVE_STATE)) {
      result[key] = value.value
    }
    return result
  }

  /**
   * Apply revived state to current state.
   * @param data JSON data as an Object instance.
   */
  function fromJSON(data: any) {
    for (const key in LIVE_STATE) {
      LIVE_STATE[key as keyof typeof LIVE_STATE].value = data[key]
    }
    horizontalCoordinates.length = 0
    horizontalCoordinates.push(...data.horizontalCoordinates)
    verticalCoordinates.length = 0
    verticalCoordinates.push(...data.verticalCoordinates)
    xCoords.length = 0
    xCoords.push(...data.xCoords)
    yCoords.length = 0
    yCoords.push(...data.yCoords)
    zCoords.length = 0
    zCoords.push(...data.zCoords)
  }

  return {
    // State
    ...LIVE_STATE,
    horizontalCoordinates,
    verticalCoordinates,
    xCoords,
    yCoords,
    zCoords,
    // Computed state
    edgeMonzos,
    edgesError,
    horizontals,
    verticals,
    latticeOptions,
    latticeOptions3D,
    xs,
    ys,
    zs,
    // Methods
    kraigGrady,
    scott24,
    pr72,
    pe72,
    autoDepth,
    WGP,
    sphere,
    pitch,
    yaw,
    roll,
    toJSON,
    fromJSON
  }
})
