<script setup lang="ts">
import { watch } from 'vue'
import { useStateStore } from '@/stores/state'
import Vex from 'vexflow'

const state = useStateStore()
const { Factory, BarlineType } = Vex.Flow


function getChordOctave(note: string) {
  return parseInt(note.match(/\d+$/)?.[0] || '', 10)
}

function isTrebleClef(note: string | undefined) {
  if (!note) return false

  return getChordOctave(note) >= 4
}

function convertChordToString(chord: string[]) {
  if (chord.length > 1) return '(' + chord.join(' ') + ')/w'
  if (chord.length == 1) return chord[0] + '/w'
  return ''
}

function refreshScore(chord: string[]) {
  const vf = new Factory({
    renderer: { elementId: 'chordView', width: 160, height: 160 }
  })
  vf.context.scale(0.75, 0.75)

  let trebleChord = []
  let bassChord = []
  for (const note of chord) {
    if (isTrebleClef(note)) trebleChord.push(note)
    else bassChord.push(note)
  }

  const score = vf.EasyScore()
  const system = vf.System({ width: 160, spaceBetweenStaves: 8.5 })
  const trebleTextChord = convertChordToString(trebleChord)
  const bassTextChord = convertChordToString(bassChord)

  // We just skipp if there is no notation
  if (!trebleTextChord && !bassTextChord) return

  try {
    if (trebleTextChord) {
      system
        .addStave({
          voices: [score.voice(score.notes(trebleTextChord))]
        })
        .addClef('treble')
        .setEndBarType(BarlineType.DOUBLE)
    }

    if (bassTextChord) {
      system
        .addStave({
          voices: [score.voice(score.notes(bassTextChord, { clef: 'bass' }))]
        })
        .addClef('bass')
        .setEndBarType(BarlineType.DOUBLE)
    }
    system.addConnector()
    vf.draw()
  } catch (error) {
    const chordView = document.getElementById('chordView')
    chordView.innerHTML =
      '<div class="error-msg"><i>Oops!</i><br/>The given symbol might not be a valid <i>Vexflow</i> label.</div>'
  }
}

watch(
  () => Array.from(state.scoreChord),
  (newValue) => {
    const chordView = document.getElementById('chordView')
    chordView.innerHTML = ''

    if (!newValue[0]) return

    if (newValue.length > 0) {
      refreshScore(newValue)
    }
  }
)
</script>

<template>
  <div id="chordView"></div>
</template>

<style>
#chordView {
  position: fixed;
  z-index: 1;
  right: 6px;
  top: 10px;
  pointer-events: none;
}
svg {
  background-color: gainsboro;
  opacity: 90%;
  border: 2px solid lightslategray;
  border-radius: 15px;
}

.error-msg {
  color: rgb(102, 6, 104);
  background-color: gainsboro;
  width: 160px;
  height: 160px;
  opacity: 90%;
  border: 2px solid lightslategray;
  border-radius: 15px;
  padding: 15px;
  padding-top: 30px;
  text-align: center;
  line-height: 1.3;
}
</style>
