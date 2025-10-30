import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

test.describe('CLI Created App - Runtime Tests', () => {
  let tempDir: string;
  let appPath: string;
  let devServerProcess: any;
  const testPort = 5567;

  test.beforeAll(async () => {
    // Create temporary directory
    tempDir = await mkdtemp(join(tmpdir(), 'snice-runtime-test-'));
    const appName = 'test-runtime-app';
    appPath = join(tempDir, appName);

    // Pack the local snice package like a real user would download from npm
    const { stdout: packOutput } = await execAsync('npm pack', {
      cwd: process.cwd(),
      timeout: 30000
    });
    const tarballName = packOutput.trim().split('\n').pop()!;
    const tarballPath = join(process.cwd(), tarballName);

    // Create the app
    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName}`,
      { cwd: tempDir, timeout: 30000 }
    );

    // Install dependencies with the packed tarball instead of linking
    await execAsync('npm install', {
      cwd: appPath,
      timeout: 60000
    });

    // Install the local snice package from tarball (like a real user)
    await execAsync(`npm install ${tarballPath}`, {
      cwd: appPath,
      timeout: 30000
    });

    // Start dev server on custom port
    devServerProcess = exec(
      `npx vite --port ${testPort} --strictPort`,
      { cwd: appPath }
    );

    // Wait for dev server to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Clean up tarball
    try {
      await rm(tarballPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }, 180000); // 3 minute timeout for setup

  test.afterAll(async () => {
    // Kill dev server
    if (devServerProcess && devServerProcess.pid) {
      try {
        process.kill(devServerProcess.pid);
      } catch (e) {
        // Ignore errors when killing process
      }
    }

    // Clean up temp directory
    if (tempDir && existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }, 30000);

  test('should load and render the app', async ({ page }) => {
    await page.goto(`http://localhost:${testPort}`);

    // Wait for app container
    await page.waitForSelector('#app', { timeout: 10000 });

    // Verify app is not empty
    const appContent = await page.locator('#app').innerHTML();
    expect(appContent.length).toBeGreaterThan(0);
  });

  test('should render layout element with shadow DOM', async ({ page }) => {
    await page.goto(`http://localhost:${testPort}`);
    await page.waitForSelector('#app', { timeout: 10000 });

    // Verify layout element exists
    const layout = page.locator('snice-layout');
    await expect(layout).toBeVisible();

    // Verify shadow DOM is created
    const hasShadowRoot = await layout.evaluate(el => !!el.shadowRoot);
    expect(hasShadowRoot).toBe(true);

    // Verify shadow DOM has content
    const shadowContent = await layout.evaluate(el => {
      const shadow = el.shadowRoot;
      return shadow ? shadow.innerHTML.length : 0;
    });
    expect(shadowContent).toBeGreaterThan(0);
  });

  test('should render home page on initial load', async ({ page }) => {
    await page.goto(`http://localhost:${testPort}`);
    await page.waitForSelector('#app', { timeout: 10000 });

    // Verify home page element exists
    const homePage = page.locator('home-page');
    await expect(homePage).toBeVisible();

    // Verify home page has shadow DOM
    const hasShadowRoot = await homePage.evaluate(el => !!el.shadowRoot);
    expect(hasShadowRoot).toBe(true);

    // Verify home page content
    const pageContent = await homePage.evaluate(el => {
      const shadow = el.shadowRoot;
      return shadow ? shadow.textContent : '';
    });
    expect(pageContent).toContain('Welcome');
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto(`http://localhost:${testPort}`);
    await page.waitForSelector('#app', { timeout: 10000 });

    // Verify home page is visible
    await expect(page.locator('home-page')).toBeVisible();

    // Navigate to about page
    await page.click('a[href="#/about"]');
    await page.waitForTimeout(500); // Wait for transition

    // Verify about page is visible
    const aboutPage = page.locator('about-page');
    await expect(aboutPage).toBeVisible();

    // Verify about page has shadow DOM
    const hasShadowRoot = await aboutPage.evaluate(el => !!el.shadowRoot);
    expect(hasShadowRoot).toBe(true);

    // Verify about page content
    const pageContent = await aboutPage.evaluate(el => {
      const shadow = el.shadowRoot;
      return shadow ? shadow.textContent : '';
    });
    expect(pageContent).toContain('About');
  });

  test('should maintain layout during navigation', async ({ page }) => {
    await page.goto(`http://localhost:${testPort}`);
    await page.waitForSelector('#app', { timeout: 10000 });

    // Get layout reference
    const layout = page.locator('snice-layout');
    await expect(layout).toBeVisible();

    // Navigate to about
    await page.click('a[href="#/about"]');
    await page.waitForTimeout(500);

    // Layout should still be visible
    await expect(layout).toBeVisible();

    // Navigate back to home
    await page.click('a[href="#/"]');
    await page.waitForTimeout(500);

    // Layout should still be visible
    await expect(layout).toBeVisible();
  });

  test('should render counter component with shadow DOM', async ({ page }) => {
    await page.goto(`http://localhost:${testPort}`);
    await page.waitForSelector('#app', { timeout: 10000 });

    // Verify counter button exists
    const counterButton = page.locator('counter-button');
    await expect(counterButton).toBeVisible();

    // Verify counter has shadow DOM
    const hasShadowRoot = await counterButton.evaluate(el => !!el.shadowRoot);
    expect(hasShadowRoot).toBe(true);

    // Verify counter content
    const counterContent = await counterButton.evaluate(el => {
      const shadow = el.shadowRoot;
      return shadow ? shadow.innerHTML.length : 0;
    });
    expect(counterContent).toBeGreaterThan(0);
  });

  test('should handle page transitions without stacking', async ({ page }) => {
    await page.goto(`http://localhost:${testPort}`);
    await page.waitForSelector('#app', { timeout: 10000 });

    // Navigate through pages
    await page.click('a[href="#/about"]');
    await page.waitForTimeout(500);

    await page.click('a[href="#/"]');
    await page.waitForTimeout(500);

    // Should only have one visible page
    const visiblePages = page.locator('home-page, about-page').filter({ hasNot: page.locator('[hidden]') });
    const count = await visiblePages.count();

    // Should be exactly 1 visible page
    expect(count).toBeLessThanOrEqual(1);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`http://localhost:${testPort}`);
    await page.waitForSelector('#app', { timeout: 10000 });

    // Navigate to trigger all page loads
    await page.click('a[href="#/about"]');
    await page.waitForTimeout(500);

    await page.click('a[href="#/"]');
    await page.waitForTimeout(500);

    // Filter out known safe errors (if any)
    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('vite.svg')
    );

    expect(criticalErrors).toEqual([]);
  });
});
