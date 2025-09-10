import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'examples/',
        'dist/',
      ],
    },
    exclude: [
      'node_modules',
      'dist',
      'examples',
      'tests/live'
    ],
  },
});