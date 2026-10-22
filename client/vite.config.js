import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// En GitHub Pages la app vive en una subcarpeta (https://usuario.github.io/SIGE-Tele/).
// El flujo de despliegue define VITE_BASE=/SIGE-Tele/; en local y en Electron queda en "/".
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    host: true, // Permite conexiones desde celulares y tablets en la misma red Wi-Fi
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
