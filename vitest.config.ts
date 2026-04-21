import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  resolve: {
    alias: {
      'snice/transitions': new URL('./src/transitions.ts', import.meta.url).pathname,
      'snice': new URL('./src/index.ts', import.meta.url).pathname,
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
      'rollup.config.test.js',
      '.debug',
      '.claude/worktrees'
    ],
  },
});