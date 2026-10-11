import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the browser talks to Vite, which forwards /api to the Spring Boot backend,
// so no CORS setup is needed locally. In production set VITE_API_URL to the deployed backend URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8085', changeOrigin: true },
    },
  },
});
