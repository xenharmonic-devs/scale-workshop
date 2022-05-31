<script setup lang="ts">
defineProps<{
  index: number;
  frequency: number;
  cents: number;
  ratio: number;
  name: string;
}>();
</script>

<template>
  <tr>
    <td></td>
    <td>{{ index }}</td>
    <td>{{ frequency.toFixed(3) }}Hz</td>
    <td>{{ cents.toFixed(3) }}</td>
    <td>{{ ratio.toFixed(3) }}</td>
    <td>{{ name }}</td>
  </tr>
</template>
