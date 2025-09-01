// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080', // Spring on 8080
        changeOrigin: true,
        // IMPORTANT: no rewrite — backend path already starts with /api
        // rewrite: (p) => p.replace(/^\/api/, ''), // <- leave commented
      },
    },
  },
})
