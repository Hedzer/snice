import { test, expect, type Page } from '@playwright/test';
import { exec, spawn, type ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const execAsync = promisify(exec);

test.describe('CLI Created App - Runtime Tests', () => {
  test.describe.configure({ mode: 'serial' });
  let tempDir: string;
  let appPath: string;
  let devServerProcess: ChildProcess | undefined;
  let testPort: number;

  test.beforeAll(async ({ browserName }, testInfo) => {
    testInfo.setTimeout(180_000);
    testPort = 20_000 + (process.pid % 20_000);
    tempDir = await mkdtemp(join(tmpdir(), 'snice-runtime-test-'));
    const appName = 'test-runtime-app';
    appPath = join(tempDir, appName);

    const { stdout: packOutput } = await execAsync(`npm pack --pack-destination ${tempDir}`, {
      cwd: process.cwd(),
      timeout: 30_000,
    });
    const tarballPath = join(tempDir, packOutput.trim().split('\n').pop()!);

    await execAsync(`node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName}`, {
      cwd: tempDir,
      timeout: 30_000,
    });

    // A single install resolves the template dependencies and replaces its
    // published snice range with the exact package under test.
    await execAsync(`npm install ${tarballPath}`, {
      cwd: appPath,
      timeout: 120_000,
    });

    devServerProcess = spawn('npx', ['vite', '--port', String(testPort), '--strictPort'], {
      cwd: appPath,
      detached: process.platform !== 'win32',
      stdio: 'ignore',
    });
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      try {
        if ((await fetch(`http://localhost:${testPort}`)).ok) break;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (Date.now() >= deadline) throw new Error(`CLI app did not start on port ${testPort}`);

    await rm(tarballPath, { force: true });
  }, 180_000);

  test.afterAll(async () => {
    if (devServerProcess?.pid) {
      try {
        if (process.platform === 'win32') devServerProcess.kill('SIGTERM');
        else process.kill(-devServerProcess.pid, 'SIGTERM');
      } catch {}
    }
    if (tempDir && existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true, maxRetries: 3 });
    }
  }, 30_000);

  async function openLogin(page: Page) {
    await page.goto(`http://localhost:${testPort}/#/login`);
    await page.locator('login-page').waitFor();
  }

  async function signIn(page: Page) {
    await openLogin(page);
    await page.getByRole('textbox', { name: 'Username' }).fill('demo@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('demo');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.locator('dashboard-page').waitFor();
  }

  test('loads the generated application', async ({ page }) => {
    await openLogin(page);
    await expect(page.locator('login-page')).toBeVisible();
  });

  test('renders the generated login page with shadow DOM', async ({ page }) => {
    await openLogin(page);
    const loginPage = page.locator('login-page');
    await expect(loginPage).toBeVisible();
    expect(await loginPage.evaluate(element => !!element.shadowRoot)).toBe(true);
  });

  test('renders the generated login component with shadow DOM', async ({ page }) => {
    await openLogin(page);
    const login = page.locator('snice-login');
    await expect(login).toBeVisible();
    expect(await login.evaluate(element => !!element.shadowRoot?.querySelector('form'))).toBe(true);
  });

  test('authenticates with the documented demo credentials', async ({ page }) => {
    await signIn(page);
    await expect(page.locator('dashboard-page')).toBeVisible();
  });

  test('preserves the application layout during navigation', async ({ page }) => {
    await signIn(page);
    const layout = page.locator('snice-layout');
    await expect(layout).toBeVisible();
    await page.evaluate(() => { location.hash = '#/settings'; });
    await expect(page.locator('settings-page')).toBeVisible();
    await expect(layout).toBeVisible();
  });

  test('renders the generated application header', async ({ page }) => {
    await signIn(page);
    const layout = page.locator('snice-layout');
    await expect(layout).toBeVisible();
    expect(await layout.evaluate(element => !!element.shadowRoot?.querySelector('header'))).toBe(true);
  });

  test('replaces routed pages instead of stacking them', async ({ page }) => {
    await signIn(page);
    await page.evaluate(() => { location.hash = '#/settings'; });
    await expect(page.locator('settings-page')).toBeVisible();
    await page.evaluate(() => { location.hash = '#/dashboard'; });
    await expect(page.locator('dashboard-page')).toBeVisible();
    await expect(page.locator('[slot="page"]')).toHaveCount(1);
  });

  test('runs the generated login workflow without page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await signIn(page);
    expect(errors).toEqual([]);
  });
});
