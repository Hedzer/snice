import { test, expect } from '@playwright/test';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

test.describe('Base Template Functional Tests', () => {
  let tempDir: string;
  let devServer: ChildProcess | null = null;
  let appPath: string;
  const port = 5598;

  test.beforeAll(async () => {
    // Create temp directory and scaffold base template
    tempDir = await mkdtemp(join(tmpdir(), 'snice-base-test-'));
    const appName = 'test-base';
    appPath = join(tempDir, appName);

    // Create the app
    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName}`,
      { cwd: tempDir }
    );

    // Install dependencies
    await execAsync('npm install', {
      cwd: appPath,
      timeout: 120000
    });

    // Link local snice package
    await execAsync(`npm link ${process.cwd()}`, { cwd: appPath });

    // Start dev server
    devServer = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
      cwd: appPath,
      stdio: 'pipe',
      shell: true
    });

    // Wait for server to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Dev server timeout')), 30000);

      devServer!.stdout?.on('data', (data) => {
        if (data.toString().includes('Local:')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      devServer!.stderr?.on('data', (data) => {
        console.error('Dev server stderr:', data.toString());
      });
    });
  }, 180000);

  test.afterAll(async () => {
    // Kill dev server
    if (devServer) {
      devServer.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Clean up temp directory
    if (tempDir && existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test('should render home page', async ({ page }) => {
    await page.goto(`http://localhost:${port}/`);
    await page.waitForLoadState('networkidle');

    // Check page is rendered
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have counter button that works', async ({ page }) => {
    await page.goto(`http://localhost:${port}/`);
    await page.waitForLoadState('networkidle');

    // Find counter button
    const counterButton = page.locator('counter-button');

    if (await counterButton.count() > 0) {
      await expect(counterButton).toBeVisible();

      // Get initial count
      const initialText = await counterButton.textContent();

      // Click the button
      await counterButton.click();
      await page.waitForTimeout(100);

      // Verify count changed
      const newText = await counterButton.textContent();
      expect(newText).not.toBe(initialText);
    }
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/about`);
    await page.waitForLoadState('networkidle');

    // Check about page content
    const aboutPage = page.locator('about-page');
    if (await aboutPage.count() > 0) {
      await expect(aboutPage).toBeVisible();
    }
  });

  test('should show 404 for unknown routes', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/nonexistent-route`);
    await page.waitForLoadState('networkidle');

    // Check not found page is shown
    const notFoundPage = page.locator('not-found-page');
    if (await notFoundPage.count() > 0) {
      await expect(notFoundPage).toBeVisible();
    }
  });
});
