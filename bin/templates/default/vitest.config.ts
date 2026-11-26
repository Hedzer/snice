import { defineConfig } from 'vitest/config';
import snice from 'snice/vite';

export default defineConfig({
  plugins: [snice()],
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/**',
      ],
    },
  },
});
