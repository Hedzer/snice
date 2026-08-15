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
      // The table feature-combination matrix is a deliberate fuzz tier: 52
      // files that take ~100s on their own, which is most of the everyday
      // `vitest run` wall clock. Excluded here the same way `tests/live` is, so
      // it only runs when it is asked for — `npm run test:matrix`, and the
      // "table matrix suite" stage of `npm test`. The everyday loop still pays
      // for a representative slice: `tests/components/table-matrix-smoke.test.ts`
      // is deliberately OUTSIDE this directory so it stays in the default
      // include. Helper modules under table-matrix/ (matrix-utils and the
      // per-slice `*-support.ts`) are still importable from here — this pattern
      // only removes files from test COLLECTION, not from module resolution.
      'tests/components/table-matrix',
      'tests/website-render.test.ts',
      'rollup.config.test.js',
      '.debug',
      '.local',
      '.research',
      '.claude/worktrees'
    ],
  },
});
