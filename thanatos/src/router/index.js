import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Login from '../components/Login.vue'
import HomePage from '../components/Homepage.vue' 
import Profile from '../components/Profile.vue'
import Learnmore from '../components/Learnmore.vue'
import Mentalhealth from '../components/Mentalhealth.vue'
import Physicalhealth from '../components/Physicalhealthpage.vue'
import PhysicalActivityRecomennder from '../components/PhysicalActivityRecomennder.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [ 
    { path: '/' , component: Login , meta: {title: 'Login', requiresAuth: false}},
    { path: '/home' , component: HomePage , meta: {title: 'Home', requiresAuth: true}},
    { path: '/profile', component: Profile, meta: {title: 'Profile', requiresAuth: true}},
    { path: '/learnmore', component: Learnmore, meta: {title: 'Learn More', requiresAuth: true}},
    { path: '/mental-health', component: Mentalhealth, meta: {title: 'Mental Health', requiresAuth: true}},
    { path: '/physical-health', component: Physicalhealth, meta: {title: 'Physical Health', requiresAuth: true}},
    {path: '/physical-activity-recommendation' , component: PhysicalActivityRecomennder , meta: {title: 'Recommendation' , requiresAuth: true}}
  ],
})

router.beforeEach((to, from) => {
  const authStore = useAuthStore()
  document.title = to.meta.title || "Invalid"

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/'
  }

  if (authStore.isAuthenticated && to.path === '/') {
    return '/home'
  }

  return true
})

export default router 
