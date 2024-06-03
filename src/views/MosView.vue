<script setup lang="ts">
import MosPyramid from '@/components/MosPyramid.vue'
import ScaleRule from '@/components/ScaleRule.vue'
import { useScaleStore } from '@/stores/scale'
import { debounce } from '@/utils'
import { getHardness } from 'moment-of-symmetry'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Fraction } from 'xen-dev-utils'

const scale = useScaleStore()
const router = useRouter()

const message = ref('Your scale will be replaced with a MOS scale upon interaction.')

const hardness = ref(2)

const rationalHardness = computed(() =>
  isFinite(hardness.value)
    ? new Fraction(hardness.value).sub(1).simplifyRelative(25).add(1)
    : { n: 1, d: 0 }
)

const hardnessRange = computed(() =>
  getHardness(rationalHardness.value.n, rationalHardness.value.d)
)

const hardnessSlider = computed({
  get: () => 1 - 1 / hardness.value,
  set(newValue: number) {
    // There's something wrong with how input ranges are handled.
    if (typeof newValue !== 'number') {
      newValue = parseFloat(newValue)
    }
    if (!isNaN(newValue)) {
      hardness.value = 1 / (1 - newValue)
      message.value = 'Loading...'
      updateScale()
    }
  }
})

const horizontal = ref(0)
const vertical = ref(2)

const name = ref('Diatonic')
const pattern = ref('5L 2s')
const udp = ref('5|1')

function computeScale() {
  const h = rationalHardness.value
  const hStr = h.d ? (h as Fraction).toFraction() : 'inf'
  scale.name = name.value.charAt(0).toUpperCase() + name.value.slice(1)
  scale.sourceText = `MOS {\n  ${pattern.value} ${udp.value}\n  hardness = ${hStr}\n}\nJ4 = baseFrequency\nautomos()`
  scale.computeScale()
  message.value = ' '
}

const updateScale = debounce(computeScale)

function mos(mosName: string, mosPattern: string, udpStr: string) {
  name.value = mosName
  pattern.value = mosPattern
  udp.value = udpStr
  message.value = 'Loading...'
  updateScale()
}

function done() {
  computeScale()
  router.push('/')
}

const EASTER_EGG_SOURCE = `(* Create a fairly even lattice using the generators *)
parallelotope([3, 5, 7], [1, 1, 1], [0, 0, 1], 1\\6)
(* Temper out the Spoob comma *)
PrimeMapping(1200.000, 1901.955, 2786.316, 3368.819, 4151.323)
`

function easterEgg() {
  scale.name = 'Spoob'
  scale.sourceText = EASTER_EGG_SOURCE
  scale.computeScale()
  router.push('/')
}
</script>

<template>
  <main>
    <div class="grid-container">
      <div class="scale-rule">
        <ScaleRule :scale="scale.scale" orientation="vertical" />
      </div>
      <MosPyramid
        class="pyramid"
        @easter-egg="easterEgg"
        @mos="mos"
        :selected="pattern"
        :rows="7"
        :horizontal="horizontal"
        :vertical="vertical"
        :hardness="rationalHardness"
      ></MosPyramid>
      <div class="pan-controls">
        <div>
          <button class="arrow" @click="horizontal--">⇦</button>
          <button class="arrow" @click="horizontal++">⇨</button>
        </div>
        <div>
          <button class="arrow" @click="vertical--">⇧</button>
          <button class="arrow" @click="vertical++">⇩</button>
        </div>
        <button class="done" @click="done">done</button>
      </div>
    </div>
    <div class="controls control-group">
      <label for="hardness">Hardness ({{ hardnessRange }})</label>
      <input
        id="hardness"
        class="control"
        type="range"
        min="0"
        max="1"
        step="any"
        v-model="hardnessSlider"
      />
      <span class="message"
        ><i>{{ message }}</i></span
      >
    </div>
  </main>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  padding: 1em;
}
.grid-container {
  height: 87%;
  display: grid;
  gap: 0.5em;
}
.controls {
  height: 13%;
}
.message {
  font-size: smaller;
  height: 1em;
}
.arrow {
  font-weight: bold;
  font-size: xx-large;
}
.done {
  margin-top: 1em;
  font-size: x-large;
}

/* Content layout (small) */
.grid-container {
  grid-template-columns: 10px 1fr;
  grid-template-rows: 6fr 1fr;
}
.scale-rule {
  grid-column: 1;
  grid-row: 1 / span 2;
}
.pyramid {
  grid-column: 2;
  grid-row: 1;
}
.pan-controls {
  grid-column: 2;
  grid-row: 2;
}
.pan-controls > div {
  display: inline-block;
  margin-left: 1em;
  margin-right: 1em;
}

/* Content layout (medium-large) */
@media screen and (min-width: 600px) {
  .grid-container {
    grid-template-columns: 10px 1fr 4em;
    grid-template-rows: 1fr;
  }
  .scale-rule {
    grid-column: 1;
    grid-row: 1;
  }
  .pyramid {
    grid-column: 2;
    grid-row: 1;
  }
  .pan-controls {
    grid-column: 3;
    grid-row: 1;
  }
  .pan-controls > div {
    display: block;
  }
}
</style>
