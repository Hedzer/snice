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

    console.log('Creating PWA app at:', appPath);

    // Create the app
    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName} --template=pwa`,
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
    devServer = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
      cwd: appPath,
      stdio: 'pipe',
      shell: true
    });

    // Wait for server to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Dev server timeout')), 60000);

      devServer!.stdout?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Local:') || output.includes('localhost')) {
          clearTimeout(timeout);
          setTimeout(resolve, 1000); // Give it a moment to stabilize
        }
      });

      devServer!.stderr?.on('data', (data) => {
        const err = data.toString();
        if (err.includes('Error:')) {
          clearTimeout(timeout);
          reject(new Error(err));
        }
      });
    });

    console.log('Dev server ready on port', port);
  }, 300000);

  test.afterAll(async () => {
    // Kill dev server
    if (devServer) {
      devServer.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 2000));
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

  test('should render login page', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check login page is rendered
    const loginPage = page.locator('login-page');
    await expect(loginPage).toBeVisible({ timeout: 10000 });

    // Check login component is rendered inside
    const loginComponent = page.locator('snice-login');
    await expect(loginComponent).toBeVisible({ timeout: 10000 });
  });

  test('should show demo credentials hint', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check demo credentials are shown (could be in slot or shadow DOM)
    await expect(page.getByText('demo@example.com')).toBeVisible({ timeout: 10000 });
  });

  test('should have working form inputs', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find and fill username input (in shadow DOM)
    const usernameInput = page.locator('input#username');
    await usernameInput.fill('test@example.com');
    await expect(usernameInput).toHaveValue('test@example.com');

    // Find and fill password input
    const passwordInput = page.locator('input#password');
    await passwordInput.fill('testpassword');
    await expect(passwordInput).toHaveValue('testpassword');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Fill invalid credentials
    const usernameInput = page.locator('input#username');
    const passwordInput = page.locator('input#password');

    await usernameInput.fill('wrong@example.com');
    await passwordInput.fill('wrongpassword');

    // Click sign in button
    const submitButton = page.locator('snice-button');
    await submitButton.click();

    // Wait for error to appear
    await page.waitForTimeout(2000);

    // Check error message is shown
    const alert = page.locator('snice-alert');
    await expect(alert).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to dashboard on successful login', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Fill valid credentials
    const usernameInput = page.locator('input#username');
    const passwordInput = page.locator('input#password');

    await usernameInput.fill('demo@example.com');
    await passwordInput.fill('demo');

    // Click sign in button
    const submitButton = page.locator('snice-button');
    await submitButton.click();

    // Wait for navigation
    await page.waitForURL(`http://localhost:${port}/#/dashboard`, { timeout: 10000 });

    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard');
  });

  test('should have no scrollbars on login page', async ({ page }) => {
    await page.goto(`http://localhost:${port}/#/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check that the login page doesn't have overflow
    const hasScrollbar = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight;
    });

    expect(hasScrollbar).toBe(false);
  });
});
