<script setup lang="ts">
import { Scale } from '@/scale';
import { Interval } from 'sonic-weave';
import { TrainerOptions, TrainerSession, TrainerRound } from '@/ear-trainer';
import { computed, ref, watch } from 'vue'
import { useScaleStore } from '@/stores/scale';

function roundCents(cents:number) {
    return Math.round(cents * 1e3) / 1e3;
}

function roundMsToSeconds(ms:number, precision=0) {
    const roundFactor = Math.pow(10, precision);
    return Math.round(ms / 1000 * roundFactor) / roundFactor;
}

const scale = useScaleStore();
const baseFrequency = computed(() => Math.round(scale.scale.baseFrequency * 1e3) / 1e3);

const currentSession = ref<TrainerSession|undefined>();

const currentSessionMode = computed(() => currentSession.value?.options.mode);
const currentRoundIndex = computed(() => currentSession.value?.currentRoundIndex ?? -1);
const currentRound = computed(() => currentSession.value?.getRound());
const currentStats = computed(() => currentSession.value?.stats);

const possibleAnswers = computed(() => {
    if (currentSession.value === undefined)
        return [] as Interval[];
    return currentSession.value.getRoundPossibleAnswers();
})

const playingTones = computed(() => {
    if (currentSession.value === undefined)
        return false;
    const tones = currentSession.value.getRound()?.noteOffHandles.length ?? 0;
    return tones > 0;
})

const timeOptions = [
    { text: "30 seconds", value: 30 },
    { text: "1 minute", value: 60 },
    { text: "1.5 minutes", value: 90 },
    { text: "3 minutes", value: 180 },
    { text: "5 minutes", value: 300 },
];
const timeLimitSeconds = ref(timeOptions[3]);

const numRounds = ref(10);
const numRoundOptions = [ 5, 10, 15, 20, 25, 30, 50, 75, 100 ];

const timerStart = ref<Date | undefined>();
const timerEnd = ref<Date | undefined>();
const sessionTimerHandle = ref<NodeJS.Timeout|undefined>();

const sessionRunning = computed(() => {
    return sessionTimerHandle.value !== undefined;
})

const elapsedTime = computed(() => {
    if (timerStart.value !== undefined && timerEnd.value !== undefined) {
        return timerEnd.value.valueOf() - timerStart.value.valueOf();
    }
    return undefined;
})

const timeDisplay = computed(() => {
    const secondsLeft = timeLimitSeconds.value.value - roundMsToSeconds(elapsedTime.value ?? 0);
    const minutes = Math.floor(secondsLeft / 60);

    let secondsDisplay:number|string = Math.round(secondsLeft - (minutes * 60));
    if (secondsDisplay < 10)
        secondsDisplay = `0${secondsDisplay}`;

    return `${minutes}:${secondsDisplay}`;
})

const selectedMode = ref('fixed-intervals'); // todo make this an option

const sessionOptions = ref(new TrainerOptions());

watch(() => numRounds.value, (newValue) => {
    sessionOptions.value.numRounds = newValue;
    console.log('numRounds selected:', newValue);
});

function createNewSession() {
    if (currentSession.value)
        currentSession.value.finish();

    const options = new TrainerOptions();
    options.numRounds = numRounds.value;
    console.log(options)

    currentSession.value = new TrainerSession(options);
}

function submitAnswer(input:any) {
    const inputIntervals = [ input ]; // until N tones are implemented
    currentSession.value?.submitAnswer(inputIntervals);
}

const sessionFinished = computed(() => currentSession.value !== undefined
    && currentSession.value.currentRoundIndex !== undefined
    && currentSession.value.currentRoundIndex >= currentSession.value.rounds.length
);

const sessionFinishMessage = computed(() => {
    if (!sessionFinished.value)
        return "";

    if (currentSession.value === undefined)
        throw new Error("Session is missing!");

    const points = currentSession.value.stats.points;
    if (points < 0)
        return "Intervallic god, how are you beyond perfect??";

    if (points === 0)
        return "Excellent, you earned a perfect score!"

    if (points < 10)
        return "Great work, you're close to perfect!";

    if (points < 25)
        return "Good job, keep up the practice!";

    return "Don't fret - study up on the scale and you'll improve!"
})

const countdownSeconds = ref<number|undefined>();
const countdownHandle = ref<NodeJS.Timeout|undefined>();
function doSessionCountDown(seconds=3) {
    countdownSeconds.value = seconds

    if (seconds == 0) 
        {
        startCurrentSession();
        return;
        }

    countdownHandle.value = setTimeout(() => {
        doSessionCountDown(seconds - 1);
    }, 1000);
}

function createAndCountdownToSession() {
    createNewSession();
    doSessionCountDown(2);
}

const countdownRunning = computed(() => countdownSeconds.value !== undefined);

const sessionOptionsDisabled = computed(() => countdownRunning.value || sessionRunning.value);

function clearCountdownTimer() {
    if (countdownHandle.value) {
        clearTimeout(countdownHandle.value);
        countdownHandle.value = undefined;
    }

    countdownSeconds.value = undefined;
}

function stopSessionTimer() {
    if (sessionTimerHandle.value) {
        clearTimeout(sessionTimerHandle.value);
        sessionTimerHandle.value = undefined;
    }
}

function clearSessionTimer() {    
    stopSessionTimer();
    timerStart.value = undefined;
    timerEnd.value = undefined;
}

function startCurrentSession() {
    if (currentSession.value === undefined)
        throw new Error("No session created!");

    clearCountdownTimer();

    timerStart.value = new Date();
    timerEnd.value = timerStart.value;
    currentSession.value.start();

    sessionTimerHandle.value = setInterval(() => timerEnd.value = new Date(), 1000);
}

function cancelSession() {
    currentRound.value?.stopTones();

    clearCountdownTimer();
    clearSessionTimer();
}

function finishSession() {
    stopSessionTimer();
}

watch(() => sessionFinished.value,
      (newValue) => {
        if (newValue)
            finishSession();
      })

</script>

<template>
    <main>
      <div class="columns-container">
        <div class="column trainer-column">
          <h2 id="scale-name"> Training: {{ (scale.name || "Default Scale")  }}</h2>
          <div class="btn-group">
            <button id="fixed-interval" :disabled="sessionOptionsDisabled" @click="createAndCountdownToSession">Start Dyads Session</button>
            <!-- <button id="any-interval" @click="startCurrentSession">Any Intervals Mode</button> -->
            <button v-if="sessionOptionsDisabled" class="btn" @click="cancelSession">Cancel Session</button>
          </div>
          <div class="trainer-option-control-group">
            <div class="trainer-option-control">
                <label for="time-limit-select">Time Limit</label>
                <select v-model="timeLimitSeconds" id="time-limit-select">
                    <option v-for="(option) in timeOptions" :key="option.value" :value="option" :disabled="sessionOptionsDisabled"> 
                        {{ option.text }} 
                    </option>
                </select>
            </div>
            <div class="trainer-option-control">
                <label for="num-rounds-select">Rounds</label>
                <select v-model="numRounds" id="num-rounds-select">
                    <option v-for="(option) in numRoundOptions" :key="option" :disabled="sessionOptionsDisabled">
                        {{ option }}
                    </option>
                </select>
            </div>
        </div>
        <div class="trainer-option-control-group">
            <label>Base Frequency:</label>&nbsp;
            <span> {{ baseFrequency }}Hz </span>
        </div>
        <div v-if="currentSessionMode === 'fixed-intervals'">
            <label>Fixed Interval Mode:</label>
            <p>The root will always play. Select the other sounding tones in each round before the time limit ends.</p>
        </div>
        <div v-else-if="currentSessionMode === 'any-interval'">
            <label>Any Interval Mode:</label>
            <p>Any note from the scale will play. Select all sounding tones in each round before the time limit ends.</p>
        </div>
        <div class="control-group">
            <div>
                <h2>Scale data</h2>
                <div class="control">
                    <textarea readonly ref="sourceEditor" rows="17" v-model="scale.sourceText"></textarea>
                </div>
            </div>
        </div>
        </div>
        <div class="column trainer-column">
            <div v-if="countdownSeconds !== undefined">
                <h2>Session starting in {{ countdownSeconds }} seconds...</h2>
            </div>
            <div v-else-if="currentRound">
                <h2>Round {{ currentRoundIndex + 1 }}</h2>
                <div class="answer-btn-group">
                    <button class="answer-btn" v-for="ans of possibleAnswers" :key="ans.valueOf()" @click="submitAnswer(ans)">
                        {{ roundCents(ans.totalCents()) }}
                    </button>
                </div>
            </div>
            <div v-else>
                <h2>Waiting for session to start</h2>
            </div>
        </div>
        <div class="column trainer-column">
            <div id="timer">
                <h2>Training Stats</h2>
                <p>
                    Time Remaining:&nbsp;
                    <template v-if='sessionRunning'>{{ timeDisplay }}</template>
                    <template v-else><em>N/A</em></template>
                </p>
            </div>
            <div id="stats">
                <table id="stats-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Input</th>
                            <th>Answer</th>
                            <th>Correct</th>
                            <th>Duration</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(round, i) of currentStats?.completedRounds" :key="i" v-bind="round">
                        <td>Round {{ i + 1 }}</td>
                        <td>{{ round.submittedAnswer ? roundCents(round.submittedAnswer[0].totalCents()) + "c" : "None" }}</td>
                        <td>{{ roundCents(round.intervals.slice(1)[0].totalCents()) }}c</td>
                        <td>{{ (round.wrongAttempts === undefined || round.wrongAttempts === 0) ? "Yes" : "No" }}</td>
                        <td>{{ roundMsToSeconds(round.endTime.valueOf() - round.startTime.valueOf()) }} s</td>
                        <td>{{ round.points + round.getPointsFromDurationMs() }}</td>
                    </tr>
                    <tr></tr>
                    <tr v-if="sessionFinished">
                        <td>Total</td>
                        <td></td>
                        <td></td>
                        <td>{{ currentStats?.numCorrect() }}/{{ numRounds }}</td>
                        <td>{{ roundMsToSeconds(currentStats?.durationMs ?? 0, 1) }} s</td>
                        <td>{{ currentStats?.points }}</td>
                    </tr>
                    </tbody>
            </table>
            
            <!-- todo session history -->
            <!-- <table id="session-table">
                <thead>
                    <tr></tr>
                </thead>
            </table> -->

            </div>
            <div id="finish-message" v-if="sessionFinished">
                <h3>{{ sessionFinishMessage }}</h3>
            </div>
        </div>
      </div>
    </main>
</template>

<style scoped>
/* Content layout (small) */
div.columns-container {
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-border);
}
div.column {
  background-color: var(--color-background);
  overflow-x: hidden;
}

.trainer-column {
    padding: 1rem;
}

/* Content layout (medium) */
@media screen and (min-width: 600px) {
  div.columns-container {
    column-count: 2;
    column-gap: 1px;
    overflow: hidden;
  }
  div.column {
    overflow-y: auto;
  }
  div.scale-builder {
    width: 100%;
    height: 100%;
  }
  div.tuning-table {
    width: 100%;
    height: 66%;
  }
  div.exporters {
    width: 100%;
    height: 34%;
    border-top: 1px solid var(--color-border);
  }
}

/* Content layout (large) */
@media screen and (min-width: 1100px) {
  div.columns-container {
    column-count: 3;
  }
  div.column {
    height: 100%;
  }
  div.exporters {
    border: none;
  }
}

/* UI elements */
#scale-name {
  width: 100%;
  font-size: 1.4em;
  margin-bottom: 1rem;
  padding: 0.3rem;
  font-family: sans-serif;
  resize: vertical;
}

select optgroup + optgroup {
  margin-top: 1em;
}

.real-valued:invalid {
  background-color: var(--color-background);
}

.answer-btn-group {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.answer-btn {
    padding: 0.25rem 1.5rem 0.25rem 1.5rem;
    margin-bottom: 0.5rem;
    width: 75%;
    margin-left: 50%;
    margin-right: 50%;
}

.trainer-option-control-group {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    margin: 0.5rem 0rem 0.5rem 0rem;
    gap: 0.5rem;
}

div.trainer-option-control {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.trainer-option-control > select {
    width: 100%;
}

#timer {
    margin-bottom: 0.5rem;
}

table {
  width: 100%;
  text-align: center;
  border-spacing: 0px;
}
table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  font-weight: bold;
}
table table tr:nth-of-type(2n) {
  background-color: var(--color-background-soft);
}

#finish-message {
    text-align: center;
    margin-top: 1rem;
}

</style>
