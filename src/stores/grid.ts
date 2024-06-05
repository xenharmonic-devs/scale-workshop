import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { shortestEdge, type GridOptions } from 'ji-lattice'
import { LOG_PRIMES, mmod } from 'xen-dev-utils'
import { Val, evaluateExpression, parseChord } from 'sonic-weave'
import { computedAndError } from '@/utils'
import { FIFTH, THIRD } from '@/constants'

const TWELVE = evaluateExpression('12@', false) as Val

export const useGridStore = defineStore('grid', () => {
  // View
  const size = ref(0.15)
  const viewCenterX = ref(0)
  const viewCenterY = ref(-0.1)
  const viewScale = ref(2.5)
  const labelOffset = ref(2)
  const showLabels = ref(true)

  // Elements
  const valString = ref('12p')
  const edgesString = ref('')

  const delta1 = ref(7)
  const delta1X = ref(1)
  const delta1Y = ref(0)
  const delta2 = ref(4)
  const delta2X = ref(0)
  const delta2Y = ref(-1)
  const minX = ref(-3.1)
  const maxX = ref(3.1)
  const minY = ref(-2.1)
  const maxY = ref(2.1)
  const gridlines1 = ref(true)
  const gridlines2 = ref(true)
  const diagonals1 = ref(false)
  const diagonals2 = ref(false)

  const val = computed<Val>(() => {
    try {
      const val = evaluateExpression(valString.value)
      if (val instanceof Val) {
        return val
      }
    } catch {
      /* empty */
    }
    try {
      const val = evaluateExpression(valString.value.trim() + '@')
      if (val instanceof Val) {
        return val
      }
    } catch {
      /* empty */
    }
    return TWELVE
  })

  const modulus = computed(() => val.value.divisions.round().valueOf())

  const [edges, edgesError] = computedAndError(() => {
    return parseChord(edgesString.value)
  }, [])

  const edgeVectors = computed(() => {
    const options: GridOptions = {
      modulus: modulus.value,
      delta1: delta1.value,
      delta1X: delta1X.value,
      delta1Y: delta1Y.value,
      delta2: delta2.value,
      delta2X: delta2X.value,
      delta2Y: delta2Y.value,
      minX: minX.value,
      maxX: maxX.value,
      minY: minY.value,
      maxY: maxY.value
    }

    const result: number[][] = []
    try {
      for (const edge of edges.value) {
        const step = edge.dot(val.value).valueOf()
        result.push(shortestEdge(step, options))
      }
    } catch {
      return []
    }

    return result
  })

  const gridOptions = computed<GridOptions>(() => {
    return {
      modulus: modulus.value,
      delta1: delta1.value,
      delta1X: delta1X.value,
      delta1Y: delta1Y.value,
      delta2: delta2.value,
      delta2X: delta2X.value,
      delta2Y: delta2Y.value,
      minX: minX.value,
      maxX: maxX.value,
      minY: minY.value,
      maxY: maxY.value,
      edgeVectors: edgeVectors.value,
      gridLines: {
        delta1: gridlines1.value,
        delta2: gridlines2.value,
        diagonal1: diagonals1.value,
        diagonal2: diagonals2.value
      },
      mergeEdges: true
    }
  })

  function resetBounds() {
    minX.value = -3.1
    maxX.value = 3.1
    minY.value = -2.1
    maxY.value = 2.1
  }

  function square(divisions: number) {
    resetBounds()

    size.value = 0.15
    viewScale.value = 3.1
    viewCenterX.value = 0
    viewCenterY.value = -0.1

    valString.value = `${divisions}p`
    delta1.value = mmod(Math.round((divisions * LOG_PRIMES[1]) / LOG_PRIMES[0]), divisions)
    delta1X.value = 1
    delta1Y.value = 0
    delta2.value = mmod(Math.round((divisions * LOG_PRIMES[2]) / LOG_PRIMES[0]), divisions)
    delta2X.value = 0
    delta2Y.value = -1
    gridlines1.value = true
    gridlines2.value = true
    diagonals1.value = false
    diagonals2.value = false
    edgesString.value = '3/2 5/4'
  }

  /**
   * Create a square lattice configuration based on the val and edges.
   */
  function autoSquare() {
    resetBounds()

    size.value = 0.15
    viewScale.value = 3.1
    viewCenterX.value = 0
    viewCenterY.value = -0.1

    const edge1 = edges.value[0] ?? FIFTH
    delta1.value = val.value.dot(edge1).valueOf()
    delta1X.value = 1
    delta1Y.value = 0

    const edge2 = edges.value[1] ?? THIRD
    delta2.value = val.value.dot(edge2).valueOf()
    delta2X.value = 0
    delta2Y.value = -1

    gridlines1.value = true
    gridlines2.value = true
    diagonals1.value = false
    diagonals2.value = false
  }

  function squareBP(divisions: number) {
    resetBounds()

    size.value = 0.15
    viewScale.value = 3.1
    viewCenterX.value = 0
    viewCenterY.value = -0.1

    valString.value = `b${divisions}p`
    delta1.value = mmod(Math.round((divisions * LOG_PRIMES[2]) / LOG_PRIMES[1]), divisions)
    delta1X.value = 1
    delta1Y.value = 0
    delta2.value = mmod(Math.round((divisions * LOG_PRIMES[3]) / LOG_PRIMES[1]), divisions)
    delta2X.value = 0
    delta2Y.value = -1
    gridlines1.value = true
    gridlines2.value = true
    diagonals1.value = false
    diagonals2.value = false
    edgesString.value = '5/3 7/3'
  }

  function tonnetz(divisions: number) {
    resetBounds()

    size.value = 1
    viewScale.value = 30.1
    viewCenterX.value = 0
    viewCenterY.value = 0

    valString.value = `${divisions}p`
    delta1.value = mmod(Math.round((divisions * LOG_PRIMES[1]) / LOG_PRIMES[0]), divisions)
    delta1X.value = 6
    delta1Y.value = 0
    delta2.value = mmod(Math.round((divisions * LOG_PRIMES[2]) / LOG_PRIMES[0]), divisions)
    delta2X.value = 3
    delta2Y.value = -5
    gridlines1.value = true
    gridlines2.value = true
    diagonals1.value = true
    diagonals2.value = false
    edgesString.value = '3/2 5/4 6/5'
  }

  /**
   * Create a triangular lattice configuration based on the val and edges.
   */
  function autoTonnetz() {
    resetBounds()

    size.value = 1
    viewScale.value = 30.1
    viewCenterX.value = 0
    viewCenterY.value = 0

    const edge1 = edges.value[0] ?? FIFTH
    delta1.value = val.value.dot(edge1).valueOf()
    delta1X.value = 6
    delta1Y.value = 0

    const edge2 = edges.value[1] ?? THIRD
    delta2.value = val.value.dot(edge2).valueOf()
    delta2X.value = 3
    delta2Y.value = -5

    gridlines1.value = true
    gridlines2.value = true
    diagonals1.value = true
    diagonals2.value = false
  }

  function preset311() {
    resetBounds()

    size.value = 8
    viewScale.value = 200
    viewCenterX.value = 0
    viewCenterY.value = 0

    valString.value = '311p'
    delta1.value = 296
    delta1X.value = 28
    delta1Y.value = 2
    delta2.value = 242
    delta2X.value = 15
    delta2Y.value = -8
    gridlines1.value = true
    gridlines2.value = true
    diagonals1.value = false
    diagonals2.value = false
    edgesString.value = '3/2 5/4 6/5 7/4 11/8 13/8'
  }

  return {
    // State
    size,
    viewCenterX,
    viewCenterY,
    viewScale,
    labelOffset,
    showLabels,
    valString,
    edgesString,
    delta1,
    delta1X,
    delta1Y,
    delta2,
    delta2X,
    delta2Y,
    minX,
    maxX,
    minY,
    maxY,
    gridlines1,
    gridlines2,
    diagonals1,
    diagonals2,
    // Computed state
    edges,
    edgesError,
    edgeVectors,
    val,
    modulus,
    gridOptions,
    // Methods (presets)
    square,
    squareBP,
    tonnetz,
    preset311,
    // Methods (auto-params)
    autoSquare,
    autoTonnetz
  }
})
