import { computed, reactive, ref } from 'vue'

type Serializer = () => string
type Restorer = (state: string) => void

export function undoHistory(serialize: Serializer, restore: Restorer, capacity = 10) {
  const states = reactive<string[]>([])
  const pointer = ref(-1)

  pushState()

  function pushState() {
    while (states.length > pointer.value + 1) {
      states.pop()
    }
    const state = serialize()
    // Verify that actual change took place.
    if (states.length && state === states[states.length - 1]) {
      return
    }
    states.push(state)
    while (states.length > capacity) {
      states.shift()
    }
    pointer.value = states.length - 1
  }

  function undo() {
    pointer.value--
    if (pointer.value < 0) {
      pointer.value = -1
      return
    }
    restore(states[pointer.value])
  }

  function redo() {
    pointer.value++
    if (pointer.value >= states.length) {
      pointer.value = states.length - 1
      return
    }
    restore(states[pointer.value])
  }

  function truncate() {
    const state = states.pop()
    if (state === undefined) {
      return
    }
    states.length = 0
    states.push(state)
    pointer.value = states.length - 1
  }

  const undoDisabled = computed(() => pointer.value <= 0)

  const redoDisabled = computed(() => pointer.value >= states.length - 1)

  return {
    states,
    pointer,
    pushState,
    undo,
    redo,
    truncate,
    undoDisabled,
    redoDisabled
  }
}
