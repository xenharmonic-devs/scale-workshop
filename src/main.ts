import { createApp } from "vue";
import App from "@/App.vue";
import router from "@/router";
import { initializeCustomWaveforms } from "./synth";

// There should be only one audio context for the lifetime of the whole application
// so we define it here, outside of hot reloading.
const audioContext = new window.AudioContext({ latencyHint: "interactive" });

// Currently we get a warning:
// "An AudioContext was prevented from starting automatically. It must be created or resumed after a user gesture on the page."
// We could jump through a few app complicating hoops to prevent that, but we settle for suspension and resume after a user gesture.
audioContext.suspend();

// Custom waveforms need to be initialized only once.
initializeCustomWaveforms(audioContext);

const app = createApp(App, { audioContext });

app.use(router);

app.mount("#app");
