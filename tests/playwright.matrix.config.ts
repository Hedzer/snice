import { defineConfig, devices } from '@playwright/test';

/**
 * The TRUE-VISUAL component matrices — an ON-DEMAND tier.
 *
 * One directory per component under `live/matrix/`, each spec driving that
 * component's own fixture page.
 *
 * Run it with `npm run test:matrix:visual`. It is deliberately NOT part of
 * `npm test`, not part of `npm run test:browser:framework`, and not reachable
 * from `tests/playwright.config.ts` (whose `testDir: '.'` would otherwise sweep
 * these specs into the everyday browser gate). That is why this tier gets its
 * own config with its own `testDir` rather than a project filter: the two
 * suites must not be able to pull each other in by accident.
 *
 * Chromium is the default engine — the runner passes `--project=chromium`
 * unless `--all-engines` is given. See tooling/testing/run-visual-matrix-tests.js.
 */
export default defineConfig({
  testDir: './live/matrix',
  testMatch: ['**/*.spec.ts'],

  // Layer-1 combos share ONE page per worker (see matrix-harness `openStage`),
  // which is where this tier's speed comes from. Playwright gives each worker
  // its own module instance, so parallel workers each build their own stage and
  // the combos still spread across all of them.
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'line',

  // A layer-1 combo is a mount plus one evaluate; a marquee test is a real
  // screenshot. Neither should ever need twenty seconds, and a generous timeout
  // here would hide the cost regressions this tier's budget depends on noticing.
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: 'http://localhost:5566',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 900 },
  },

  // Relative to THIS FILE's directory (tests/), so the leading `..` is what
  // keeps failure artifacts in the repo-root `test-results/` — next to the
  // marquee PNGs pixel-probe.ts writes — instead of creating a stray
  // `tests/test-results/`.
  outputDir: '../test-results/matrix-visual-runs',

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
