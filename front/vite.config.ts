import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to backend
      // Backend API paths start with /api
      '/api': {
        target: 'http://localhost:5146',
        changeOrigin: true,
        // Keep the /api prefix when forwarding
      },
      '/swagger': {
        target: 'http://localhost:5146',
        changeOrigin: true,
      },
      // Proxy SignalR requests to backend
      '/hubs': {
        target: 'http://localhost:5146',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxy
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
})
