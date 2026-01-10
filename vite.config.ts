import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: 'localhost',
    open: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000
    }
  },
  build: {
    target: 'ES2020',
    outDir: 'dist',
    minify: 'terser'
  }
});
