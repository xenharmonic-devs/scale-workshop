import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/scale.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/analysis",
      name: "analysis",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/analysis.vue"),
    },
    {
      path: "/vk",
      name: "vk",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/virtualkeyboard.vue"),
    },
    {
      path: "/synth",
      name: "synth",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/synth.vue"),
    },
    {
      path: "/midi",
      name: "midi",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/midi.vue"),
    },
    {
      path: "/prefs",
      name: "prefs",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/preferences.vue"),
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/scaleworkshop.vue"),
    },
    {
      path: "/guide",
      name: "guide",
      // route level code-splitting
      // this generates a separate chunk (Guide.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/userguide.vue"),
    },
  ],
});

export default router;
