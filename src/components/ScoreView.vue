<script setup lang="ts">
import { watch } from 'vue';
import { useStateStore } from '@/stores/state'
import Vex from 'vexflow';


const state = useStateStore()
const { Factory, BarlineType } = Vex.Flow;

function isTrebleClef(chord: string){
    const number = Number(chord.charAt(chord.length-1))
    if(number >= 4) return true
    return false
}

function isBassClef(chord: string){
    const number = Number(chord.charAt(chord.length-1))
    if(number < 4) return true
    return false
}

function chordArray2chordString(chordArray: string[]){
    if(chordArray.length > 1) return '(' + chordArray.join(' ') + ')/w'
    if(chordArray.length == 1) return chordArray[0] + '/w'
    return ''
}

function refreshScore(chordArray: string[]){
    const vf = new Factory({
        renderer: { elementId: 'chordView', width: 160, height: 160 },
    })
    vf.context.scale(0.75, 0.75)

    let chordArrayTreble = []
    let chordArrayBass = []
    for(const item of chordArray){
        if(isTrebleClef(item)) chordArrayTreble.push(item)
        if(isBassClef(item)) chordArrayBass.push(item)
    }

    const score = vf.EasyScore()
    const system = vf.System({width: 160, spaceBetweenStaves: 8.5})
    const chordStringTreble = chordArray2chordString(chordArrayTreble)
    const chordStringBass = chordArray2chordString(chordArrayBass)    
    try{
        if(chordStringTreble){
            system.addStave({
                voices: [
                    score.voice(score.notes(chordStringTreble)),
                ],
            }).addClef('treble').setEndBarType(BarlineType.DOUBLE);
        }

        if(chordStringBass){
            system.addStave({
                voices: [
                    score.voice(score.notes(chordStringBass, {clef: 'bass'})),
                ],
            }).addClef('bass').setEndBarType(BarlineType.DOUBLE)
        }
        system.addConnector()
        vf.draw()
    } 
    catch(error){ 
        //
    }
};

watch(state.scoreChord, (newValue)=>{
    const chordView = document.getElementById('chordView')
    chordView.innerHTML = '';
    if(newValue.length > 0){
        refreshScore(newValue)
    }
})
</script>


<template>
    <div id="chordView"></div>
</template>


<style>
#chordView {
    position:fixed;
    z-index: 1;
    right: 6px;
    top: 10px;
}

svg{
    background-color: gainsboro;
    opacity: 90%;
    border: 2px solid lightslategray;
    border-radius: 15px;
}
</style>