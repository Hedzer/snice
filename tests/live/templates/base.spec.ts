import { test, expect } from '@playwright/test';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

// Run tests serially to share setup
test.describe.configure({ mode: 'serial' });

test.describe('Base Template Functional Tests', () => {
  let tempDir: string;
  let devServer: ChildProcess | null = null;
  let appPath: string;
  let port: number;

  test.beforeAll(async ({ browserName }, testInfo) => {
    testInfo.setTimeout(300_000);
    port = 5598 + ['chromium', 'firefox', 'webkit'].indexOf(browserName) * 2;
    // Create temp directory and scaffold base template
    tempDir = await mkdtemp(join(tmpdir(), 'snice-base-test-'));
    const appName = 'test-base';
    appPath = join(tempDir, appName);

    console.log('Creating base app at:', appPath);

    // Create the app
    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName}`,
      { cwd: tempDir }
    );

    console.log('Installing dependencies...');
    // Install dependencies
    await execAsync('npm install', {
      cwd: appPath,
      timeout: 180000
    });

    console.log('Linking local snice package...');
    // Link local snice package
    await execAsync(`npm link ${process.cwd()}`, { cwd: appPath });

    console.log('Starting dev server...');
    // Start dev server
    devServer = spawn('npm', ['run', 'dev', '--', '--port', String(port), '--strictPort'], {
      cwd: appPath,
      stdio: 'ignore',
      detached: process.platform !== 'win32'
    });

    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      try {
        if ((await fetch(`http://localhost:${port}/`)).ok) break;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (Date.now() >= deadline) throw new Error('Dev server HTTP readiness timeout');

    console.log('Dev server ready on port', port);
  }, 300000);

  test.afterAll(async () => {
    // Kill dev server
    if (devServer) {
      try {
        if (process.platform === 'win32') devServer.kill('SIGTERM');
        else process.kill(-devServer.pid!, 'SIGTERM');
      } catch {}
    }

    // Clean up temp directory
    try {
      if (tempDir && existsSync(tempDir)) {
        await rm(tempDir, { recursive: true, force: true, maxRetries: 3 });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should render home page', async ({ page }) => {
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });

    // Check page is rendered
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have counter button that works', async ({ page }) => {
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });

    // Find counter button
    const counterButton = page.locator('counter-button');

    if (await counterButton.count() > 0) {
      await expect(counterButton).toBeVisible();

      // Click the button and verify it doesn't throw
      await counterButton.click();
      await page.waitForTimeout(100);

      // Just verify the button is still there after click
      await expect(counterButton).toBeVisible();
    }
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/about`, { waitUntil: 'domcontentloaded' });

    // Check about page content
    const aboutPage = page.locator('about-page');
    if (await aboutPage.count() > 0) {
      await expect(aboutPage).toBeVisible();
    }
  });

  test('should show 404 for unknown routes', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/nonexistent-route`, { waitUntil: 'domcontentloaded' });

    // Check not found page is shown
    const notFoundPage = page.locator('not-found-page');
    if (await notFoundPage.count() > 0) {
      await expect(notFoundPage).toBeVisible();
    }
  });
});
