<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const props = defineProps<{
  analyser: AnalyserNode | null;
  width: number;
  height: number;
  lineWidth: number;
  strokeStyle: string;
}>();

defineExpose({ initialize });

const canvas = ref<HTMLCanvasElement | null>(null);
let animationFrame: number | undefined;
let buffer: Float32Array;

function draw() {
  const ctx = canvas.value!.getContext("2d");
  if (ctx === null) {
    animationFrame = window.requestAnimationFrame(draw);
    return;
  }
  const offsetWidth = canvas.value!.offsetWidth;

  const analyser = props.analyser!;
  const numSamples = analyser.fftSize;

  ctx.lineWidth = (props.lineWidth * props.width) / offsetWidth;
  ctx.strokeStyle = props.strokeStyle;
  ctx.clearRect(-0.5, -0.5, props.width + 1, props.height + 1);
  ctx.beginPath();

  const dx = props.width / numSamples;
  props.analyser!.getFloatTimeDomainData(buffer);
  ctx.moveTo(0, props.height * 0.5 * (1 - buffer[0]));
  for (let i = 1; i < numSamples; ++i) {
    const x = dx * i;
    const y = props.height * 0.5 * (1 - buffer[i]);
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  animationFrame = window.requestAnimationFrame(draw);
}

function initialize(analyser?: AnalyserNode) {
  if (analyser === undefined) {
    if (props.analyser === null) {
      return;
    }
    analyser = props.analyser;
  }

  buffer = new Float32Array(analyser.fftSize);

  const ctx = canvas.value!.getContext("2d");
  if (ctx !== null) {
    // Move origin to the middle of a pixel
    ctx.translate(0.5, 0.5);
    animationFrame = window.requestAnimationFrame(draw);
  }
}

onMounted(initialize);

onUnmounted(() => {
  if (animationFrame !== undefined) {
    window.cancelAnimationFrame(animationFrame);
  }
});
</script>

<template>
  <canvas ref="canvas" :width="width" :height="height"> </canvas>
</template>
