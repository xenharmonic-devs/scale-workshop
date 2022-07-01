<script setup lang="ts">
import { computed, reactive } from "vue";
import Modal from "../../ModalDialog.vue";
const props = defineProps<{
  scaleLines: string[];
}>();
const emit = defineEmits(["update:scaleLines", "cancel"]);
defineExpose({ initialize });

const selected = reactive<Set<number>>(new Set());

const mode = computed(() => {
  const degrees = [...selected.values()];
  degrees.sort((a, b) => a - b);
  degrees.unshift(-1);
  degrees.push(props.scaleLines.length - 1);
  const result = [];
  for (let i = 1; i < degrees.length; ++i) {
    result.push(degrees[i] - degrees[i - 1]);
  }
  return result.map((gap) => gap.toString()).join(", ");
});

const degrees = computed(() => {
  const degrees = [...selected.values()];
  degrees.sort((a, b) => a - b);
  degrees.push(props.scaleLines.length - 1);
  return degrees.map((degree) => (degree + 1).toString()).join(", ");
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
  for (const degree of props.scaleLines.slice(0, -1).keys()) {
    selected.add(degree);
  }
}

function modify() {
  const result: string[] = [];
  for (const index of selected) {
    result.push(props.scaleLines[index]);
  }
  result.push(props.scaleLines[props.scaleLines.length - 1]);
  emit("update:scaleLines", result);
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
            v-for="(line, index) of props.scaleLines.slice(0, -1)"
            :key="index"
            class="degree"
            :class="{ selected: selected.has(index) }"
            @click="toggle(index)"
          >
            {{ line }}
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
