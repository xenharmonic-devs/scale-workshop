<script setup lang="ts">
import { parseLine } from "@/parser";
import type { ScaleLine } from "@/scale-line";
import { computedAndError } from "@/utils";
import { ref, watch } from "vue";

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  defaultValue?: ScaleLine;
}>();

const emit = defineEmits(["update:value", "update:modelValue"]);

const element = ref<HTMLInputElement | null>(null);
const defaultValue =
  props.defaultValue === null
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
    :placeholder="placeholder"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement)!.value)"
  />
</template>
