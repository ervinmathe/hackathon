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
    async refreshUser() {
      if (!this.user?.id) return
      try {
        const response = await api.get(`/auth/profile/${this.user.id}`)
        this.updateUser(response.data)
      } catch (error) {
        console.error('Failed to refresh user data:', error)
      }
    },
    updateUser(userData) {
      this.user = { ...this.user, ...userData }
      localStorage.setItem('user', JSON.stringify(this.user))
    },
    logout(router) {
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('user')
      // Call backend logout
      api.post('/auth/logout').catch(() => {})
      // Redirect if router is provided
      if (router) {
        router.push('/')
      }
    }
  }
})
