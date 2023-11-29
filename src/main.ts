import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "@/router";

// Hack to bypass Vue state management for real-time gains in table row highlighting.
(window as any).TUNING_TABLE_ROWS = Array(128);

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");
