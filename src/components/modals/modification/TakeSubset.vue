<script setup lang="ts">
import { computed, reactive } from "vue";
import Modal from "@/components/ModalDialog.vue";
import type Scale from "@/scale";

const props = defineProps<{
  scale: Scale;
}>();
const emit = defineEmits(["update:scale", "cancel"]);
defineExpose({ initialize });

const selected = reactive<Set<number>>(new Set());

const mode = computed(() => {
  const degrees = [...selected.values()];
  degrees.sort((a, b) => a - b);
  degrees.push(props.scale.size);
  const result = [];
  for (let i = 1; i < degrees.length; ++i) {
    result.push(degrees[i] - degrees[i - 1]);
  }
  return result.map((gap) => gap.toString()).join(", ");
});

const degrees = computed(() => {
  const degrees = [...selected.values()];
  degrees.sort((a, b) => a - b);
  degrees.shift();
  return (
    degrees.map((degree) => degree.toString()).join(", ") +
    `, (${props.scale.size})`
  );
});

function toggle(index: number) {
  if (selected.has(index)) {
    selected.delete(index);
  } else {
    selected.add(index);
  }
}

function initialize() {
  selected.clear();
  selected.add(0);
  for (let i = 1; i < props.scale.size; ++i) {
    selected.add(i);
  }
}

function modify() {
  emit("update:scale", props.scale.subset(selected));
}
</script>

<template>
  <Modal @confirm="modify" @cancel="$emit('cancel')">
    <template #header>
      <h2>Take subset</h2>
    </template>
    <template #body>
      <p>Select a subset from the current scale.</p>
      <div class="control-group">
        <label>Selected intervals</label>
        <div class="control">
          <button
            v-for="i of props.scale.size - 1"
            :key="i"
            class="degree"
            :class="{ selected: selected.has(i) }"
            @click="toggle(i)"
          >
            {{ scale.getName(i) }}
          </button>
        </div>
        <div class="control"><label>Mode </label>{{ mode }}</div>
        <div class="control"><label>Degrees </label>{{ degrees }}</div>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.degree {
  color: #477;
}
.degree:hover {
  color: #eee;
  background-color: #6aa;
}
.degree.selected {
  color: #111;
  background-color: #199;
}
.degree.selected:hover {
  color: white;
  background-color: #2bb;
}
</style>
