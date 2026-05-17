<script setup lang="ts">
import MosPyramid from '@/components/MosPyramid.vue'
import NumericSlider from '@/components/NumericSlider.vue'
import ScaleRule from '@/components/ScaleRule.vue'
import { useScaleStore } from '@/stores/scale'
import { debounce } from '@/utils'
import { mosModes, splitMosPattern, type ModeInfo } from 'moment-of-symmetry'
import { getHardness } from 'moment-of-symmetry/hardness'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Fraction } from 'xen-dev-utils/fraction'

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

const hardnessSlider = computed<number>({
  get: () => 1 - 1 / hardness.value,
  set(newValue) {
    hardness.value = 1 / (1 - newValue)
    message.value = 'Loading...'
    updateScale()
  }
})

const horizontal = ref(0)
const vertical = ref(2)

const name = ref('Diatonic')
const pattern = ref('5L 2s')
const udp = ref('5|1')

const modeSelect = ref<HTMLSelectElement | null>(null)

const modes = computed<ModeInfo[]>(() => {
  const [numberOfLargeSteps, numberOfSmallSteps] = splitMosPattern(pattern.value)
  return mosModes(numberOfLargeSteps, numberOfSmallSteps, true)
})

function formatMode(mode: ModeInfo) {
  const modeName = mode.modeName ?? '(Unnamed)'
  return `${mode.udp} — ${mode.mode} — ${modeName}`
}

function computeScale() {
  const h = rationalHardness.value
  const hStr = h.d ? (h as Fraction).toFraction() : 'inf'
  scale.name = name.value.charAt(0).toUpperCase() + name.value.slice(1)
  scale.sourceText = `MOS {\n  ${pattern.value} ${udp.value}\n  hardness = ${hStr}\n}\nJ4 = baseFrequency\nautomos()`
  scale.computeScale()
  message.value = ' '
}

const updateScale = debounce(computeScale)

function selectMode() {
  message.value = 'Loading...'
  updateScale()
  if (modeSelect.value) {
    modeSelect.value.blur()
  }
}

function mos(mosName: string, mosPattern: string, udpStr: string) {
  name.value = mosName
  pattern.value = mosPattern
  udp.value = udpStr
  message.value = 'Loading...'
  updateScale()
}

async function done() {
  computeScale()
  await router.push('/')
}

const EASTER_EGG_SOURCE = `(* Create a rank-4 temperament from the Spoob comma *)
const spoob = CTE([1 0 -6 12 -6⟩)

(* Obtain the period and generators *)
const [period, ...generators] = mappingBasis(spoob)

(* Create a fairly even lattice using the generators *)
parallelotope(generators, [1, 1, 1], [0, 0, 1], period)

(* Temper *)
spoob
`

async function easterEgg() {
  scale.name = 'Spoob'
  scale.sourceText = EASTER_EGG_SOURCE
  scale.computeScale()
  await router.push('/')
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
        <div class="mode-control">
          <label for="mos-mode">Mode</label>
          <select ref="modeSelect" id="mos-mode" v-model="udp" @change="selectMode">
            <option v-for="mode of modes" :key="mode.udp" :value="mode.udp">
              {{ formatMode(mode) }}
            </option>
          </select>
        </div>
        <button class="done" @click="done">done</button>
      </div>
    </div>
    <div class="controls control-group">
      <label for="hardness">Hardness ({{ hardnessRange }})</label>
      <NumericSlider
        id="hardness"
        class="control"
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
  overflow: hidden;
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
  margin-top: 0.5em;
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
  margin-left: 0;
  margin-right: 0;
}
.mode-control {
  margin-top: 0.5em;
}
.mode-control label {
  color: var(--color-accent-text-btn);
  font-weight: bold;
}
.mode-control select {
  min-width: 5em;
  width: 100%;
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
  .done {
    margin-top: 1em;
  }
  .mode-control {
    margin-top: 1em;
    overflow: visible;
  }
  .mode-control select:focus {
    width: 18rem;
    transform: translateX(calc(4em - 18rem));
    z-index: 1;
  }
}
</style>
