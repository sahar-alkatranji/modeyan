import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true, // Allow all hosts (nginx proxy + direct access)
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        ws: true,
      },
      '/ws': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        ws: true,
      },
      // Uploaded files (profile images, portfolio media) are served by the
      // backend under /storage/uploads. Without this proxy the dev server
      // answers the SPA fallback HTML instead of the image, so uploaded
      // images never display.
      '/storage': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
