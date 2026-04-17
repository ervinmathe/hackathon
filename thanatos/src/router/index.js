import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import HomePage from '../components/Homepage.vue' 
import { ref } from 'vue'
import Profile from '../components/Profile.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [ 
    { path: '/' , component: Login , meta: {title: 'Login'}},
    { path: '/home' , component: HomePage , meta: {title: 'Home'}},
    {path: '/profile', component: Profile, meta: {title: 'Profile'}}
  ],
})

router.beforeEach((e) => {
  document.title = e.meta.title || "Invalid"
})

router.beforeEach((to) => {
  if (to.path === '/home' && !allow.value) {
    return { path: '/' }
  }
  allow.value = false
})

export default router

export const allow = ref(false) 
