import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

/**
 * Runtime files that make up the declarative rendering engine. Barrel files,
 * type-only modules, adapters, and component implementations are deliberately
 * outside this gate and retain their existing suites.
 */
const coreEngine = [
  'packages/core/src/element.ts',
  'packages/core/src/parts.ts',
  'packages/core/src/reactive.ts',
  'packages/core/src/render-root.ts',
  'packages/core/src/render.ts',
  'packages/core/src/repeat.ts',
  'packages/core/src/snice-element.ts',
  'packages/core/src/template.ts'
];

export default mergeConfig(baseConfig, defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      all: true,
      include: coreEngine,
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage/core-engine',
      thresholds: {
        // Strictly greater than 90%; a result that rounds to exactly 90 fails.
        statements: 90.01,
        branches: 90.01,
        functions: 90.01,
        lines: 90.01
      }
    }
  }
}));
