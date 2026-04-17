import { defineStore } from 'pinia'
import api from '../api/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('user'),
  }),
  actions: {
    async login(email, password) {
      try {
        const response = await api.post('/auth/login', { email, password })
        this.user = response.data.user
        this.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(this.user))
        return response.data
      } catch (error) {
        this.logout()
        throw error
      }
    },
    async register(userData) {
      try {
        const response = await api.post('/auth/register', userData)
        // Auto-login after register if backend returns user/session
        if (response.data.user) {
          this.user = response.data.user
          this.isAuthenticated = true
          localStorage.setItem('user', JSON.stringify(this.user))
        }
        return response.data
      } catch (error) {
        throw error
      }
    },
    logout() {
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('user')
      // Optional: call backend logout if session-based
      api.post('/auth/logout').catch(() => {})
    }
  }
})
