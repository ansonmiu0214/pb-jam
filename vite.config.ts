import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: false
    // Let Vite auto-detect HMR connection
  },
  build: {
    target: 'ES2020',
    outDir: 'dist',
    minify: 'terser'
  }
});
