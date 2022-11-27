<script setup lang="ts">
import { DEFAULT_NUMBER_OF_COMPONENTS } from "@/constants";
import { computedAndError } from "@/utils";
import { parseLine, type Interval } from "scale-workshop-core";
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
    ? parseLine(props.modelValue || "1/1", DEFAULT_NUMBER_OF_COMPONENTS)
    : props.defaultValue;
const [value, error] = computedAndError(
  () => parseLine(props.modelValue, DEFAULT_NUMBER_OF_COMPONENTS),
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
