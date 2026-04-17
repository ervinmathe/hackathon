import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  test: {
    environment: 'jsdom',
    globals: true
  },
  server: {
    allowedHosts: ['sisters-protective-spend-mitchell.trycloudflare.com'],
    proxy: {
      '/auth': 'http://localhost:3000',
      '/forums': 'http://localhost:3000',
      '/calendar': 'http://localhost:3000',
      '/posts': 'http://localhost:3000'
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
