import { test, expect } from '@playwright/test';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

test.describe('PWA Template Functional Tests', () => {
  let tempDir: string;
  let devServer: ChildProcess | null = null;
  let appPath: string;
  const port = 5599;

  test.beforeAll(async () => {
    // Create temp directory and scaffold PWA template
    tempDir = await mkdtemp(join(tmpdir(), 'snice-pwa-test-'));
    const appName = 'test-pwa';
    appPath = join(tempDir, appName);

    // Create the app
    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName} --template=pwa`,
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

  test('should render login page', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/login`);
    await page.waitForLoadState('networkidle');

    // Check login component is rendered
    const loginComponent = page.locator('snice-login');
    await expect(loginComponent).toBeVisible();
  });

  test('should show demo credentials hint', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/login`);
    await page.waitForLoadState('networkidle');

    // Check demo credentials are shown
    await expect(page.getByText('demo@example.com')).toBeVisible();
  });

  test('should have working form inputs', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/login`);
    await page.waitForLoadState('networkidle');

    // Find and fill username input
    const usernameInput = page.locator('snice-login').locator('input[name="username"]');
    await usernameInput.fill('test@example.com');
    await expect(usernameInput).toHaveValue('test@example.com');

    // Find and fill password input
    const passwordInput = page.locator('snice-login').locator('input[name="password"]');
    await passwordInput.fill('testpassword');
    await expect(passwordInput).toHaveValue('testpassword');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/login`);
    await page.waitForLoadState('networkidle');

    // Fill invalid credentials
    const usernameInput = page.locator('snice-login').locator('input[name="username"]');
    const passwordInput = page.locator('snice-login').locator('input[name="password"]');

    await usernameInput.fill('wrong@example.com');
    await passwordInput.fill('wrongpassword');

    // Click sign in button
    const submitButton = page.locator('snice-login snice-button');
    await submitButton.click();

    // Wait for error to appear
    await page.waitForTimeout(1000);

    // Check error message is shown
    const alert = page.locator('snice-login snice-alert');
    await expect(alert).toBeVisible();
  });

  test('should navigate to dashboard on successful login', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/login`);
    await page.waitForLoadState('networkidle');

    // Fill valid credentials
    const usernameInput = page.locator('snice-login').locator('input[name="username"]');
    const passwordInput = page.locator('snice-login').locator('input[name="password"]');

    await usernameInput.fill('demo@example.com');
    await passwordInput.fill('demo');

    // Click sign in button
    const submitButton = page.locator('snice-login snice-button');
    await submitButton.click();

    // Wait for navigation
    await page.waitForURL(`http://localhost:${port}/#/dashboard`, { timeout: 5000 });

    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard');
  });

  test('should have no scrollbars on login page', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/login`);
    await page.waitForLoadState('networkidle');

    // Check that the login page doesn't have overflow
    const hasScrollbar = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight;
    });

    expect(hasScrollbar).toBe(false);
  });
});
