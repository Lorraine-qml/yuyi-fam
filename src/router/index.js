import { createRouter, createWebHistory } from 'vue-router'
import RiskDashboard from '@/views/risk/RiskDashboard.vue'

const routes = [
  {
    path: '/',
    redirect: '/risk/dashboard'
  },
  {
    path: '/risk/dashboard',
    name: 'RiskDashboard',
    component: RiskDashboard
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
