<script setup lang="ts">
import { parseLine } from "@/parser";
import type { Interval } from "@/interval";
import { computedAndError } from "@/utils";
import { ref, watch } from "vue";

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  defaultValue?: Interval;
}>();

const emit = defineEmits(["update:value", "update:modelValue"]);

const element = ref<HTMLInputElement | null>(null);
const defaultValue =
  props.defaultValue === undefined
    ? parseLine(props.modelValue || "1/1")
    : props.defaultValue;
const [value, error] = computedAndError(
  () => parseLine(props.modelValue),
  defaultValue
);
watch(value, (newValue) => emit("update:value", newValue), { immediate: true });
watch(error, (newError) => element.value!.setCustomValidity(newError));
</script>

<template>
  <input
    ref="element"
    type="text"
    :placeholder="placeholder"
    :value="modelValue"
    @input="
      $emit('update:modelValue', ($event.target as HTMLInputElement)!.value)
    "
  />
</template>
