import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const replitDomain = process.env.REPLIT_DEV_DOMAIN

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    hmr: replitDomain
      ? { host: replitDomain, clientPort: 443, protocol: 'wss' }
      : true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
  },
})
