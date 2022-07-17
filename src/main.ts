import { createApp } from "vue";
import App from "@/App.vue";
import router from "@/router";

// There should be only one audio context for the lifetime of the whole application
// so we define it here, outside of hot reloading.
const audioContext = new window.AudioContext({ latencyHint: "interactive" });

const app = createApp(App, { audioContext });

app.use(router);

app.mount("#app");
