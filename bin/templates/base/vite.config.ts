import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2015',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['snice']
        }
      }
    },
    sourcemap: true,
    chunkSizeWarningLimit: 500
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : []
  }
});