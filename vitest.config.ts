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
      // The component feature-combination matrices — `tests/matrix/<component>/`
      // — are a deliberate fuzz tier: hundreds of files that would otherwise be
      // most of the everyday `vitest run` wall clock. Excluded here the same way
      // `tests/live` is, so they only run when asked for — `npm run test:matrix`
      // (vitest.matrix.config.ts), and the "matrix suite" stage of `npm test`.
      // The extglob keeps ONE file per component collected: `smoke.test.ts`, the
      // representative slice the default loop still pays for. Helper modules
      // (matrix-utils, the per-slice `*-support.ts`) are unaffected either way —
      // this only removes files from test COLLECTION, not module resolution.
      'tests/matrix/**/!(smoke).test.ts',
      'tests/website-render.test.ts',
      'rollup.config.test.js',
      '.debug',
      '.local',
      '.research',
      '.claude/worktrees'
    ],
  },
});
