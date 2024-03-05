import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { kraigGrady9, type LatticeOptions, scottDakota24, primeRing72, align } from 'ji-lattice'
import { LOG_PRIMES, mmod } from 'xen-dev-utils'
import { computedAndError } from '@/utils'
import { parseChord } from 'sonic-weave'

export const useJiLatticeStore = defineStore('ji-lattice', () => {
  // Kraig Grady's coordinates only go up to 23-limit, but it was the default in Scale Workshop 2.
  const opts = kraigGrady9();
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
    get() {return horizontalCoordinates.join(' ')},
    set(value: string) {
      horizontalCoordinates.length = 0
      horizontalCoordinates.push(...value.split(' ').map(v => {const i = parseInt(v); return isNaN(i) ? 0 : i}))
    }
  })
  const verticals = computed({
    get() {return verticalCoordinates.join(' ')},
    set(value: string) {
      verticalCoordinates.length = 0
      verticalCoordinates.push(...value.split(' ').map(v => {const i = parseInt(v); return isNaN(i) ? 0 : i}))
    }
  })

  const edgeMonzos = computed(() => {
    const numComponents = horizontalCoordinates.length;
    const result: number[][] = [];
    for (const interval of edges.value) {
      const value = interval.value.clone()
      value.numberOfComponents = numComponents
      const monzo = interval.value.primeExponents.map(pe => pe.valueOf())
      result.push(monzo);
    }
    return result;
  })

  const latticeOptions = computed<LatticeOptions>(() => {
    return {
      horizontalCoordinates,
      verticalCoordinates,
      maxDistance: maxDistance.value,
      edgeMonzos: edgeMonzos.value,
      mergeEdges: true,
    };
  });

  watch(rotation, (newValue) => {
    if (newValue < 0 || newValue >= 360) {
      rotation.value = mmod(newValue, 360);
    }
  });

  function kraigGrady(equaveIndex = 0) {
    size.value = 2
    const kg = kraigGrady9(equaveIndex);
    horizontalCoordinates.length = 0;
    horizontalCoordinates.push(...kg.horizontalCoordinates);
    verticalCoordinates.length = 0;
    verticalCoordinates.push(...kg.verticalCoordinates);
    edgesString.value = ''
  }

  function scott24(equaveIndex = 0) {
    size.value = 2
    const logs = LOG_PRIMES.slice(0, 24)
    if (equaveIndex !== 0) {
      logs.unshift(logs.splice(equaveIndex, 1)[0]);
    }
    const sd = scottDakota24(logs);
    horizontalCoordinates.length = 0;
    horizontalCoordinates.push(...sd.horizontalCoordinates);
    verticalCoordinates.length = 0;
    verticalCoordinates.push(...sd.verticalCoordinates);
    edgesString.value = '6/5'
  }

  function pr72(equaveIndex = 0) {
    size.value = 4
    const logs = LOG_PRIMES.slice(0, 72)
    if (equaveIndex !== 0) {
      logs.unshift(logs.splice(equaveIndex, 1)[0]);
    }
    const pr = primeRing72(logs);
    horizontalCoordinates.length = 0;
    horizontalCoordinates.push(...pr.horizontalCoordinates);
    verticalCoordinates.length = 0;
    verticalCoordinates.push(...pr.verticalCoordinates);
    edgesString.value = '6/5'
  }

  function pe72(equaveIndex = 0) {
    size.value = 4
    const logs = LOG_PRIMES.slice(0, 72)
    if (equaveIndex !== 0) {
      logs.unshift(logs.splice(equaveIndex, 1)[0]);
    }
    const pr = primeRing72(logs, false);
    align(pr, 1, 2);
    horizontalCoordinates.length = 0;
    horizontalCoordinates.push(...pr.horizontalCoordinates.map(Math.round));
    verticalCoordinates.length = 0;
    verticalCoordinates.push(...pr.verticalCoordinates.map(Math.round));
    edgesString.value = '6/5'
  }

  return {
    // State
    horizontalCoordinates,
    verticalCoordinates,
    maxDistance,
    size,
    labelOffset,
    edgesString,
    showLabels,
    rotation,
    drawArrows,
    grayExtras,
    // Computed state
    edgeMonzos,
    edgesError,
    horizontals,
    verticals,
    latticeOptions,
    // Methods
    kraigGrady,
    scott24,
    pr72,
    pe72,
  }
})
