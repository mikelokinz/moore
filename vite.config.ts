import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const backendTarget = process.env.MOORSENSE_BACKEND_URL || 'http://127.0.0.1:8000'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: { '/api': backendTarget, '/ws': { target: backendTarget, ws: true } },
    watch: {
      ignored: ['**/images/**', '**/backend/**'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
  plugins: [react(), tailwindcss()],
})
