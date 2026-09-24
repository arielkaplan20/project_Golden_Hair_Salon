import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      // כל בקשה ל-/api עוברת לשרת שלנו
      '/api': 'http://localhost:5000',
    },
  },
})
