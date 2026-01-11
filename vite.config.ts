import { defineConfig } from 'vite';

export default defineConfig({
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
