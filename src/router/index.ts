import { createRouter, createWebHistory } from "vue-router";
import ScaleView from "../views/ScaleView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "scale",
      component: ScaleView,
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/analysis",
      name: "analysis",
      component: () => import("../views/AnalysisView.vue"),
    },
    {
      path: "/midi",
      name: "midi",
      component: () => import("../views/MidiView.vue"),
    },
    {
      path: "/prefs",
      name: "preferencess",
      component: () => import("../views/PreferencesView.vue"),
    },
    {
      path: "/synth",
      name: "synth",
      component: () => import("../views/SynthView.vue"),
    },
    {
      path: "/guide",
      name: "userGuide",
      component: () => import("../views/UserGuideView.vue"),
    },
    {
      path: "/vk",
      name: "virtualKeyboard",
      component: () => import("../views/VirtualKeyboardView.vue"),
    },
  ],
});
export default router;
