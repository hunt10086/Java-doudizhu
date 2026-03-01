import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis'
  },
  server: {
    port: 9654,
    proxy: {
      '/api': {
        target: 'http://localhost:8118',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
