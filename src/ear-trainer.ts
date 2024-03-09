import { useScaleStore } from '@/stores/scale'
import { useAudioStore } from './stores/audio';
import { Interval } from 'sonic-weave'

const scale = useScaleStore();
const sound = useAudioStore();

export enum TrainerMode {
    FixedIntervals      = "fixed-intervals",    // Play N amount of intervals starting with root
    AnyInterval         = "any-interval"        // Play N amount of intervals
    // FreePitch           = "free-pitch"       // 
}

export class TrainerOptions {
    mode:TrainerMode = TrainerMode.FixedIntervals;
    
    numPitches = 2;

    rootLowestFrequency = 80;
    rootHighestFrequency = 5000;

    periodsUnderRoot = 0;
    periodsOverRoot = 1;

    skipPeriods = false;
    numPeriods = 1; // Range of mystery intervals above fundamental
    // todo make more flexible?

    numRounds = 10;

    numSessionRetries = 0;
    numRoundRetries = 0;

    constructor(mode:TrainerMode=TrainerMode.FixedIntervals) {
        this.mode = mode;
    }

    setRootFrequencyRange(lowestFrequency:number, highestFrequency:number) {
        if (lowestFrequency <= 0)
            throw new Error("Invalid lowest frequency argument.");

        this.rootLowestFrequency = lowestFrequency;

        if (highestFrequency < lowestFrequency)
            throw new Error("Highest frequency cannot be lower than lowest frequency.");

        // todo base off of nyquist and period
        if (highestFrequency >= 10000)
            throw new Error("Last period of scale must fit below nyquist");

        this.rootHighestFrequency = highestFrequency;
    }

    // setSessionTime(timeInSeconds:number) {
    //     if (timeInSeconds < 0)
    //         throw new Error("Session time cannot be negative");

    //     this.timeInSeconds = timeInSeconds
    // }

    setNumTonesAboveRoot(n:number) {
        if (n <= 0)
            throw new Error("Must have at least 1 tone above root")

        if (n > 10) // enforce upper limit??
            throw new Error("Requested number of tones is not supported");

        this.numPitches = n;
    }
}


export class TrainerRound {
    options:TrainerOptions;
    points = 0;
    
    startTime = 0;
    endTime = 0;

    rootFreq = 0;
    intervals:Interval[] = [];
    frequencies:number[] = [];

    noteOffHandles:{():void}[] = [];

    submittedAnswer:Interval[] | undefined;
    wrongAttempts:number | undefined;

    constructor(options:TrainerOptions, rootFrequency:number, intervals:Interval[]) {
        this.options = options;
        this.rootFreq = rootFrequency;
        this.intervals = intervals;
        this.frequencies = intervals.map((i:Interval) => this.rootFreq * i.valueOf());
    }

    getRoundOptions() : TrainerOptions {
        if (this.options === undefined)
            throw new Error("Malformed round: missing options");
        return this.options;
    }

    isEquivalentTo(round:TrainerRound) {
        if (this.rootFreq != round.rootFreq)
            return false;
        if (this.intervals.length != round.intervals.length)
            return false;

        // for (let i = 0; i < this.intervals.length; i++) {
        //     const thisInterval = this.intervals[i];
        //     const compareInterval = round.intervals[i];
        //     if (!thisInterval.equals(compareInterval))
        //         return false;
        // }
        for (let i = 0; i < this.frequencies.length; i++) {
            const thisFreq = this.frequencies[i];
            const otherFreq = round.frequencies[i];
            if (thisFreq !== otherFreq)
                return false;
        }
        return true;
    }

    stopTones() {
        while (this.noteOffHandles.length > 0) {
            const noteOff = this.noteOffHandles.shift();
            if (noteOff)
                noteOff();
            else
                console.error('missing noteOff handle')
        }
    }

    playTones() {
        console.log('playing hertz: ', this.frequencies);
        for (const freq of this.frequencies) {
            const noteOff = sound.synth?.noteOn(freq, 0.5);
            if (noteOff)
                this.noteOffHandles.push(noteOff);
            else 
                throw new Error("Could not get noteOff callback for frequency: " + freq);
        }
    }

    // play tones and start count
    start() {
        // console.log(`starting round: ${this.tones[0].cents} + ${this.tones[1].cents}`);
        this.playTones();
        this.startTime = (new Date).valueOf();
    }

    // Return whether or not this is the correct answer
    submitAnswer(input:Interval[]) : boolean {
        this.submittedAnswer = input;
        this.submittedAnswer.sort((a:Interval, b:Interval) => a.compare(b));

        let errorCents = 0;

        const expectedIntervals = [...this.intervals];
        if (this.options.mode === TrainerMode.FixedIntervals)
            expectedIntervals.shift(); // Remove root;
        
        for (let i = 0; i < expectedIntervals.length; i++)
        {
            const interval = expectedIntervals[i];
            const inputInterval = this.submittedAnswer[i];
            if (inputInterval === undefined) {
                errorCents = interval.totalCents();
            }
            else {
                const discrepancy = interval.div(inputInterval).totalCents();
                errorCents += Math.abs(discrepancy);
            }
        }

        if (this.wrongAttempts === undefined)
            this.wrongAttempts = 0;

        const isCorrect = errorCents === 0;
        if (!isCorrect) {
            const answerPoints = Math.round(errorCents / 120.0);
            this.points += answerPoints;
            this.wrongAttempts++;
        }

        return isCorrect;
    }

    replay() {
        this.playTones();
        this.points += 1;
    }

    finish() {
        this.endTime = (new Date).valueOf();
        this.stopTones();
    }

    getDuration() : number {
        if (this.startTime === 0 || this.endTime === 0)
            return 0;
        return this.endTime - this.startTime;
    }

    getPointsFromDurationMs() : number {
        if (this.submittedAnswer === undefined)
            return 0;
        return Math.floor(this.getDuration() / 5000); // 1 point per 5 sec
    }

    getNumWrongAttempts() : number {
        if (this.wrongAttempts === undefined)
            return 0;
        return this.wrongAttempts;
    }
}

export class SessionStats {
    completedRounds:TrainerRound[] = [];
    durationMs:number = 0;
    points:number = 0;
    wrongAnswers:number = 0;

    constructor(completedRounds:TrainerRound[] = []) {
        for (const round of completedRounds) {
            this.addRound(round);
        }
    }

    addRound(round:TrainerRound) {
        this.completedRounds.push(round);

        this.durationMs += round.getDuration()
        this.points += round.points + round.getPointsFromDurationMs();
        this.wrongAnswers += round.getNumWrongAttempts();
    }

    numCorrect() {
        return this.completedRounds.map((round:TrainerRound) => round.wrongAttempts === 0 ? 1 : 0)
                                   .reduce((correct:number, sum:number) =>  sum + correct, 0);
    }
}

export class TrainerSession {

    options:TrainerOptions = new TrainerOptions();

    intervals:Interval[] = [];

    rounds:TrainerRound[] = [];
    currentRoundIndex : number | undefined;

    stats:SessionStats = new SessionStats();

    constructor(options:TrainerOptions) {
        this.options = options;

        console.log('trainer session, using these options:')
        console.log(this.options);
        this.initializeIntervals();
    }


    initializeIntervals() {
        console.log('scale intervals: ', scale.relativeIntervals.map((i:Interval)=>i.toString()).join(', '));

        const scaleIntervals:Interval[] = [...scale.relativeIntervals];

        switch (this.options.mode) {
            // case TrainerMode.AnyInterval:
            //     // For this we need all possible dyads
            //     this.intervals = allUniqueIntervals(scaleIntervals)
            //     break;

            default:
                // For these we only need a list of the scale
                this.intervals = scaleIntervals;
                // this.intervals.splice(this.intervals.length - 1, 1, Interval.fromInteger(scale.scale.equaveRatio));
                break;
        }


        console.log('unique intervals', this.intervals.map((i:Interval)=>i.toString()).join(', '));
    }

    createPolyFixedRound() : TrainerRound {
        const intervals:Interval[] = [];
        const degrees:number[] = [];

        const numPitches = this.options.numPitches;
        if (this.options.mode === TrainerMode.FixedIntervals)
        {
            intervals.push(Interval.fromInteger(1));
        }
        
        const possibleIntervals = [ ...this.intervals ];

        while (intervals.length < numPitches && intervals.length < possibleIntervals.length) {
            const degree = Math.floor((Math.random() * possibleIntervals.length * 1e6) * 1e-6);
            if (!degrees.includes(degree))
            {
                const interval = possibleIntervals[degree];
                // console.log('add interval to round: ', interval.toString());
                intervals.push(interval);
                degrees.push(degree);
            }
        }

        intervals.sort((a:Interval, b:Interval) => a.compare(b));

        const round = new TrainerRound(this.options, scale.userBaseFrequency, intervals);
        return round;
    }

    // createFreePitchRound() {
    //     this.intervals = [];
    //     for (let i = 0; i < this.getNumPitches(); i++)
    //     {
    //         const ratio = Math.random() + 1;
    //         const interval = Interval.fromInteger(ratio);
    //         this.intervals.push(interval);
    //     }
        
    //     this.intervals.sort((a:Interval, b:Interval) => a.compare(b));

    //     const root = this.intervals[0].valueOf() * scale.userBaseFrequency;
    //     const round = new TrainerRound(this.options, root, this.intervals);
    //     return round;
    // }

    createRound() : TrainerRound {
        switch (this.options.mode) {
            case TrainerMode.FixedIntervals:
            case TrainerMode.AnyInterval:
                return this.createPolyFixedRound();
            default:
                throw new Error('Root Mode not implemented: ' + this.options.mode);
        }
    }

    getRoundPossibleAnswers(round?:TrainerRound) : Interval[] {
        // todo - other modes ?
        // if (round === undefined)
        //     round = this.getRound();
        return this.intervals;
    }
 
    setupRounds() {
        this.rounds = [];
        console.log('creating ' + this.options.numRounds + ' rounds')
        for (let i = 0; i < this.options.numRounds; i++) {
            let round = this.createRound();
            // console.log('created round:', round)
            console.log('created round:', round.frequencies)

            const lastRound = this.rounds[this.rounds.length - 1];
            if (lastRound && this.intervals.length > 1) { // avoid infinite loop for one-note scales
                while (round.isEquivalentTo(lastRound)) {
                    round = this.createRound();
                }
            }

            this.rounds.push(round);
        }
    }

    nextRound() {
        if (this.currentRoundIndex === undefined)
        {
            this.currentRoundIndex = -1;
        }
        return this.rounds[++this.currentRoundIndex];
    }

    getRound() {
        if (this.currentRoundIndex !== undefined)
            return this.rounds[this.currentRoundIndex];
    }

    start() {
        // this.clearStats();
        this.setupRounds();
        const round = this.nextRound();
        if (round === undefined) {
            throw new Error("No round found!");
        }

        round.start()
    }

    submitAnswer(input:Interval[]) {
        if (this.currentRoundIndex == null) {
            throw new Error('No current round to finish!');
        }
        
        const correct = this.getRound()?.submitAnswer(input) || false;
        console.log((correct) ? 'Correct, nice!' : 'Sorry...not quite.');

        // todo option to continue or retry
        this.finishRound();
    }

    getCurrentScore() {
        return this.stats.points;
        // const finishedRounds = this.rounds.filter((round) => round.endTime > 0);
        // const interactionPoints = finishedRounds.reduce((score, round) => score + round.points, 0);

        // // Filter out durations less than 5 seconds
        // const roundDurations = finishedRounds.map((round) => round.endTime - round.startTime).filter((duration) => duration > 5000);

        // const totalDuration = roundDurations.reduce((total, duration) => total + duration, 0);
        // const durationPoints =  this.getPointsFromDurationMs(totalDuration);
        // return interactionPoints + durationPoints;
    }

    finish() {
        const score = this.getCurrentScore();
        console.log(`You scored ${score} points!`);
        // jQuery('#ear-trainer-preview').text(`You scored ${score} points!`);
    }

    finishRound() {
        if (this.currentRoundIndex === undefined)
        {
            throw new Error("No round to finish!")
        }

        const finishedRound = this.getRound();
        if (finishedRound === undefined)
            throw new Error("Round is missing!");

        finishedRound.finish();

        if (this.currentRoundIndex >= this.options.numRounds) {
            this.finish();
        } else {
            this.nextRound()?.start();
        }

        this.stats.addRound(finishedRound);
        console.log(this.stats);
    }

    // isFinished() {
    //     return this.currentRoundIndex !== undefined 
    //         && this.currentRoundIndex >= this.rounds.length;
    // }
}

