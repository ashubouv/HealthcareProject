import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the Express backend so the frontend can use
    // relative /api paths (no CORS, no hardcoded host).
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
