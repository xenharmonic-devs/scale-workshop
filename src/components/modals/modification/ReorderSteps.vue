<script setup lang="ts">
import { computed, ref, shallowRef, useId } from 'vue'
import { parseAST } from 'sonic-weave/parser'
import { stepString } from 'sonic-weave/words'
import Modal from '@/components/ModalDialog.vue'
import { useScaleStore } from '@/stores/scale'

defineProps<{ show: boolean }>()
const emit = defineEmits(['done', 'cancel'])
const scale = useScaleStore()

// Use the same unstacking operation as the source that will be applied.
const { visitor, defaults } = scale.getUserScopeVisitor()
const usedDefaultScale = !visitor.currentScale.length
if (usedDefaultScale) {
  visitor.currentScale.push(...scale.relativeIntervals)
}
// Absolute pitches must use the declared unison, just as in computeScale().
visitor.executeProgram(parseAST('relative(£)'))
const patternPrefix = useId()
const equaveInterval = visitor.currentScale[visitor.currentScale.length - 1]
const equaveText = equaveInterval.domain === 'linear' ? equaveInterval.str(visitor.rootContext) : ''
const equaveLabel = /^\d+$/.test(equaveText) ? `${equaveText}/1` : equaveText
const originalWord = stepString(visitor.currentScale.map((interval) => interval.value))
visitor.executeProgram(parseAST('unstack()'))
const letters = [...new Set(originalWord)].sort()
const steps = shallowRef(
  visitor.currentScale.map((interval, id) => ({
    id,
    interval,
    cents: interval.totalCents(),
    letter: originalWord[id],
    color: `hsl(${(letters.indexOf(originalWord[id]) * 137.508 + 25) % 360}, 65%, 55%)`
  }))
)

const list = ref<HTMLOListElement | null>(null)
const dragging = ref<number | null>(null)
let pointerId: number | null = null

function makePreview(orderedSteps: typeof steps.value, state: string) {
  let cents = 0
  let value = orderedSteps[0].interval.value.pow(0)
  const values: (typeof value)[] = []
  const spans = orderedSteps.map((step, index) => {
    const start = cents
    cents += step.cents
    value = value.mul(step.interval.value)
    values.push(value)
    return { ...step, index, start, end: cents }
  })
  const positions = [0, ...spans.map((span) => span.end)]
  // Split at every endpoint so no later span can conceal an earlier one.
  const boundaries = [...new Set(positions)].sort((a, b) => a - b)
  const segments = boundaries.slice(0, -1).flatMap((start, i) => {
    const end = boundaries[i + 1]
    return [false, true].flatMap((negative) => {
      const members = spans.filter(
        (span) =>
          span.cents < 0 === negative &&
          Math.min(span.start, span.end) < end &&
          Math.max(span.start, span.end) > start
      )
      return members.length
        ? [{ start, end, negative, members, pattern: `${patternPrefix}-${state}-${i}-${negative}` }]
        : []
    })
  })
  return {
    spans,
    segments,
    equave: cents,
    word: stepString(values),
    hasNegative: spans.some((span) => span.cents < 0),
    state,
    ticks: [...new Set(positions)]
  }
}

// Keep the opening order fixed while both rulers use the same cents range.
const before = makePreview(steps.value, 'before')
const preview = computed(() => makePreview(steps.value, 'after'))
const ruler = computed(() => {
  const states = [before, preview.value]
  const positions = states.flatMap((state) => state.ticks)
  const min = Math.min(...positions)
  const range = Math.max(...positions) - min || 1
  return { states, y: (position: number) => 30 + ((position - min) / range) * 540 }
})

function move(from: number, to: number) {
  if (to < 0 || to >= steps.value.length || from === to) return
  const reordered = [...steps.value]
  const [step] = reordered.splice(from, 1)
  reordered.splice(to, 0, step)
  steps.value = reordered
}

function startDrag(event: PointerEvent, id: number) {
  if (event.button !== 0 || !list.value) return
  if (
    window.matchMedia?.('(max-width: 600px)').matches &&
    !(event.target as Element).closest('.drag-handle')
  )
    return
  dragging.value = id
  pointerId = event.pointerId
  list.value.setPointerCapture(event.pointerId)
}

function drag(event: PointerEvent) {
  if (dragging.value === null || event.pointerId !== pointerId || !list.value) return
  const bounds = list.value.getBoundingClientRect()
  if (event.clientY < bounds.top + 30) list.value.scrollTop -= 12
  if (event.clientY > bounds.bottom - 30) list.value.scrollTop += 12
  const others = [...list.value.children].filter(
    (row) => Number((row as HTMLElement).dataset.id) !== dragging.value
  )
  const to = others.filter((row) => {
    const rect = row.getBoundingClientRect()
    return event.clientY > rect.top + rect.height / 2
  }).length
  move(
    steps.value.findIndex((step) => step.id === dragging.value),
    to
  )
}

function endDrag() {
  if (pointerId !== null && list.value?.hasPointerCapture(pointerId)) {
    list.value.releasePointerCapture(pointerId)
  }
  dragging.value = null
  pointerId = null
}

function modify(expand = true) {
  // An empty source displays 12-TET; materialize it before permuting its steps.
  const source = usedDefaultScale ? `${scale.sourceText}\ntet(12)` : scale.sourceText
  const permutation = steps.value.map((step) => step.id).join(', ')
  const result = `${source}\nrelative(£)\nunstack()\n£[[${permutation}]]\nstack()`
  if (expand) {
    visitor.executeProgram(parseAST(`£[[${permutation}]]\nstack()`))
    scale.sourceText = visitor.expand(defaults)
  } else {
    scale.sourceText = result
  }
  scale.computeScale()
  emit('done')
}
</script>

<template>
  <Modal class="reorder-steps" :show="show" @confirm="modify" @cancel="$emit('cancel')">
    <template #header><h2>Reorder steps</h2></template>
    <template #body>
      <p>Drag the unstacked steps into a new order, or use the arrow buttons.</p>
      <div class="reorder-preview">
        <div class="step-list">
          <h3>Steps</h3>
          <ol
            ref="list"
            aria-label="Unstacked steps"
            @pointermove="drag"
            @pointerup="endDrag"
            @pointercancel="endDrag"
            @lostpointercapture="endDrag"
          >
            <li
              v-for="(step, index) of steps"
              :key="step.id"
              :data-id="step.id"
              :class="{ dragging: dragging === step.id }"
              :style="{ borderLeftColor: step.color }"
              @pointerdown="startDrag($event, step.id)"
            >
              <button
                class="drag-handle"
                :aria-label="`Drag step ${index + 1}; use arrow keys to reorder`"
                @keydown.up.prevent="move(index, index - 1)"
                @keydown.down.prevent="move(index, index + 1)"
              >
                ⠿
              </button>
              <span class="step-description">
                <strong>{{ index + 1 }}. {{ step.letter }}</strong>
                <span class="step-details">
                  <span>{{ step.interval.str(visitor.rootContext) }}</span>
                  <small>{{ step.cents.toFixed(scale.centsFractionDigits) }} ¢</small>
                </span>
              </span>
              <span class="move-buttons" @pointerdown.stop>
                <button
                  :aria-label="`Move step ${index + 1} up`"
                  :disabled="index === 0"
                  @click="move(index, index - 1)"
                >
                  ↑
                </button>
                <button
                  :aria-label="`Move step ${index + 1} down`"
                  :disabled="index === steps.length - 1"
                  @click="move(index, index + 1)"
                >
                  ↓
                </button>
              </span>
            </li>
          </ol>
        </div>
        <figure>
          <figcaption>Scale preview (¢)</figcaption>
          <svg
            viewBox="0 0 328 600"
            role="img"
            aria-label="Scale ruler before and after reordering"
          >
            <g
              v-for="(state, stateIndex) of ruler.states"
              :key="state.state"
              :class="`${state.state}-state`"
              :transform="`translate(${stateIndex === 0 ? -32 : 148}, 0)`"
              :aria-label="state.state === 'before' ? 'Before reordering' : 'After reordering'"
            >
              <text x="80" y="14" text-anchor="middle" class="ruler-heading">
                {{ state.state === 'before' ? 'Before' : 'After' }}
              </text>
              <line x1="80" x2="80" y1="20" y2="580" class="ruler-line" />
              <g v-for="(tick, index) of state.ticks" :key="index">
                <line x1="76" x2="84" :y1="ruler.y(tick)" :y2="ruler.y(tick)" class="ruler-line" />
                <text x="125" :y="ruler.y(tick) + 4">{{ tick.toFixed(1) }}</text>
              </g>
              <defs>
                <pattern
                  v-for="segment of state.segments.filter((segment) => segment.members.length > 1)"
                  :id="segment.pattern"
                  :key="segment.pattern"
                  patternUnits="userSpaceOnUse"
                  :width="segment.members.length * 6"
                  height="6"
                  patternTransform="rotate(45)"
                >
                  <rect
                    v-for="(member, index) of segment.members"
                    :key="member.id"
                    :x="index * 6"
                    y="0"
                    width="6"
                    height="6"
                    :fill="member.color"
                    :fill-opacity="dragging === null || dragging === member.id ? 1 : 0.35"
                  />
                </pattern>
              </defs>
              <rect
                v-for="segment of state.segments"
                :key="segment.pattern"
                :class="['ruler-span', { 'step-span': state.state === 'after' }]"
                :data-step-id="segment.members.map((member) => member.id).join(',')"
                :data-direction="segment.negative ? 'negative' : 'positive'"
                :x="segment.negative ? 42 : 84"
                :y="ruler.y(segment.start)"
                width="34"
                :height="Math.max(1, ruler.y(segment.end) - ruler.y(segment.start))"
                :fill="
                  segment.members.length > 1 ? `url(#${segment.pattern})` : segment.members[0].color
                "
                :fill-opacity="
                  segment.members.length > 1 ||
                  dragging === null ||
                  dragging === segment.members[0].id
                    ? 1
                    : 0.35
                "
              >
                <title>
                  {{
                    segment.members
                      .map(
                        (member) =>
                          `Step ${member.index + 1}: ${member.letter}, ${member.cents.toFixed(scale.centsFractionDigits)} cents`
                      )
                      .join('; ')
                  }}
                </title>
              </rect>
              <text
                v-if="state.state === 'after'"
                class="root-marker"
                :x="state.hasNegative ? 38 : 72"
                :y="ruler.y(0) + 4"
                text-anchor="end"
              >
                1/1
              </text>
              <text
                v-if="state.state === 'after' && equaveLabel"
                class="equave-marker"
                :x="state.hasNegative ? 38 : 72"
                :y="ruler.y(state.equave) + 4"
                text-anchor="end"
              >
                <title>Ending equave</title>
                {{ equaveLabel }}
              </text>
            </g>
          </svg>
          <small v-if="preview.hasNegative"
            >Descending steps on the left; ascending steps on the right.</small
          >
        </figure>
      </div>
      <p class="step-string" aria-live="polite">
        <strong>stepString: </strong><code>{{ preview.word }}</code>
      </p>
    </template>
    <template #footer>
      <div class="btn-group">
        <button @click="modify(true)">OK</button>
        <button @click="$emit('cancel')">Cancel</button>
        <button @click="modify(false)">Raw</button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.reorder-steps :deep(.modal-container) {
  width: min(50rem, calc(100vw - 2rem));
  min-width: 0;
  max-width: 50rem;
  box-sizing: border-box;
  height: min(54rem, calc(100dvh - 2rem));
}
.reorder-steps :deep(.modal-body) {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.reorder-preview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18rem;
  gap: 1rem;
  margin-top: 1rem;
  flex: 1;
  min-height: 12rem;
}
h3,
figcaption {
  font-size: 1rem;
  margin: 0 0 0.5rem;
}
.step-list {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
ol {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
  padding: 0.35rem;
  border: 1px solid var(--color-border);
  border-left: 0.5rem solid;
  border-radius: 3px;
  background: var(--color-background-soft);
  cursor: grab;
  touch-action: none;
  user-select: none;
  line-height: 1.4;
}
li.dragging {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}
.drag-handle {
  cursor: grab;
  touch-action: none;
  user-select: none;
  padding: 0.25rem;
}
.dragging,
.dragging .drag-handle {
  cursor: grabbing;
}
.step-description {
  display: flex;
  flex-direction: column;
  overflow-wrap: anywhere;
  min-width: 0;
  flex: 1;
}
.step-details {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.75rem;
}
.move-buttons {
  display: flex;
  gap: 0.2rem;
  cursor: default;
}
.move-buttons button {
  padding: 0 0.4rem;
}
figure {
  margin: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  line-height: 1.4;
}
svg {
  display: block;
  width: 100%;
  flex: 1;
  min-height: 0;
}
.ruler-line {
  stroke: var(--color-text);
}
text {
  fill: var(--color-text);
  font-size: 11px;
}
.ruler-span {
  stroke: var(--color-background);
  stroke-width: 0.5;
}
.step-string {
  overflow-wrap: anywhere;
  margin: 1rem 0;
}
.ruler-heading {
  font-weight: bold;
  font-size: 13px;
}
@media (max-width: 600px) {
  .reorder-preview {
    grid-template-columns: minmax(0, 1fr);
    flex: none;
    gap: 0.5rem;
  }
  .step-list ol {
    height: min(52dvh, 28rem);
    max-height: none;
    flex: none;
  }
  figure svg {
    height: 28rem;
    flex: none;
  }
  li {
    cursor: default;
    touch-action: pan-y;
    user-select: auto;
    gap: 0.25rem;
  }
  .drag-handle {
    min-width: 2.75rem;
    min-height: 2.75rem;
    align-self: stretch;
  }
}
</style>
