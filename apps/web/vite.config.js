import dotenv from 'dotenv'
dotenv.config('./.env.local')

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const { PORT = 3001 } = process.env;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '^/(execute|checkin)': {
        target: `http://localhost:${PORT}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist/app',
  },
})