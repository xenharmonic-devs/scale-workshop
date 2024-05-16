import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'
import { API_URL } from './constants'

if (import.meta.env.DEV) {
  if (API_URL) {
    fetch(API_URL)
      .then((res) => res.text())
      .then((body) => {
        if (!body.includes('Scale Workshop server')) {
          console.warn('VITE_API_URL responded with foreign data.')
          console.log(body)
        } else {
          console.info('VITE_API_URL responded. Scale URLs should work.')
        }
      })
      .catch((err) => {
        console.warn('VITE_API_URL did not respond. Is sw-server running?')
        console.error(err)
      })
  } else {
    console.warn('VITE_API_URL not configured. Scale URLs will not work.')
  }
}

if (!localStorage.getItem('uuid')) {
  localStorage.setItem('uuid', crypto.randomUUID())
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
