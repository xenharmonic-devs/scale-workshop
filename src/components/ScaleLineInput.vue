<script setup lang="ts">
import { computedAndError } from '@/utils'
import { evaluateExpression, type Interval } from 'sonic-weave';
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  defaultValue: Interval
  placeholder?: string
}>()

const emit = defineEmits(['update:value', 'update:modelValue'])

const element = ref<HTMLInputElement | null>(null)
const [value, error] = computedAndError(
  () => evaluateExpression(props.modelValue),
  props.defaultValue
)
watch(value, (newValue) => emit('update:value', newValue), { immediate: true })
watch(
  element,
  (newElement) => {
    if (newElement) {
      newElement.setCustomValidity(error.value)
    }
  },
  { immediate: true }
)
watch(
  error,
  (newError) => {
    if (element.value) {
      element.value.setCustomValidity(newError)
    }
  },
  { immediate: true }
)
</script>

<template>
  <input
    ref="element"
    type="text"
    :placeholder="placeholder"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement)!.value)"
  />
</template>
