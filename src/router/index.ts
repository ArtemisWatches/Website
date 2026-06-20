import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Missing from '../views/Missing.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard,
      meta: { title: 'Dashboard' },
    },
    {
      path: '/data-sources',
      name: 'Data Sources',
      component: Missing,
      meta: { title: 'Data Sources' },
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Missing,
      meta: { title: 'Settings' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'Missing',
      component: Missing,
      meta: { title: 'Page Not Found' },
    },
  ],
})

export default router
