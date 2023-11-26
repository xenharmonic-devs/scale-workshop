otonalFundamental
<script setup lang="ts">
import { otonalFundamental, utonalFundamental } from "@/analysis";
import type { VirtualSynth } from "@/virtual-synth";
import { onMounted, onUnmounted, ref } from "vue";
import { clamp } from "xen-dev-utils";

const NUM_SAMPLES = 512;

const props = defineProps<{
  type: "otonal" | "utonal";
  virtualSynth: VirtualSynth;
  maxChordRoot: number;
  width: number;
  height: number;
  lineWidth: number;
  strokeStyle: string;
  textColor: string;
  backgroundRBG: [number, number, number];
  fadeAlpha: number;
  shadowBlur: number;
}>();

const canvas = ref<HTMLCanvasElement | null>(null);
let audioTimeOffset = NaN;
// eslint-disable-next-line no-undef
let previousTime: DOMHighResTimeStamp = 0;
let theta = 0;
let frameIndex = 0;
const buffers = [
  new Float32Array(NUM_SAMPLES),
  new Float32Array(NUM_SAMPLES),
  new Float32Array(NUM_SAMPLES),
  new Float32Array(NUM_SAMPLES),
];
const thetas = Array(buffers.length).fill(0);

let animationFrame: number | undefined;

// eslint-disable-next-line no-undef
function draw(time: DOMHighResTimeStamp) {
  let start = previousTime / 1000;
  let end = time / 1000;
  previousTime = time;
  start = clamp(end - 0.1, end - 0.0001, start);
  frameIndex++;

  const synth = props.virtualSynth;

  if (isNaN(audioTimeOffset)) {
    audioTimeOffset = synth.audioContext.currentTime - end;
  }
  start += audioTimeOffset;
  end += audioTimeOffset;

  const ctx = canvas.value!.getContext("2d");
  if (ctx === null) {
    animationFrame = window.requestAnimationFrame(draw);
    return;
  }

  const width = props.width;
  const height = props.height;
  const size = Math.min(width, height);

  // Gradual fadeout of previous renders.
  const [red, green, blue] = props.backgroundRBG;
  // Blend with small alpha leaves a ghost image that we need to get rid of.
  if (
    props.fadeAlpha &&
    props.fadeAlpha < 0.25 &&
    frameIndex % Math.round(1 / props.fadeAlpha) === 0
  ) {
    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.25)`;
  } else {
    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${props.fadeAlpha})`;
  }
  ctx.fillRect(-1, -1, width + 1, height + 1);

  if (!synth.voices.length) {
    animationFrame = window.requestAnimationFrame(draw);
    return;
  }

  // Render a chord wheel that appears to move based on how
  // disconcordant the voices are compared to a pure enumerated chord.
  const offsetWidth = canvas.value!.offsetWidth;
  ctx.lineWidth = (props.lineWidth * props.width) / offsetWidth;
  ctx.strokeStyle = props.strokeStyle;
  // Blurring the lines reduces "dead pixels" that don't happen
  // to get updated when the chord wheel appears to rotate fast.
  if (props.shadowBlur) {
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = props.strokeStyle;
    ctx.shadowBlur = ctx.lineWidth * props.shadowBlur;
  }

  synth.getTimeDomainData(start, end, buffers);

  const frequencies = synth.voices.map((voice) => voice.frequency);
  let chord: string[];
  const numActive = Math.min(synth.voices.length, buffers.length);

  if (props.type === "otonal") {
    const fundamental = otonalFundamental(frequencies, props.maxChordRoot);
    const deltaTheta = 2 * Math.PI * (end - start) * fundamental;
    for (let i = 0; i < numActive; ++i) {
      ctx.beginPath();
      for (let j = 0; j < NUM_SAMPLES; ++j) {
        const phi = theta + (deltaTheta * j) / NUM_SAMPLES;
        const r = (i + 0.9 + buffers[i][j] * 0.45) * size * 0.15;
        const x = width * 0.5 + Math.sin(phi) * r;
        const y = height * 0.5 + Math.cos(phi) * r;
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    theta += deltaTheta;

    chord = frequencies.map((frequency) =>
      Math.round(frequency / fundamental).toString()
    );
  } else {
    const fundamental = utonalFundamental(frequencies, props.maxChordRoot);
    for (let i = 0; i < numActive; ++i) {
      const deltaTheta =
        (2 * Math.PI * (end - start) * frequencies[i] ** 2) / fundamental;
      ctx.beginPath();
      for (let j = 0; j < NUM_SAMPLES; ++j) {
        const phi = thetas[i] + (deltaTheta * j) / NUM_SAMPLES;
        const r = (numActive - 0.1 - i + buffers[i][j] * 0.45) * size * 0.15;
        const x = width * 0.5 + Math.sin(phi) * r;
        const y = height * 0.5 + Math.cos(phi) * r;
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      thetas[i] += deltaTheta;
    }
    chord = frequencies.map((frequency) =>
      Math.round(fundamental / frequency).toString()
    );
  }
  if (props.shadowBlur) {
    ctx.shadowColor = "rgba(0, 0, 0, 0)";
    ctx.shadowBlur = 0;
  }

  // Render numbers indicating the implied enumerated chord.
  ctx.font = `${size / 10}px sans-serif`;
  ctx.fillStyle = props.textColor;
  let text;
  if (props.type === "otonal") {
    text = chord.join(":");
  } else {
    text = "1/(" + chord.join(":") + ")";
  }
  const textWidth = ctx.measureText(text).width;
  if (textWidth * 10 < width * 8) {
    ctx.fillText(text, size / 10, size / 10);
  } else {
    const fontSize = (size / 11) * (width / textWidth);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillText(text, size / 20, size / 10);
  }

  animationFrame = window.requestAnimationFrame(draw);
}

onMounted(() => {
  const ctx = canvas.value!.getContext("2d");
  if (ctx !== null) {
    // Move origin to the middle of a pixel
    ctx.translate(0.5, 0.5);
    animationFrame = window.requestAnimationFrame(draw);
  }
});

onUnmounted(() => {
  if (animationFrame !== undefined) {
    window.cancelAnimationFrame(animationFrame);
  }
  audioTimeOffset = NaN;
});
</script>

<template>
  <canvas ref="canvas" :width="width" :height="height"> </canvas>
</template>
