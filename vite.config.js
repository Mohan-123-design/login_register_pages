import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        configure: function (proxy) {
          proxy.on('error', function (err) {
            if (err && err.code !== 'ECONNABORTED' && err.code !== 'ECONNRESET') {
              console.error('[vite] proxy error:', err);
            }
          });
        },
      }
    }
  }
})