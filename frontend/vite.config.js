import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,        // bind to all interfaces so localhost AND 127.0.0.1 both work
    proxy: {
      // Everything to /api/* is forwarded to the Flask backend.
      // The browser sees same-origin → no CORS dance.
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
