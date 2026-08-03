import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  resolve: {
    alias: {
      'snice/transitions': new URL('./packages/core/src/transitions.ts', import.meta.url).pathname,
      'snice': new URL('./packages/core/src/index.ts', import.meta.url).pathname,
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        target: 'es2022',
        transform: {
          decoratorMetadata: false,
          decoratorVersion: '2022-03',
          useDefineForClassFields: false,
        },
      },
    }),
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    // Component tests import production styles with `?inline`. Without CSS
    // processing Vitest replaces every stylesheet with an empty string, so a
    // broken or missing stylesheet can pass the entire unit suite unnoticed.
    css: true,
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
      'tests/live',
      'tests/website-render.test.ts',
      'rollup.config.test.js',
      '.debug',
      '.local',
      '.claude/worktrees'
    ],
  },
});
