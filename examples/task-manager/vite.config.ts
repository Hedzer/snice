import { defineConfig } from 'vite';
import snice from 'snice/vite';

export default defineConfig({
  plugins: [snice()],
  build: {
    target: 'es2022',
    minify: 'terser',
    cssMinify: true,
    sourcemap: true,
  },
});
