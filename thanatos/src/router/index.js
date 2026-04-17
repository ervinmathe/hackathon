import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import HomePage from '../components/Homepage.vue' 
import Profile from '../components/Profile.vue'
import Learnmore from '../components/Learnmore.vue'
import Mentalhealth from '../components/Mentalhealth.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [ 
    { path: '/' , component: Login , meta: {title: 'Login', requiresAuth: false}},
    { path: '/home' , component: HomePage , meta: {title: 'Home', requiresAuth: true}},
    {path: '/profile', component: Profile, meta: {title: 'Profile', requiresAuth: true}},
    {path: '/learnmore', component: Learnmore, meta: {title: 'Learn More', requiresAuth: true}},
    {path: '/mentalhealth', component: Mentalhealth, meta: {title: 'Mental Health', requiresAuth: true}},
  ],
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || "Invalid"

  const isAuthenticated = //localStorage.getItem('isAuthenticated') === 'true'
  /*kivenni majd ezt*/true

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ path: '/' })
  } else if (to.path === '/' && isAuthenticated) {
    next({ path: '/home' })
  } else {
    next()
  }
})

export default router 
