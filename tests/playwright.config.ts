import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  // Keep Playwright discovery out of the Vitest *.test.ts suite while still
  // including the dedicated website browser test.
  testMatch: ['**/*.spec.ts', 'website-render.test.ts'],
  // The true-visual table matrix is an ON-DEMAND tier and must never be pulled
  // into the required browser gate. `testDir: '.'` above would otherwise sweep
  // it in, because `npm run test:browser:framework` targets all of tests/live.
  // It runs only through `npm run test:matrix:visual`
  // (tests/playwright.matrix.config.ts).
  testIgnore: ['live/matrix/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // one local retry: managed-server blips must not fail hundreds of specs
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  // Browser gates run alongside source, built, CDN, and React validation in
  // the release matrix. Preserve every assertion while allowing async UI work
  // to settle during temporary whole-machine contention.
  expect: { timeout: 20_000 },
  use: {
    baseURL: 'http://localhost:5566',
    trace: 'on-first-retry',
  },
  
  // Don't generate test-results folder
  outputDir: undefined,
  
  // Expect vite dev server to be running
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
