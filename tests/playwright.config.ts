import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  // Keep Playwright discovery out of the Vitest *.test.ts suite while still
  // including the dedicated website browser test.
  testMatch: ['**/*.spec.ts', 'website-render.test.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
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
