<script setup lang="ts">
import { ref } from 'vue'
import { debounce } from '@/utils'

const DEV = import.meta.env.DEV

const result = ref('click a button')

const lightCalls = ref(0)
const heavyCalls = ref(0)

function task(n: number) {
  console.log('task starting n =', n)
  if (n < 1000) {
    lightCalls.value++
  } else {
    heavyCalls.value++
  }
  let sum = 0
  for (let i = 1; i < n; ++i) {
    sum += 1 / i
  }
  if (n < 1000) {
    result.value = `Light #${lightCalls.value}: ${sum}`
  } else {
    result.value = `Heavy #${heavyCalls.value}: ${sum}`
  }
  console.log('task finished n =', n)
}

const doIt = debounce(task)

const numAsyncCalls = ref(0)
const sleepyCalls = ref(0)
const sleepyAwareCalls = ref(0)
const lightAsyncCalls = ref(0)
const heavyAsyncCalls = ref(0)

function asyncTask(n: number) {
  console.log('async task starting n = ', n)
  const taskId = ++numAsyncCalls.value
  let id = 0
  if (!n) {
    id = ++sleepyCalls.value
  } else if (n === 1) {
    id = ++sleepyAwareCalls.value
  } else if (n < 1000) {
    id = ++lightAsyncCalls.value
  } else {
    id = ++heavyAsyncCalls.value
  }
  setTimeout(
    () => {
      let sum = 0
      for (let i = 1; i < n; ++i) {
        sum += 1 / i
      }
      if (!n) {
        result.value = `Sleepy #${id}: ${sum}`
      } else if (n === 1) {
        if (taskId === numAsyncCalls.value) {
          result.value = `Sleepy aware #${id}: ${sum}`
        }
      } else if (n < 1000) {
        result.value = `Light (async) #${id}: ${sum}`
      } else {
        result.value = `Heavy (async) #${id}: ${sum}`
      }
      console.log('async task finished n =', n)
    },
    n < 2 ? 1000 : 0
  )
}

const doAsync = debounce(asyncTask)
</script>
<template>
  <main v-if="DEV">
    <p>{{ result }}</p>
    <button @click="doIt(500)">light (sync)</button>
    <button @click="doIt(1000000000)">heavy (sync)</button>
    <br />
    <button @click="doAsync(500)">light (async)</button>
    <button @click="doAsync(1000000000)">heavy (async)</button>
    <button @click="doAsync(0)">sleepy (async)</button>
    <button @click="doAsync(1)">sleepy aware (async)</button>
  </main>
</template>

<style scoped>
main {
  padding: 2em;
}
</style>
