import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueGridLayout from 'vue-grid-layout-v3'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueGridLayout)

app.mount('#app')
