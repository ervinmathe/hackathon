import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import HomePage from '../components/Homepage.vue' 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [ 
    { path: '/login' , component: Login},
    { path: '/home' , component: HomePage}
  ],
})

export default router
