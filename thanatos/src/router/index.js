import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import HomePage from '../components/Homepage.vue' 
import Profile from '../components/Profile.vue'
import Learnmore from '../components/Learnmore.vue'
import Mentalhealth from '../components/Mentalhealth.vue'
import Physicalhealth from '../components/Physicalhealthpage.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [ 
    { path: '/' , component: Login , meta: {title: 'Login', requiresAuth: false}},
    { path: '/home' , component: HomePage , meta: {title: 'Home', requiresAuth: true}},
    {path: '/profile', component: Profile, meta: {title: 'Profile', requiresAuth: true}},
    {path: '/learnmore', component: Learnmore, meta: {title: 'Learn More', requiresAuth: true}},
    {path: '/mentalhealth', component: Mentalhealth, meta: {title: 'Mental Health', requiresAuth: true}},
    {path: '/physicalhealth', component: Physicalhealth, meta: {title: 'Physical Health', requiresAuth: true}}
  ],
})

router.beforeEach((to, from) => {
  document.title = to.meta.title || "Invalid"

  const isAuthenticated = //localStorage.getItem('isAuthenticated') === 'true'
  true
  // 1. If NOT logged in, only redirect if they aren't already going to the Login page
  if (!isAuthenticated && to.path !== '/') {
    return '/'
  }

  // 2. If LOGGED in, only redirect to home if they are trying to access the Login page
  if (isAuthenticated && to.path === '/') {
    return '/home'
  }

  // 3. Otherwise, return nothing (or true) to let the navigation happen normally
  return true
})

export default router 
