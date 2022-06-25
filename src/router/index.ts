import qs from "qs";
import {
  createRouter,
  createWebHistory,
  type LocationQuery,
  type RouteLocationNormalized,
} from "vue-router";
import ScaleView from "../views/ScaleView.vue";

// Boilerplate to resolve minor type incompatibility
function qsParse(query: string) {
  const result = qs.parse(query);
  Object.keys(result).forEach((key) => {
    const value = result[key];
    if (value === undefined) {
      throw new Error("Failed to parse query string");
    }
  });
  return result as LocationQuery;
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  parseQuery: qsParse,
  stringifyQuery: qs.stringify,
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

// Preserve query parameters on router navigation
// https://stackoverflow.com/a/47195471

function hasQueryParams(route: RouteLocationNormalized) {
  return !!Object.keys(route.query).length;
}

router.beforeEach((to, from, next) => {
  if (to.name == null) {
    next();
  } else if (!hasQueryParams(to) && hasQueryParams(from)) {
    next({ name: to.name, query: from.query });
  } else {
    next();
  }
});

export default router;
