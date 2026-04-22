import qs from 'qs'
import {
  createRouter,
  createWebHistory,
  type LocationQuery,
  type RouteLocationNormalized
} from 'vue-router'
import ScaleView from '../views/ScaleView.vue'

/**
 * Query-string parser wrapper that coerces `qs.parse` output into `LocationQuery`
 * after verifying no key has an `undefined` value.
 */
function qsParse(query: string) {
  const result = qs.parse(query)
  Object.keys(result).forEach((key) => {
    const value = result[key]
    if (value === undefined) {
      throw new Error('Failed to parse query string')
    }
  })
  return result as LocationQuery
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  parseQuery: qsParse,
  stringifyQuery: qs.stringify,
  routes: [
    {
      path: '/',
      name: 'scale',
      component: ScaleView
    },
    {
      path: '/about',
      name: 'about',
      // Route-level code splitting for static content views.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/scale/:id',
      name: 'load-scale',
      component: () => import('../views/LoadScaleView.vue')
    },
    {
      path: '/privacy-policy',
      name: 'privacy-policy',
      component: () => import('../views/PrivacyPolicy.vue')
    },
    {
      path: '/terms-of-service',
      name: 'terms-of-service',
      component: () => import('../views/TermsOfService.vue')
    },
    {
      path: '/analysis',
      name: 'analysis',
      component: () => import('../views/AnalysisView.vue')
    },
    {
      path: '/lattice',
      name: 'lattice',
      component: () => import('../views/LatticeView.vue')
    },
    {
      path: '/midi',
      name: 'midi',
      component: () => import('../views/MidiView.vue')
    },
    {
      path: '/prefs',
      name: 'preferences',
      component: () => import('../views/PreferencesView.vue')
    },
    {
      path: '/synth',
      name: 'synth',
      component: () => import('../views/SynthView.vue')
    },
    {
      path: '/vk',
      name: 'virtualKeyboard',
      component: () => import('../views/VirtualKeyboardView.vue')
    },
    {
      path: '/qwerty',
      name: 'qwerty',
      component: () => import('../views/VirtualQwerty.vue')
    },
    {
      path: '/mos',
      name: 'mos',
      component: () => import('../views/MosView.vue')
    },
    // Root aliases for compatibility with legacy SW1 URLs.
    {
      path: '/index.html',
      redirect: '/'
    },
    {
      path: '/index.htm',
      redirect: '/'
    },
    // Catch-all not-found route.
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

/**
 * Returns whether a route has any query parameters.
 */
function hasQueryParams(route: RouteLocationNormalized) {
  return !!Object.keys(route.query).length
}

/**
 * Returns wheter a route has any hash parameters.
 */
function hasHash(route: RouteLocationNormalized) {
  return !!route.hash.length
}

router.beforeEach((to, from) => {
  if (to.name == null || to.name === 'load-scale' || from.name === 'load-scale') {
    return
  }

  const shouldCarryQuery = !hasQueryParams(to) && hasQueryParams(from)
  const shouldCarryHash = !hasHash(to) && hasHash(from)

  if (shouldCarryQuery || shouldCarryHash) {
    return {
      path: to.path,
      query: shouldCarryQuery ? from.query : to.query,
      hash: shouldCarryHash ? from.hash : to.hash
    }
  }
})

export default router
